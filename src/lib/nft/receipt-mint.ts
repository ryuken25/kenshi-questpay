import "server-only";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon, polygonAmoy } from "viem/chains";
import { query, queryManyOptional } from "@/lib/db";
import { isNftReceiptsEnabled } from "./flag";

/**
 * NFT proof-of-purchase receipts (soulbound ERC-721).
 *
 * DELIBERATELY DECOUPLED from the payment path: nothing here is called from
 * verify-payment / release. An async sweeper picks up orders that are already
 * `paid` (or later) and still have `nft_status='none'|'failed'`, so the money
 * path has zero knowledge of minting. A mint failure only ever writes the
 * `nft_*` columns — order.status and payments are never touched.
 *
 * Everything is gated behind ENABLE_NFT_RECEIPTS. With the flag off, every
 * entry point returns a disabled result without touching chain or DB.
 */

const RECEIPT_ABI = parseAbi([
  "function mintReceipt(address to, uint256 orderId) returns (uint256)",
  "function receiptForOrder(uint256 orderId) view returns (uint256)",
]);

/** Max mint attempts per order before we stop retrying (persisted in nft_attempts). */
export const MAX_MINT_ATTEMPTS = 5;

/** Order statuses that mean "payment settled" — only these are eligible for a receipt. */
const PAID_OR_LATER = [
  "paid",
  "work_submitted",
  "in_progress",
  "awaiting_client",
  "ready_for_review",
  "reviewing",
  "accepted",
  "delivered",
  "released",
  "completed",
];

export { isNftReceiptsEnabled };

export function getReceiptContractAddress(): Address | null {
  const raw = process.env.NFT_RECEIPT_CONTRACT_ADDRESS?.trim();
  if (!raw || !/^0x[a-fA-F0-9]{40}$/.test(raw)) return null;
  return raw as Address;
}

function getMinterKey(): Hex | null {
  const raw = process.env.NFT_MINTER_PRIVATE_KEY?.trim();
  if (!raw) return null;
  const normalized = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[a-fA-F0-9]{64}$/.test(normalized)) return null;
  return normalized as Hex;
}

export function getReceiptChainId(): number {
  const raw = Number(process.env.NFT_RECEIPT_CHAIN_ID || 137);
  return Number.isFinite(raw) ? raw : 137;
}

function getChain() {
  return getReceiptChainId() === polygonAmoy.id ? polygonAmoy : polygon;
}

function getRpcUrl(): string {
  if (getReceiptChainId() === polygonAmoy.id) {
    return process.env.POLYGON_AMOY_RPC_URL?.trim() || "https://rpc-amoy.polygon.technology";
  }
  return (
    process.env.POLYGON_RPC_URLS?.split(",")[0]?.trim() ||
    process.env.POLYGON_RPC_URL?.trim() ||
    "https://polygon-bor-rpc.publicnode.com"
  );
}

/** Sanitized readiness snapshot (never exposes the key). */
export function getNftReceiptStatus() {
  const contract = getReceiptContractAddress();
  return {
    enabled: isNftReceiptsEnabled(),
    contractConfigured: Boolean(contract),
    contract: contract ?? null,
    minterConfigured: Boolean(getMinterKey()),
    chainId: getReceiptChainId(),
    /** True when a mint can actually be attempted. */
    ready: Boolean(isNftReceiptsEnabled() && contract && getMinterKey()),
  };
}

/**
 * Map an order UUID to a deterministic uint256 for the contract's orderId.
 * A UUID is 128 bits, so the hex form fits in uint256 with no collision risk.
 */
export function orderUuidToUint256(orderId: string): bigint {
  const hex = orderId.replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) {
    throw new Error("order id is not a uuid");
  }
  return BigInt(`0x${hex}`);
}

export type MintOutcome =
  | { ok: true; skipped: true; reason: string }
  | { ok: true; skipped: false; tokenId: string; txHash: string | null; alreadyOnChain: boolean }
  | { ok: false; error: string };

type SweepRow = {
  id: string;
  public_order_id: string;
  nft_status: string;
  nft_attempts: number;
  buyer_wallet: string | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Mint (or recover) the receipt for a single already-paid order.
 * Idempotent: consults the contract's receiptForOrder before minting, so a
 * crash after broadcast is reconciled instead of double-minting.
 */
export async function mintReceiptForOrder(row: SweepRow): Promise<MintOutcome> {
  if (!isNftReceiptsEnabled()) return { ok: true, skipped: true, reason: "flag_disabled" };

  const contract = getReceiptContractAddress();
  const key = getMinterKey();
  if (!contract) return { ok: true, skipped: true, reason: "contract_not_configured" };
  if (!key) return { ok: true, skipped: true, reason: "minter_not_configured" };

  const to = (row.buyer_wallet || "").trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
    await recordFailure(row.id, "buyer_wallet_missing");
    return { ok: true, skipped: true, reason: "buyer_wallet_missing" };
  }

  const chain = getChain();
  const transport = http(getRpcUrl(), { timeout: 15_000 });
  const publicClient = createPublicClient({ chain, transport });
  const account = privateKeyToAccount(key);
  const wallet = createWalletClient({ account, chain, transport });
  const orderIdOnChain = orderUuidToUint256(row.id);

  await query(
    `UPDATE orders SET nft_status='pending', nft_attempts = nft_attempts + 1, updated_at = now() WHERE id = $1`,
    [row.id],
  );

  try {
    // Idempotency: already minted on-chain? Reconcile instead of minting again.
    const existing = (await publicClient.readContract({
      address: contract,
      abi: RECEIPT_ABI,
      functionName: "receiptForOrder",
      args: [orderIdOnChain],
    })) as bigint;

    if (existing > 0n) {
      await recordMinted(row.id, existing.toString(), null, contract, chain.id);
      return { ok: true, skipped: false, tokenId: existing.toString(), txHash: null, alreadyOnChain: true };
    }

    // Transient-failure retry with exponential backoff (network/nonce blips).
    let lastErr = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const txHash = await wallet.writeContract({
          account,
          chain,
          address: contract,
          abi: RECEIPT_ABI,
          functionName: "mintReceipt",
          args: [to as Address, orderIdOnChain],
        });
        await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 90_000 }).catch(() => null);

        const tokenId = (await publicClient.readContract({
          address: contract,
          abi: RECEIPT_ABI,
          functionName: "receiptForOrder",
          args: [orderIdOnChain],
        })) as bigint;

        await recordMinted(row.id, tokenId.toString(), txHash, contract, chain.id);
        return { ok: true, skipped: false, tokenId: tokenId.toString(), txHash, alreadyOnChain: false };
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        if (attempt < 2) await sleep(1000 * 2 ** attempt);
      }
    }
    await recordFailure(row.id, lastErr);
    return { ok: false, error: lastErr };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await recordFailure(row.id, msg);
    return { ok: false, error: msg };
  }
}

async function recordMinted(
  orderId: string,
  tokenId: string,
  txHash: string | null,
  contract: string,
  chainId: number,
) {
  await query(
    `UPDATE orders
       SET nft_status='minted', nft_token_id=$2, nft_mint_tx=$3, nft_contract=$4,
           nft_chain_id=$5, nft_minted_at=now(), nft_last_error=NULL, updated_at=now()
     WHERE id=$1`,
    [orderId, tokenId, txHash ? txHash.toLowerCase() : null, contract.toLowerCase(), chainId],
  );
}

async function recordFailure(orderId: string, error: string) {
  await query(
    `UPDATE orders
       SET nft_status = CASE WHEN nft_attempts >= $3 THEN 'failed' ELSE 'none' END,
           nft_last_error = $2, updated_at = now()
     WHERE id = $1`,
    [orderId, error.slice(0, 500), MAX_MINT_ATTEMPTS],
  );
}

/**
 * Find paid orders still awaiting a receipt and mint them.
 * Safe to call repeatedly (cron / manual). No-op when the flag is off.
 */
export async function sweepReceiptMints(limit = 10) {
  if (!isNftReceiptsEnabled()) {
    return { enabled: false, scanned: 0, minted: 0, failed: 0, skipped: 0, results: [] as unknown[] };
  }

  const rows = await queryManyOptional<SweepRow>(
    `SELECT o.id, o.public_order_id, o.nft_status, o.nft_attempts,
            (SELECT p.from_address FROM payments p
              WHERE p.order_id = o.id AND p.from_address IS NOT NULL
              ORDER BY p.created_at ASC LIMIT 1) AS buyer_wallet
       FROM orders o
      WHERE o.status = ANY($1::text[])
        AND o.nft_status IN ('none','failed')
        AND o.nft_attempts < $2
      ORDER BY o.paid_at ASC NULLS LAST
      LIMIT $3`,
    [PAID_OR_LATER, MAX_MINT_ATTEMPTS, limit],
  );

  let minted = 0;
  let failed = 0;
  let skipped = 0;
  const results: { order: string; outcome: string; tokenId?: string }[] = [];

  for (const row of rows) {
    const out = await mintReceiptForOrder(row);
    if (!out.ok) {
      failed++;
      results.push({ order: row.public_order_id, outcome: "failed" });
    } else if (out.skipped) {
      skipped++;
      results.push({ order: row.public_order_id, outcome: `skipped:${out.reason}` });
    } else {
      minted++;
      results.push({ order: row.public_order_id, outcome: "minted", tokenId: out.tokenId });
    }
  }

  return { enabled: true, scanned: rows.length, minted, failed, skipped, results };
}
