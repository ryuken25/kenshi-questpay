import "server-only";
import { parseUnits, formatUnits, type Hash, type Address } from "viem";
import { getChainClient } from "./viem-server";
import { NETWORKS, type ChainKey, type TokenConfig, type TokenSymbol } from "./services";
import { PAYMENT_MIN_CONFIRMATIONS } from "./server-config";

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" as const;

/** On-chain confirmations required; sourced from PAYMENT_MIN_CONFIRMATIONS (default 5). */
const MIN_CONFIRMATIONS = PAYMENT_MIN_CONFIRMATIONS;

/** Clock-skew grace (seconds) between chain block time and the server's order time. */
const TIMESTAMP_SKEW_SECONDS = 300;

export interface VerifyContext {
  chainKey: ChainKey;
  receiveAddress: string;
  token: TokenConfig;
  amountHuman: string;
  /** Optional raw units; when set, preferred over re-parsing amountHuman. */
  amountRaw?: string;
  /**
   * Unix seconds of order creation. When set, a tx mined meaningfully earlier
   * than this is rejected: the unique payment amount is only revealed after the
   * order exists, so a payment for THIS order can never be mined before it.
   */
  notBeforeUnix?: number;
}

export interface VerifyResult {
  ok: boolean;
  reason?: string;
  txHash: string;
  from?: string;
  to?: string;
  token?: TokenSymbol;
  amountHuman?: string;
  amountRaw?: string;
  blockNumber?: bigint;
  blockTimestamp?: number;
  confirmations?: number;
  explorer?: string;
}

function padAddr(addr: string): string {
  return `0x${addr.toLowerCase().replace(/^0x/, "").padStart(64, "0")}`;
}

function resolveExpectedRaw(ctx: VerifyContext): bigint {
  if (ctx.amountRaw && /^\d+$/.test(ctx.amountRaw)) {
    return BigInt(ctx.amountRaw);
  }
  return parseUnits(ctx.amountHuman, ctx.token.decimals);
}

/**
 * Server-authoritative payment verification.
 *
 * Given a txHash and an expected context (derived from the Supabase order,
 * NOT from the client), verifies:
 *   1. tx exists and receipt status === success
 *   2. >= MIN_CONFIRMATIONS confirmations
 *   3. For native POL: tx.to === receiveAddress && tx.value === expected (exact)
 *   4. For ERC-20: a Transfer event log matching token + receiver + exact amount
 *
 * Returns a sanitized receipt on success.
 */
export async function verifyPayment(
  txHashInput: string,
  ctx: VerifyContext,
): Promise<VerifyResult> {
  const txHash = txHashInput.trim() as Hash;
  const base: VerifyResult = { ok: false, txHash: txHashInput };

  // Validate hash format
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return { ...base, reason: "Invalid transaction hash format." };
  }

  const client = getChainClient(ctx.chainKey);
  const explorerBase = NETWORKS[ctx.chainKey].explorer;
  const expectedRaw = resolveExpectedRaw(ctx);

  // Fetch tx, receipt, and current block number in parallel
  const [tx, receipt, currentBlock] = await Promise.all([
    client.getTransaction({ hash: txHash }).catch(() => null),
    client.getTransactionReceipt({ hash: txHash }).catch(() => null),
    client.getBlockNumber().catch(() => 0n),
  ]);

  if (!tx || !receipt) {
    return { ...base, reason: `Transaction not found on ${NETWORKS[ctx.chainKey].name} yet.` };
  }

  if (receipt.status !== "success") {
    return { ...base, reason: "Transaction failed on-chain." };
  }

  // Confirmations
  const confirmations =
    currentBlock && receipt.blockNumber
      ? Number(currentBlock - receipt.blockNumber)
      : 0;
  if (confirmations < MIN_CONFIRMATIONS) {
    return {
      ...base,
      reason: `Transaction needs ${MIN_CONFIRMATIONS}+ confirmations (currently ${confirmations}). Please wait and try again.`,
    };
  }

  // Fetch block for timestamp
  const block = await client.getBlock({ blockNumber: receipt.blockNumber }).catch(() => null);
  const blockTimestamp = block ? Number(block.timestamp) : 0;

  // Reject a tx mined before the order existed. The unique payment amount is only
  // revealed after order creation, so a payment for THIS order can never be mined
  // earlier; an earlier same-amount transfer is unrelated (a pre-seeded or replayed
  // deposit) and must not settle the order. Enforced only when the block timestamp
  // was readable — fail-open on RPC gaps, since exact amount + global tx-hash
  // uniqueness still bind the payment.
  if (
    ctx.notBeforeUnix &&
    blockTimestamp > 0 &&
    blockTimestamp < ctx.notBeforeUnix - TIMESTAMP_SKEW_SECONDS
  ) {
    return {
      ...base,
      reason: "This transaction was mined before the order was created and cannot be its payment.",
    };
  }

  // ── Native POL ──────────────────────────────────────────────
  if (ctx.token.kind === "native") {
    const txTo = (tx.to || "").toLowerCase();
    const expectedTo = ctx.receiveAddress.toLowerCase();
    const value = tx.value || 0n;

    if (txTo !== expectedTo) {
      return { ...base, reason: "Transaction recipient does not match the expected receive address." };
    }
    // vNext: exact amount match (unique 4-digit suffix) — not >=
    if (value !== expectedRaw) {
      return {
        ...base,
        reason: `Transaction value (${formatUnits(value, ctx.token.decimals)} ${ctx.token.symbol}) does not exactly match expected (${ctx.amountHuman} ${ctx.token.symbol}).`,
      };
    }

    return {
      ok: true,
      txHash: txHashInput,
      from: tx.from,
      to: tx.to || "",
      token: ctx.token.symbol,
      amountHuman: formatUnits(value, ctx.token.decimals),
      amountRaw: value.toString(),
      blockNumber: receipt.blockNumber,
      blockTimestamp,
      confirmations,
      explorer: `${explorerBase}/tx/${txHashInput}`,
    };
  }

  // ── ERC-20 ──────────────────────────────────────────────────
  const wantedTo = padAddr(ctx.receiveAddress).toLowerCase();
  const tokenAddr = (ctx.token.address || "").toLowerCase();

  const transferLog = receipt.logs.find(
    (l) =>
      l.address.toLowerCase() === tokenAddr &&
      l.topics[0]?.toLowerCase() === TRANSFER_TOPIC &&
      l.topics[2]?.toLowerCase() === wantedTo,
  );

  if (!transferLog) {
    return {
      ...base,
      reason: `${ctx.token.symbol} transfer to the receive address was not found in this transaction.`,
    };
  }

  const transferredRaw = BigInt(transferLog.data || "0x0");
  // vNext: exact amount match (unique 4-digit suffix) — not >=
  if (transferredRaw !== expectedRaw) {
    return {
      ...base,
      reason: `${ctx.token.symbol} amount transferred (${formatUnits(transferredRaw, ctx.token.decimals)}) does not exactly match expected (${ctx.amountHuman}).`,
    };
  }

  // Extract sender from topics[1]
  const fromAddr = transferLog.topics[1]
    ? `0x${transferLog.topics[1].slice(-40)}`
    : tx.from;

  return {
    ok: true,
    txHash: txHashInput,
    from: fromAddr as Address,
    to: ctx.receiveAddress,
    token: ctx.token.symbol,
    amountHuman: formatUnits(transferredRaw, ctx.token.decimals),
    amountRaw: transferredRaw.toString(),
    blockNumber: receipt.blockNumber,
    blockTimestamp,
    confirmations,
    explorer: `${explorerBase}/tx/${txHashInput}`,
  };
}
