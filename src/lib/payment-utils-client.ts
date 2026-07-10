/** Client-safe payment utilities. No secrets, no server-only imports. */
import { CHECKOUT_TOKENS, type TokenSymbol } from "./services";

/** Truncate a hash/address for display: 0x1234…5678 */
export function middle(v: string, a = 6, b = 4): string {
  return v ? `${v.slice(0, a)}…${v.slice(-b)}` : "";
}

export { CHECKOUT_TOKENS, type TokenSymbol };
