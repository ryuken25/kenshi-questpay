import { parseUnits } from "viem";
import { getServiceBySlug, TOKENS, type TokenSymbol } from "@/lib/services";

export interface PaymentQuote {
  id: string;
  serviceSlug: string;
  chainId: 137;
  tokenSymbol: TokenSymbol;
  tokenAddress: string | null;
  tokenDecimals: number;
  usdPrice: string;
  tokenUsdPrice: string;
  amountHuman: string;
  amountRaw: string;
  source: string;
  createdAt: string;
  expiresAt: string;
}

const cache = new Map<string, { price: number; source: string; at: number }>();
export const QUOTE_TTL_SECONDS = Number(process.env.QUOTE_TTL_SECONDS || 600);

function quoteId() {
  return `quote_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
}

function formatAmount(value: number, decimals: number) {
  const fixed = value.toFixed(Math.min(decimals, 8));
  return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

async function fetchCoingeckoUsd(id: string, timeoutMs = 5000): Promise<{price: number; source: string}> {
  const key = `cg:${id}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.at < 60_000) return { price: cached.price, source: cached.source };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`;
    const res = await fetch(url, { signal: controller.signal, headers: { accept: "application/json" }, cache: "no-store" });
    if (!res.ok) throw new Error(`coingecko_http_${res.status}`);
    const data = await res.json();
    const price = Number(data?.[id]?.usd);
    if (!Number.isFinite(price) || price <= 0) throw new Error("invalid_price");
    const found = { price, source: `coingecko:${id}` };
    cache.set(key, { ...found, at: now });
    return found;
  } finally { clearTimeout(timer); }
}

export async function createPaymentQuote(serviceSlug: string, tokenSymbol: TokenSymbol): Promise<PaymentQuote> {
  const service = getServiceBySlug(serviceSlug);
  if (!service) throw new Error("unknown_service");
  const token = TOKENS[tokenSymbol];
  if (!token?.enabled) throw new Error("token_disabled");

  let tokenUsdPrice = 1;
  let source = `fixed:${tokenSymbol.toLowerCase()}-1usd`;
  if (!["USDT", "USDC"].includes(tokenSymbol)) {
    if (!token.coingeckoId) throw new Error("quote_source_missing");
    const quote = await fetchCoingeckoUsd(token.coingeckoId);
    tokenUsdPrice = quote.price;
    source = quote.source;
  }
  if (!Number.isFinite(tokenUsdPrice) || tokenUsdPrice <= 0) throw new Error("invalid_quote_price");
  const amount = service.usd / tokenUsdPrice;
  const amountHuman = formatAmount(amount, token.decimals);
  const amountRaw = parseUnits(amountHuman, token.decimals).toString();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + QUOTE_TTL_SECONDS * 1000);
  return { id: quoteId(), serviceSlug, chainId: 137, tokenSymbol, tokenAddress: token.address || null, tokenDecimals: token.decimals, usdPrice: String(service.usd), tokenUsdPrice: String(tokenUsdPrice), amountHuman, amountRaw, source, createdAt: createdAt.toISOString(), expiresAt: expiresAt.toISOString() };
}

export function isQuoteExpired(expiresAt: string, now = new Date()) { return new Date(expiresAt).getTime() <= now.getTime(); }
