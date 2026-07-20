import "server-only";
import {
  createWalletClient,
  http,
  parseAbi,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon, bsc } from "viem/chains";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  QUESTPAY_RECEIVE_ADDRESS,
  receiveAddressValid,
  POLYGON_RPC_URL,
  isValidAddress,
} from "@/lib/server-config";
import { getChainClient } from "@/lib/viem-server";
import {
  chainKeyFromId,
  getTokenConfig,
  type TokenSymbol,
  NETWORKS,
} from "@/lib/services";

/** Real on-chain release is gated by the same public flag as payments. */
export const REAL_PAYMENTS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_REAL_PAYMENTS === "true";

/**
 * Server-only custody signer private key.
 * Must control QUESTPAY_RECEIVE_ADDRESS. Never import this module from client code.
 */
function getReleasePrivateKey(): Hex | null {
  const raw =
    process.env.QUESTPAY_RELEASE_PRIVATE_KEY?.trim() ||
    process.env.QUESTPAY_CUSTODY_PRIVATE_KEY?.trim() ||
    "";
  if (!raw) return null;
  const normalized = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[a-fA-F0-9]{64}$/.test(normalized)) return null;
  return normalized as Hex;
}

export function hasReleaseSignerConfigured(): boolean {
  return Boolean(getReleasePrivateKey());
}

export type ReleaseResult =
  | {
      ok: true;
      alreadyReleased: boolean;
      orderId: string;
      publicOrderId: string;
      status: string;
      releaseId: string;
      txHash: string | null;
      toAddress: string;
      amountHuman: string;
      amountRaw: string;
      tokenSymbol: string;
      skippedOnChain?: boolean;
      reason?: string;
    }
  | {
      ok: false;
      error: string;
      code:
        | "order_not_found"
        | "invalid_status"
        | "already_released"
        | "real_payments_disabled"
        | "signer_missing"
        | "receive_address_invalid"
        | "creator_wallet_missing"
        | "amount_missing"
        | "token_misconfigured"
        | "broadcast_failed"
        | "db_error"
        | "custody_mismatch";
      status?: string;
    };

const ERC20_ABI = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
]);

function releaseIdempotencyKey(orderId: string): string {
  return `release:${orderId}`;
}

function bscRpcUrl(): string {
  return process.env.BSC_RPC_URL?.trim() || "https://bsc-dataseed.binance.org";
}

function getWalletClientForChain(chainId: number, privateKey: Hex): WalletClient {
  const account = privateKeyToAccount(privateKey);
  if (chainId === NETWORKS.bnb.chainId) {
    return createWalletClient({
      account,
      chain: bsc,
      transport: http(bscRpcUrl()),
    });
  }
  return createWalletClient({
    account,
    chain: polygon,
    transport: http(POLYGON_RPC_URL),
  });
}

async function loadExistingRelease(
  sb: SupabaseClient,
  orderId: string,
): Promise<{
  id: string;
  tx_hash: string | null;
  to_address: string;
  amount_human: string;
  amount_raw: string;
  token_symbol: string;
  status: string;
} | null> {
  const { data } = await sb
    .from("releases")
    .select("id, tx_hash, to_address, amount_human, amount_raw, token_symbol, status")
    .eq("order_id", orderId)
    .maybeSingle();
  return data ?? null;
}

/**
 * Server-only custody release after buyer accept.
 *
 * Guards:
 * - order.status must be `accepted` (or already `released`/`completed` → idempotent)
 * - NEXT_PUBLIC_ENABLE_REAL_PAYMENTS must be true for on-chain send
 * - QUESTPAY_RELEASE_PRIVATE_KEY must be present for on-chain send
 * - one release row per order (unique order_id + idempotency_key)
 * - never trusts client-supplied amount / to_address / receive_address
 */
export async function releaseAcceptedOrder(
  sb: SupabaseClient,
  opts: {
    orderId?: string;
    publicOrderId?: string;
    actor?: string;
    /** When true, only record a skipped release row if chain send is gated off (still requires accepted). */
    allowSkipWhenGated?: boolean;
  },
): Promise<ReleaseResult> {
  if (!opts.orderId && !opts.publicOrderId) {
    return { ok: false, error: "Order id required.", code: "order_not_found" };
  }

  let query = sb.from("orders").select("*");
  query = opts.orderId
    ? query.eq("id", opts.orderId)
    : query.eq("public_order_id", opts.publicOrderId!);

  const { data: order, error: orderErr } = await query.single();
  if (orderErr || !order) {
    return { ok: false, error: "Order not found.", code: "order_not_found" };
  }

  // Idempotent: already released/completed → return existing release if any.
  if (["released", "completed"].includes(order.status)) {
    const existing = await loadExistingRelease(sb, order.id);
    return {
      ok: true,
      alreadyReleased: true,
      orderId: order.id,
      publicOrderId: order.public_order_id,
      status: order.status,
      releaseId: existing?.id || "",
      txHash: existing?.tx_hash || null,
      toAddress: existing?.to_address || order.creator_wallet || "",
      amountHuman: existing?.amount_human || String(order.amount_human || ""),
      amountRaw: existing?.amount_raw || String(order.amount_raw || ""),
      tokenSymbol: existing?.token_symbol || order.token_symbol,
      reason: "already_released",
    };
  }

  if (order.status !== "accepted") {
    return {
      ok: false,
      error: `Order must be accepted before release (current: ${order.status}).`,
      code: "invalid_status",
      status: order.status,
    };
  }

  // Existing release row for accepted order (retry after partial failure).
  const prior = await loadExistingRelease(sb, order.id);
  if (prior && prior.status === "confirmed" && prior.tx_hash) {
    const now = new Date().toISOString();
    await sb
      .from("orders")
      .update({ status: "released", released_at: now, updated_at: now })
      .eq("id", order.id)
      .eq("status", "accepted");
    return {
      ok: true,
      alreadyReleased: true,
      orderId: order.id,
      publicOrderId: order.public_order_id,
      status: "released",
      releaseId: prior.id,
      txHash: prior.tx_hash,
      toAddress: prior.to_address,
      amountHuman: prior.amount_human,
      amountRaw: prior.amount_raw,
      tokenSymbol: prior.token_symbol,
      reason: "release_row_confirmed",
    };
  }

  if (!receiveAddressValid || !QUESTPAY_RECEIVE_ADDRESS) {
    return {
      ok: false,
      error: "Custody receive address is not configured.",
      code: "receive_address_invalid",
    };
  }

  if (
    order.receive_address &&
    order.receive_address.toLowerCase() !== QUESTPAY_RECEIVE_ADDRESS.toLowerCase()
  ) {
    return {
      ok: false,
      error: "Order custody address does not match server receive address.",
      code: "custody_mismatch",
    };
  }

  const toAddress = String(order.creator_wallet || "").trim();
  if (!toAddress || !isValidAddress(toAddress)) {
    return {
      ok: false,
      error: "Creator payout wallet is missing or invalid on this order.",
      code: "creator_wallet_missing",
    };
  }

  const amountRaw = String(order.amount_raw || "").trim();
  const amountHuman = String(order.amount_human || "").trim();
  if (!amountRaw || !amountHuman) {
    return {
      ok: false,
      error: "Order amount is incomplete.",
      code: "amount_missing",
    };
  }

  const chainKey = chainKeyFromId(order.chain_id);
  const tokenSymbol = order.token_symbol as TokenSymbol;
  const token = getTokenConfig(chainKey, tokenSymbol);
  if (!token) {
    return {
      ok: false,
      error: "Order token is misconfigured.",
      code: "token_misconfigured",
    };
  }

  const privateKey = getReleasePrivateKey();
  const idempotencyKey = releaseIdempotencyKey(order.id);
  const actor = opts.actor || "system";

  // Gate: real payments off or signer missing → refuse on-chain send safely.
  if (!REAL_PAYMENTS_ENABLED) {
    if (!opts.allowSkipWhenGated) {
      return {
        ok: false,
        error: "Real payments are disabled (NEXT_PUBLIC_ENABLE_REAL_PAYMENTS≠true). Release refused.",
        code: "real_payments_disabled",
      };
    }
    return recordSkippedRelease(sb, {
      order,
      toAddress,
      amountRaw,
      amountHuman,
      tokenSymbol,
      tokenAddress: order.token_address || token.address || null,
      idempotencyKey,
      actor,
      reason: "real_payments_disabled",
      priorId: prior?.id,
    });
  }

  if (!privateKey) {
    return {
      ok: false,
      error:
        "Release signer is not configured (QUESTPAY_RELEASE_PRIVATE_KEY). Funds remain in custody.",
      code: "signer_missing",
    };
  }

  // Ensure signer controls custody address.
  const account = privateKeyToAccount(privateKey);
  if (account.address.toLowerCase() !== QUESTPAY_RECEIVE_ADDRESS.toLowerCase()) {
    return {
      ok: false,
      error: "Release signer does not match QUESTPAY_RECEIVE_ADDRESS.",
      code: "custody_mismatch",
    };
  }

  // Upsert pending release row first (idempotency).
  let releaseId = prior?.id;
  if (!releaseId) {
    const { data: inserted, error: insertErr } = await sb
      .from("releases")
      .insert({
        order_id: order.id,
        chain_id: order.chain_id,
        from_address: QUESTPAY_RECEIVE_ADDRESS.toLowerCase(),
        to_address: toAddress.toLowerCase(),
        token_symbol: tokenSymbol,
        token_address: order.token_address || token.address || null,
        amount_raw: amountRaw,
        amount_human: amountHuman,
        status: "pending",
        idempotency_key: idempotencyKey,
        metadata: { actor, phase: "pending" },
      })
      .select("id")
      .single();

    if (insertErr) {
      // Concurrent insert — load winner.
      if (insertErr.code === "23505") {
        const raced = await loadExistingRelease(sb, order.id);
        if (raced?.status === "confirmed" && raced.tx_hash) {
          return {
            ok: true,
            alreadyReleased: true,
            orderId: order.id,
            publicOrderId: order.public_order_id,
            status: "released",
            releaseId: raced.id,
            txHash: raced.tx_hash,
            toAddress: raced.to_address,
            amountHuman: raced.amount_human,
            amountRaw: raced.amount_raw,
            tokenSymbol: raced.token_symbol,
            reason: "concurrent_release_won",
          };
        }
        releaseId = raced?.id;
      } else {
        return {
          ok: false,
          error: `Failed to create release row: ${insertErr.message}`,
          code: "db_error",
        };
      }
    } else {
      releaseId = inserted!.id;
    }
  }

  if (!releaseId) {
    return { ok: false, error: "Could not allocate release row.", code: "db_error" };
  }

  // Broadcast on-chain transfer.
  let txHash: string;
  try {
    const wallet = getWalletClientForChain(order.chain_id, privateKey);
    const publicClient = getChainClient(chainKey) as PublicClient;

    if (token.kind === "native") {
      txHash = await wallet.sendTransaction({
        account: wallet.account!,
        chain: order.chain_id === NETWORKS.bnb.chainId ? bsc : polygon,
        to: toAddress as Address,
        value: BigInt(amountRaw),
      });
    } else {
      const tokenAddress = (order.token_address || token.address) as Address;
      if (!tokenAddress || !isValidAddress(tokenAddress)) {
        return {
          ok: false,
          error: "ERC-20 token address missing for release.",
          code: "token_misconfigured",
        };
      }
      txHash = await wallet.writeContract({
        account: wallet.account!,
        chain: order.chain_id === NETWORKS.bnb.chainId ? bsc : polygon,
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [toAddress as Address, BigInt(amountRaw)],
      });
    }

    // Best-effort wait for inclusion (non-fatal if RPC times out).
    try {
      await publicClient.waitForTransactionReceipt({
        hash: txHash as Hex,
        confirmations: 1,
        timeout: 60_000,
      });
    } catch {
      // Still mark broadcast; worker/cron can re-check later.
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "broadcast_failed";
    await sb
      .from("releases")
      .update({
        status: "failed",
        failure_reason: msg.slice(0, 500),
        updated_at: new Date().toISOString(),
        metadata: { actor, phase: "failed", error: msg.slice(0, 500) },
      })
      .eq("id", releaseId);

    await sb.from("questpay_order_events").insert({
      order_id: order.id,
      event_type: "release_failed",
      from_status: "accepted",
      to_status: "accepted",
      metadata: { actor, error: msg.slice(0, 500), release_id: releaseId },
    });

    return {
      ok: false,
      error: `On-chain release failed: ${msg}`,
      code: "broadcast_failed",
    };
  }

  const now = new Date().toISOString();
  const { error: releaseUpdateErr } = await sb
    .from("releases")
    .update({
      status: "confirmed",
      tx_hash: txHash.toLowerCase(),
      released_at: now,
      updated_at: now,
      failure_reason: null,
      metadata: { actor, phase: "confirmed", tx_hash: txHash.toLowerCase() },
    })
    .eq("id", releaseId);

  if (releaseUpdateErr) {
    return {
      ok: false,
      error: `Release broadcast but DB update failed: ${releaseUpdateErr.message}`,
      code: "db_error",
    };
  }

  // Only transition accepted → released (never overwrite other statuses).
  const { error: orderUpdateErr } = await sb
    .from("orders")
    .update({
      status: "released",
      released_at: now,
      updated_at: now,
    })
    .eq("id", order.id)
    .eq("status", "accepted");

  if (orderUpdateErr) {
    return {
      ok: false,
      error: `Release confirmed but order status update failed: ${orderUpdateErr.message}`,
      code: "db_error",
    };
  }

  await sb.from("questpay_order_events").insert({
    order_id: order.id,
    event_type: "custody_released",
    from_status: "accepted",
    to_status: "released",
    metadata: {
      actor,
      release_id: releaseId,
      tx_hash: txHash.toLowerCase(),
      to_address: toAddress.toLowerCase(),
      amount_raw: amountRaw,
      amount_human: amountHuman,
      token_symbol: tokenSymbol,
      from_address: QUESTPAY_RECEIVE_ADDRESS.toLowerCase(),
    },
  });

  return {
    ok: true,
    alreadyReleased: false,
    orderId: order.id,
    publicOrderId: order.public_order_id,
    status: "released",
    releaseId,
    txHash: txHash.toLowerCase(),
    toAddress: toAddress.toLowerCase(),
    amountHuman,
    amountRaw,
    tokenSymbol,
  };
}

async function recordSkippedRelease(
  sb: SupabaseClient,
  args: {
    order: {
      id: string;
      public_order_id: string;
      chain_id: number;
      token_symbol: string;
      token_address?: string | null;
    };
    toAddress: string;
    amountRaw: string;
    amountHuman: string;
    tokenSymbol: string;
    tokenAddress: string | null;
    idempotencyKey: string;
    actor: string;
    reason: string;
    priorId?: string;
  },
): Promise<ReleaseResult> {
  // Do NOT mark order released when on-chain send was skipped — funds still held.
  let releaseId = args.priorId;
  if (!releaseId) {
    const { data, error } = await sb
      .from("releases")
      .insert({
        order_id: args.order.id,
        chain_id: args.order.chain_id,
        from_address: QUESTPAY_RECEIVE_ADDRESS.toLowerCase(),
        to_address: args.toAddress.toLowerCase(),
        token_symbol: args.tokenSymbol,
        token_address: args.tokenAddress,
        amount_raw: args.amountRaw,
        amount_human: args.amountHuman,
        status: "skipped",
        failure_reason: args.reason,
        idempotency_key: args.idempotencyKey,
        metadata: { actor: args.actor, phase: "skipped", reason: args.reason },
      })
      .select("id")
      .single();

    if (error && error.code !== "23505") {
      return {
        ok: false,
        error: `Failed to record skipped release: ${error.message}`,
        code: "db_error",
      };
    }
    releaseId = data?.id;
    if (!releaseId) {
      const existing = await loadExistingRelease(sb, args.order.id);
      releaseId = existing?.id;
    }
  } else {
    await sb
      .from("releases")
      .update({
        status: "skipped",
        failure_reason: args.reason,
        updated_at: new Date().toISOString(),
        metadata: { actor: args.actor, phase: "skipped", reason: args.reason },
      })
      .eq("id", releaseId);
  }

  await sb.from("questpay_order_events").insert({
    order_id: args.order.id,
    event_type: "release_skipped",
    from_status: "accepted",
    to_status: "accepted",
    metadata: {
      actor: args.actor,
      reason: args.reason,
      release_id: releaseId,
    },
  });

  return {
    ok: false,
    error: `Release refused: ${args.reason}. Order remains accepted; funds stay in custody.`,
    code:
      args.reason === "real_payments_disabled"
        ? "real_payments_disabled"
        : "signer_missing",
    status: "accepted",
  };
}

/**
 * Mark order accepted (buyer-only path) without releasing yet.
 * Caller should invoke releaseAcceptedOrder afterwards.
 */
export async function markOrderAccepted(
  sb: SupabaseClient,
  opts: {
    orderId: string;
    actorAccountId: string;
    actorLabel?: string;
  },
): Promise<
  | { ok: true; alreadyAccepted: boolean; status: string }
  | { ok: false; error: string; code: string; status?: string }
> {
  const { data: order, error } = await sb
    .from("orders")
    .select("id, status, account_id")
    .eq("id", opts.orderId)
    .single();

  if (error || !order) {
    return { ok: false, error: "Order not found.", code: "order_not_found" };
  }

  if (["accepted", "released", "completed"].includes(order.status)) {
    return { ok: true, alreadyAccepted: true, status: order.status };
  }

  // Acceptable pre-accept work states.
  const ACCEPTABLE = new Set([
    "work_submitted",
    "ready_for_review",
    "delivered",
    "reviewing",
  ]);
  if (!ACCEPTABLE.has(order.status)) {
    return {
      ok: false,
      error: `Order cannot be accepted from status ${order.status}.`,
      code: "invalid_status",
      status: order.status,
    };
  }

  // Buyer ownership: order.account_id must match session (when set).
  if (order.account_id && order.account_id !== opts.actorAccountId) {
    return {
      ok: false,
      error: "Only the buyer who owns this order can accept work.",
      code: "forbidden",
      status: order.status,
    };
  }

  const now = new Date().toISOString();
  const { error: updateErr } = await sb
    .from("orders")
    .update({
      status: "accepted",
      accepted_at: now,
      updated_at: now,
    })
    .eq("id", order.id)
    .in("status", Array.from(ACCEPTABLE));

  if (updateErr) {
    return {
      ok: false,
      error: `Failed to accept order: ${updateErr.message}`,
      code: "db_error",
    };
  }

  await sb.from("questpay_order_events").insert({
    order_id: order.id,
    event_type: "work_accepted",
    from_status: order.status,
    to_status: "accepted",
    metadata: {
      actor: opts.actorLabel || opts.actorAccountId,
      actor_account_id: opts.actorAccountId,
    },
  });

  return { ok: true, alreadyAccepted: false, status: "accepted" };
}
