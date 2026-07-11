# QuestPay Real Payment Gate

Real payments must remain disabled until every P0 item below is verified in production.

| Field | Value / evidence |
|---|---|
| Receiver address | `QUESTPAY_RECEIVE_ADDRESS` configured server-side; not printed here |
| Polygon chain ID | `137` |
| USDT contract | `POLYGON_USDT_ADDRESS` (`0xc2132D05D31c914a87C6611C10748AEb04B58e8F` default) |
| VERSE contract | `POLYGON_VERSE_ADDRESS` (`0xc708d6f2153933daa50b2d0758955be0a93a8fec` default) |
| POL native | Native Polygon asset |
| Minimum confirmations | `PAYMENT_MIN_CONFIRMATIONS=5` |
| Quote provider | CoinGecko simple price fallback foundation; USDT fixed at 1 USD |
| Quote TTL | `QUOTE_TTL_SECONDS=600` |
| Order TTL | `PAYMENT_WINDOW_SECONDS=1800` |
| Git SHA | Pending final commit |
| Vercel SHA | Pending deployment |
| Dry run | Pending |
| Minimal real payment | Pending owner-executed USDT rehearsal |
| Receipt | Pending |
| Dashboard | Pending |
| Email | Pending |

## P0 checklist

- [x] Polygon-only wagmi config
- [x] No Base Sepolia public demo route (redirected to services)
- [x] Real wallet payment CTA frozen by default
- [x] Exact VERSE logo copied from `ryuken25/verse/public/verse-logo.svg` and SHA-256 verified
- [x] QuestPay has its own SVG mark
- [x] No direct `window.ethereum` payment path remains in `PayPageClient`
- [x] Quote engine rejects VERSE/POL if real price cannot be fetched
- [x] No 1:1 VERSE fallback in quote engine
- [x] No manual POL amount fallback in quote engine
- [x] Quote expiry and order expiry fields added
- [x] Server verification checks eligible order status and expiry
- [x] Atomic payment RPC migration added
- [x] Transaction uniqueness index added
- [x] Analytics script installed exactly once in root layout
- [x] Build SHA injection script added
- [x] Security headers added
- [ ] Wallet signature authentication implemented end-to-end
- [ ] Buyer `My Orders` implemented end-to-end
- [ ] Owner dashboard migrated from Studio to `/dashboard`
- [ ] Production Supabase migration applied
- [ ] Production email verified
- [ ] Playwright E2E payment rehearsal
- [ ] Accessibility pass
- [ ] Minimal USDT rehearsal with owner approval

## Final result

FINAL RESULT: FAIL — real payment remains intentionally disabled until the unchecked items pass.
