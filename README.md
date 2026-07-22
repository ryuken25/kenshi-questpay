# Kenshi QuestPay

**Problem:** Small creator jobs get paid through DMs and screenshots — no scope, no proof, no way to verify a payment actually happened.
**In-app crypto payment:** Buyers pick a scoped service and pay **in-app on Polygon** with **VERSE**, USDT, USDC, or POL — the amount is server-quoted with a unique cent-suffix so each invoice is exactly matchable.
**Verifiable revenue:** Every payment is confirmed server-side against Polygon and is independently re-checkable by anyone at **`/verify`** — no trust in our dashboard required.
**Live:** https://kenshi-questpay.vercel.app

> Community-built project for the VERSE ecosystem. Not an official Bitcoin.com product.

---

## How it works

```
buyer picks a service → server quotes a unique exact amount (Polygon)
  → buyer pays into QuestPay escrow → server verifies on-chain (exact amount + min confirmations)
  → creator submits work → buyer accepts → server releases funds to the creator
```

**Custody, stated honestly:** QuestPay uses **custodial escrow**. Funds are paid to a
platform-controlled receive address and released to the creator by a server-held key
after the buyer accepts. See [`docs/SECURITY.md`](docs/SECURITY.md) for the full trust
model, key-handling policy, and the quote-lock rules.

## Payment tokens (Polygon mainnet, chainId 137)

| Token | Contract | Decimals |
|---|---|---|
| VERSE (fxVERSE) | `0xc708d6f2153933daa50b2d0758955be0a93a8fec` | 18 |
| USDT | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` | 6 |
| USDC (native, Circle) | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` | 6 |
| POL | native | 18 |

Native USDC only — bridged **USDC.e** (`0x2791…84174`) is a different token and is not used.

## Verification

- `/verify` — paste any payment tx hash; it is re-checked live against Polygon (stateless, no DB trust).
- Exact-amount matching (`===`, not `>=`), minimum confirmations, and a unique tx constraint that blocks double-spend.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind · wagmi/viem · Neon Postgres · Vercel

## Development

```bash
pnpm install
cp .env.example .env.local   # fill in your own values — never commit secrets
pnpm dev
pnpm run qa                  # lint + typecheck + unit tests + build + e2e
```

## Optional: on-chain receipts

A soulbound (non-transferable) ERC-721 receipt can be minted per paid order as public
proof of purchase — service, amount and payment tx only, never the brief or contact
details. It is gated behind `ENABLE_NFT_RECEIPTS` (default **off**) and is fully
decoupled from the payment path. See `contracts/QuestPayReceipt.sol`.
