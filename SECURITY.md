# Security

QuestPay is a **custodial** escrow checkout. Buyers pay a server-controlled escrow
address; the server later releases funds to the creator. Treat the operator keys as
production secrets.

## ⚠️ The escrow wallet doubles as the super-admin login

The escrow receive address (`QUESTPAY_RECEIVE_ADDRESS`) is also the sole platform
super-admin: it is the only wallet in `ROOT_SUPER_ADMIN_WALLETS`, and the key that
releases custody funds (`QUESTPAY_RELEASE_PRIVATE_KEY`) is the same key that, by
signing SIWE, authenticates as super-admin. **One key therefore both moves customer
funds and grants full admin.** Compromise of that single key is total. Roadmap:
split custody-signer from admin-auth (separate key/address), and move the signer to
a KMS/HSM or a dedicated release service.

## Authorization model (verified)

- Roles: `anon` / `buyer` / `creator` / `super_admin`; session cookie `qp_session`.
- `super_admin` is **env-derived only** (`deriveRoles()` strips any DB `super_admin`
  grant and re-adds it only when the identity is in `ROOT_SUPER_ADMIN_WALLETS` /
  `ROOT_EMAIL`). A seeded or stale DB role row cannot escalate.
- No `middleware.ts`; every route/page self-gates. No `"use server"` actions — all
  mutations go through API routes. No route trusts a client-supplied role/account.
- Money path is server-authoritative: amount, token, chain, and receiver are derived
  from the order, never from the client; `verify-payment` enforces tx-hash uniqueness;
  release verifies the custody signer controls `QUESTPAY_RECEIVE_ADDRESS`.

## Known limitations (single-operator deployment)

Orders are **not yet linked to a specific creator** (`orders.creator_account_id` is
never populated). Consequences, currently mitigated only by this being a
single-operator deployment (creator signup is approval-gated by super-admin):

- Studio/dashboard order **list/detail/earnings** pages are gated to any `creator`
  but not scoped per-creator — an approved creator could read other creators' order
  PII. **HIGH under open creator signup.**
- `POST /api/studio/orders/[id]/status` and `work-submit` lack a live per-order
  creator-ownership check (the guard reads the always-null `creator_account_id`).
  Blast radius is work-ops status/integrity only — money statuses are blocked.

Fixing these correctly requires implementing order→creator assignment first (in the
order-create path); until then do **not** enable open/self-serve creator signup.

## Reporting

Email the operator (see repo owner). Do not open public issues for vulnerabilities.
