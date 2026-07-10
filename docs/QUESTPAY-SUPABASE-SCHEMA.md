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
- `amount_human`, `amount_raw` — immutable expected amount
- `usd_price` — package price in USD
- `customer_name`, `contact_method`, `contact_value` — client info
- `project_link`, `brief`, `expected_output`, `ref_links`, `notes`, `deadline` — brief snapshot
- `client_ip`, `user_agent` — metadata
- `created_at`, `updated_at`, `paid_at`, `delivered_at` — timestamps

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
