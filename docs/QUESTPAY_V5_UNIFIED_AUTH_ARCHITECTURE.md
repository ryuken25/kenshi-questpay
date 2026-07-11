# QuestPay v5 — Unified Auth Architecture

## Overview

QuestPay uses one unified account system with multiple verified identity providers.

## Account Model

```
Account
├── Google identity (verified email)
├── Email magic-link identity
├── Wallet identity (EIP-4361 signature)
└── Roles: buyer | creator | super_admin
```

## Authentication vs Authorization

- **Authentication**: Who is this person? (Google OAuth, magic link, wallet signature)
- **Authorization**: What can they do? (database roles, server-side checked)

## Identity Providers

### Google
- Supabase handles OAuth flow
- `/api/auth/oauth` starts the flow
- `/auth/callback` exchanges code and creates QuestPay session
- Verified email normalized to lowercase

### Email Magic Link
- Supabase sends magic link email
- Same callback route
- Enumeration-safe response

### Wallet
- EIP-4361 (SIWE) message signature
- `/api/auth/wallet/nonce` → generate nonce
- `/api/auth/wallet/verify` → verify signature, create session
- No gas, no transaction
- Nonce expires in 10 minutes
- Nonce is one-time use

## Session

- Cookie: `qp_session` (HttpOnly, Secure, SameSite=Lax)
- Server stores SHA-256 hash of token
- 7-day expiry
- Roles loaded from database on every request

## Root Super Admin

Bootstrap account: `00000000-0000-4000-8000-000000000001`

Root identities:
- Email: `winanyaarya@gmail.com`
- Wallet: `0xEa8Ab08eaBBEAD7e3D28Cb067eC7f638d40b39cf`
- Wallet: `0xA111a8C806b1FAc9D27650455344F5C2f144a743`

All three resolve to the same root account with `buyer`, `creator`, and `super_admin` roles.

## Role-Based Access

| Route | Required Role |
|-------|--------------|
| `/my-orders` | buyer (default) |
| `/dashboard` | creator or super_admin |
| `/admin` | super_admin |

## Security Rules

- Never trust client metadata for roles
- Never expose service-role key
- Every mutation API calls `requireRole()` server-side
- Root super_admin cannot be revoked through UI
- Root identities cannot be removed through UI
