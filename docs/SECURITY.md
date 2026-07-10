# Security — QuestPay v2

## Trust Model
- QuestPay never takes custody of funds. Payments go directly from buyer to creator wallet on Polygon.
- Server-side service role key is used for Supabase access. Browser never receives secret credentials.
- Payment verification is server-authoritative. Client cannot override receiver, token, chain, or amount.

## Known Limitations
- Creator Studio auth is P1 (not yet implemented). Core payment flow is fully functional without it.
- Real payment test must be owner-executed. Agent cannot sign wallet transactions.
- No private keys, seed phrases, or wallet recovery data are ever requested or stored.

## Measures
- RLS enabled on all Supabase tables with no anon access
- Unique transaction constraint prevents double-spend across browsers
- Rate limiting on order creation and verification endpoints
- Input validation via Zod on both client and server
- Email content sanitized (no HTML injection from briefs)
- Public receipt redacts personal data (no brief, email, or contact in public responses)
- No unknown mainnet address fallback (server-only env var with maintenance state if missing)
- Official fxVERSE contract: `0xc708d6f2153933daa50b2d0758955be0a93a8fec`
- Community-project disclaimer on all pages
- No secret env in logs, screenshots, or reports
