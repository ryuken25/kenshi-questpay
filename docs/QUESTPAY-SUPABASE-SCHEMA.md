# QuestPay Supabase Schema

## Migration: `supabase/migrations/20260710_questpay_v2.sql`

## Tables

### `orders`
- `id` — UUID primary key
- `public_order_id` — unique text identifier
- `slug` — service package slug
- `status` — `pending | paid | expired | cancelled | delivered`
- `receive_address` — immutable payment receiver
- `chain_id` — 137 (Polygon mainnet)
- `token_symbol`, `token_address`, `token_decimals` — immutable token config
- `amount_human`, `amount_raw` — immutable expected amount (includes unique 4-digit decimal suffix)
- `unique_amount_suffix` — zero-padded text `0001–9999` (last 4 decimals of amount_human)
- `amount_suffix` — integer 1–9999 (same value as unique_amount_suffix)
- `payment_expires_at` — order payment window (`now + PAYMENT_WINDOW_SECONDS`, default 1800s / 30 min)
- `usd_price` — package price in USD
- `customer_name`, `contact_method`, `contact_value` — client info
- `project_link`, `brief`, `expected_output`, `ref_links`, `notes`, `deadline` — brief snapshot
- `client_ip`, `user_agent` — metadata
- `created_at`, `updated_at`, `paid_at`, `delivered_at` — timestamps

### Payment amount fingerprint
On `POST /api/orders`:
1. Create a market quote (base amount)
2. Allocate unique `unique_amount_suffix` in range `0001–9999` among active statuses `awaiting_payment | payment_submitted | pending` for the same chain+token
3. Set `amount_human = whole.XXXX` (e.g. `12.0017`) and `amount_raw = parseUnits(amount_human, decimals)`
4. Set `payment_expires_at = now + PAYMENT_WINDOW_SECONDS` (default 1800)
5. After expiry, verify/read paths cancel the order (`cancelled`) and free the suffix

Verification requires exact match of:
- `amount_raw` (not ≥)
- `token_symbol` / token address
- `chain_id`
- receive address
- eligible status + non-expired payment window

### `payments`
- `id` — UUID primary key
- `order_id` — FK to orders
- `chain_id`, `tx_hash` — on-chain payment reference
- `from_address`, `to_address` — payment parties
- `token_symbol`, `token_address` — payment token
- `amount_raw`, `amount_human` — actual verified amount
- `block_number`, `block_timestamp` — on-chain block data
- `confirmations` — confirmation count
- `verified_at` — verification timestamp
- `raw_receipt` — JSONB receipt data
- **Unique index**: `(chain_id, lower(tx_hash))` — one tx per chain

### `order_events`
- Append-only audit log
- `order_id`, `event_type`, `payload` (JSONB), `created_at`

### `email_events`
- `order_id`, `to_address`, `subject`, `status` (`sent | failed`), `error`, `created_at`

## RLS
- All tables have RLS enabled
- No anon access policies — service role bypasses RLS
- Browser never receives service/secret credentials
- Public pages query via server route handlers only

## Idempotency
- `POST /api/orders` accepts idempotency key
- Payment verification is transactional
- Duplicate tx hash rejected by unique constraint

---

## Migration: `supabase/migrations/20260721_questpay_v8_creator_applications_products.sql`

### `creator_applications`
- `id` — UUID primary key
- `account_id` — FK to accounts (applicant)
- `display_name`, `craft`, `portfolio_url`, `note` — application payload
- `status` — `pending | approved | rejected | withdrawn`
- `reviewed_by`, `reviewed_at`, `review_note` — super_admin review
- Unique partial index: one `pending` application per account
- API: `GET/POST /api/studio/applications`, `GET/PATCH /api/studio/applications/[id]`
- Approving grants `creator` role on `account_roles` and writes `admin_audit_log`

### `creator_services` (products)
- `id` — UUID primary key
- `creator_account_id` — FK to accounts (owner)
- `slug` — unique per creator (kebab-case)
- `title`, `description`, `outcome`, `usd_price`, `delivery`, `revisions`
- `status` — `draft | active | paused | archived`
- `sort_order`, timestamps
- API: `GET/POST /api/studio/products`, `GET/PATCH/DELETE /api/studio/products/[id]`
- DELETE soft-archives (`status = archived`)
- Role guards: creator (own rows) or super_admin; Zod validation on write paths
- In-process memory fallback when Supabase tables are not yet migrated
