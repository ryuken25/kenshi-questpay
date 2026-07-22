-- QuestPay v10 — NFT proof-of-purchase receipts (soulbound ERC-721)
-- Idempotent migration: safe to run multiple times.
--
-- Scope: purely additive columns on orders. The mint pipeline is DECOUPLED from
-- the payment path — an async sweeper picks up orders where status='paid' and
-- nft_status='none'. Nothing here changes payment/verify/release semantics, and
-- a mint failure never touches order.status.

-- ────────────────────────────── nft receipt columns ──────────────────────────────
alter table if exists public.orders
  add column if not exists nft_status text not null default 'none';

alter table if exists public.orders
  add column if not exists nft_token_id text;

alter table if exists public.orders
  add column if not exists nft_mint_tx text;

alter table if exists public.orders
  add column if not exists nft_contract text;

alter table if exists public.orders
  add column if not exists nft_chain_id integer;

alter table if exists public.orders
  add column if not exists nft_minted_at timestamptz;

alter table if exists public.orders
  add column if not exists nft_attempts integer not null default 0;

alter table if exists public.orders
  add column if not exists nft_last_error text;

-- Constrain the lifecycle values (drop-then-add so re-runs stay idempotent).
alter table if exists public.orders
  drop constraint if exists orders_nft_status_check;

alter table if exists public.orders
  add constraint orders_nft_status_check
  check (nft_status in ('none', 'pending', 'minted', 'failed'));

-- One receipt per order: a token id may not be reused across orders.
create unique index if not exists orders_nft_token_id_unique
  on public.orders (nft_token_id)
  where nft_token_id is not null;

-- Sweeper lookup: paid orders still awaiting a receipt.
create index if not exists orders_nft_pending_idx
  on public.orders (status, nft_status)
  where nft_status in ('none', 'pending', 'failed');
