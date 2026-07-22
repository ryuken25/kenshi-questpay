# Security — QuestPay

## Trust Model (custodial escrow — stated honestly)

QuestPay uses a **custodial escrow** flow. This is an accurate description of the
live payment path; earlier copy that said "never takes custody" was wrong and has
been corrected.

1. The buyer pays **into a platform-controlled receive address**
   (`QUESTPAY_RECEIVE_ADDRESS`) on Polygon — not directly to the creator.
2. The server verifies the on-chain payment (see below).
3. After the buyer accepts delivered work, the server **releases** the funds to
   the creator wallet by signing an on-chain transfer with
   `QUESTPAY_RELEASE_PRIVATE_KEY`, which controls the receive address.

So between "buyer pays" and "server releases", funds are **held in platform
custody**. Treat this as an escrow, not a passthrough.

### Custody key handling

- `QUESTPAY_RELEASE_PRIVATE_KEY` is a **hot signing key** and a high-value target.
  It is server-only, never exposed to the client, never `NEXT_PUBLIC_*`, never
  logged, and used only inside `server-only` modules.
- The signer is asserted at release time to match `QUESTPAY_RECEIVE_ADDRESS`;
  a mismatch refuses the release (`custody_mismatch`).
- Absent/invalid key → the release endpoint refuses safely and funds stay in
  custody (`signer_missing`), rather than failing open.
- **Risk acknowledged:** a single hot key controlling custody is a single point of
  catastrophic failure. Mitigations in place: fail-safe gating (below), idempotent
  single-release-per-order, and no client-supplied amount/destination trust. A
  future hardening step is to move release signing behind an isolated signer / MPC.

## Real-payments gate (fail-safe)

- Real payments and on-chain release are enabled **only** when
  `NEXT_PUBLIC_ENABLE_REAL_PAYMENTS` is exactly the string `true`.
- Unset, empty, `false`, or anything else → **disabled**. There is no implicit
  "enable because a receive address / signer exists" path, so a preview or
  misconfigured deployment can never silently move real funds.

## Quote-lock policy

- When an order is created, the payable amount is **locked** onto the order
  (`amount_raw` / `amount_human`) together with a unique 4-digit decimal suffix.
- `verify-payment` requires an **exact** on-chain amount match against that locked
  amount (`===`, not `>=`) to the platform receive address, and at least
  `PAYMENT_MIN_CONFIRMATIONS` confirmations.
- The locked amount is **final for the whole payment window**
  (`PAYMENT_WINDOW_SECONDS`). There is no mid-window re-pricing even though the
  upstream quote TTL (`QUOTE_TTL_SECONDS`) is shorter — the price the buyer sees at
  order creation is the price they pay. On window expiry the order expires and the
  buyer must create a new order to get a fresh quote.

## Payment verification (server-authoritative)

- Verification is server-side. The client cannot override receiver, token, chain,
  or amount — all are read from the server-locked order.
- Native POL: `tx.to === receiveAddress` and `tx.value === expected` (exact).
- ERC-20: a `Transfer` log matching token address + receiver + exact amount.
- Anti double-spend: a unique transaction constraint prevents the same tx from
  settling two orders across browsers/sessions.

## Data plane

- Primary data plane is **Neon Postgres** (`DATABASE_URL`), accessed server-side
  via `pg` with a server role. Neon is plain Postgres — Postgres RLS is **not**
  automatically in force, and the server role bypasses RLS by design. Access
  control is therefore enforced in application code (session + DB role checks on
  every protected action), not by relying on RLS.
- Supabase remains only for legacy/auth-provider paths during migration; the
  authoritative order/payment/release state lives in Neon.

## Other measures

- Rate limiting on order creation and verification endpoints.
- Input validation via Zod on both client and server.
- Email content sanitized (no HTML injection from briefs).
- Public receipt redacts personal data (no brief, email, or contact in public
  responses).
- Sessions use an HttpOnly/Secure/SameSite cookie; the server stores only a
  SHA-256 hash of the token; roles are reloaded from the DB each request.
- Security headers + CSP in `next.config.js`; `object-src 'none'`,
  `frame-ancestors 'none'`, HSTS preload.
- No secret env values in logs, screenshots, or reports.

## Known limitations

- Creator Studio auth hardening is ongoing; anonymous access to guarded routes
  returns a clean gated response, never a crash.
- Real payment tests must be owner-executed — the agent never signs wallet
  transactions or handles seed phrases.
