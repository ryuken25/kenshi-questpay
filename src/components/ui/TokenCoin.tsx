import type { HTMLAttributes } from "react";

/**
 * Kenshi QuestPay DS — TokenCoin.
 * Round, glossy payment-token disc used by the hero orbit and the token
 * pickers. Self-contained CSS gradient + inner rim — no external image, so it
 * renders instantly and never 404s a logo.
 */
export type TokenCoinId = "usdt" | "usdc" | "pol" | "verse" | "btc" | "eth";

const TOKENS: Record<TokenCoinId, { symbol: string; grad: string }> = {
  usdt: { symbol: "USDT", grad: "radial-gradient(circle at 30% 22%, #c9fff0, #20b985 42%, #087456)" },
  usdc: { symbol: "USDC", grad: "radial-gradient(circle at 30% 22%, #e5f2ff, #2775ca 42%, #0b3c76)" },
  pol: { symbol: "POL", grad: "radial-gradient(circle at 30% 22%, #e0d8ff, #8247e5 42%, #3a1987)" },
  verse: { symbol: "VERSE", grad: "radial-gradient(circle at 30% 22%, #eee8ff, #7c5cff 42%, #351771)" },
  btc: { symbol: "BTC", grad: "radial-gradient(circle at 30% 22%, #ffe6c2, #f7931a 42%, #a85e05)" },
  eth: { symbol: "ETH", grad: "radial-gradient(circle at 30% 22%, #dfe4ff, #6b7bd6 42%, #2b3170)" },
};

export interface TokenCoinProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  token?: TokenCoinId;
  size?: number;
  /** Override the printed ticker (defaults to the token's symbol). */
  symbol?: string;
}

export default function TokenCoin({
  token = "verse",
  size = 56,
  symbol,
  style,
  ...rest
}: TokenCoinProps) {
  const t = TOKENS[token] ?? TOKENS.verse;
  const label = symbol || t.symbol;

  return (
    <span
      title={label}
      style={{
        position: "relative",
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        borderRadius: "var(--qp-radius-pill)",
        border: "1px solid rgba(255,255,255,.25)",
        background: t.grad,
        color: "#fff",
        fontFamily: "var(--qp-font-mono)",
        fontSize: Math.max(9, size * 0.19),
        fontWeight: 900,
        letterSpacing: "-0.05em",
        textShadow: "0 1px 6px rgba(0,0,0,.38)",
        boxShadow:
          "inset 0 2px 7px rgba(255,255,255,.20), inset 0 -12px 26px rgba(0,0,0,.28), 0 16px 38px rgba(0,0,0,.38)",
        ...style,
      }}
      {...rest}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: size * 0.11,
          borderRadius: "inherit",
          border: "1px solid rgba(255,255,255,.24)",
          pointerEvents: "none",
        }}
      />
      {label}
    </span>
  );
}
