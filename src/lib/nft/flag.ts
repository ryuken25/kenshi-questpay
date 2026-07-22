/**
 * Single source of truth for the NFT receipts feature flag.
 *
 * Deliberately dependency-free (no server-only / viem / db imports) so server
 * components can read it without pulling the mint pipeline into their bundle.
 * ENABLE_NFT_RECEIPTS is a server env — on the client it is undefined, which
 * correctly evaluates to false.
 */
export function isNftReceiptsEnabled(): boolean {
  return process.env.ENABLE_NFT_RECEIPTS?.trim().toLowerCase() === "true";
}
