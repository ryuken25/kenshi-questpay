-- QuestPay v2 — Supabase schema
-- Migration: 20260710_questpay_v2.sql
-- Tables: orders, payments, order_events, email_events
-- RLS enabled; all access via server-side service role.

create extension if not exists "pgcrypto";

-- ────────────────────────────── orders ──────────────────────────────
-- Immutable payment intent snapshot. Created at checkout; never updated
-- except status transitions (pending → paid → delivered).
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  public_order_id text        not null unique,
  slug            text        not null,
  status          text        not null default 'pending'
                  check (status in ('pending','paid','expired','cancelled','delivered')),
  -- immutable payment-intent snapshot
  receive_address text        not null,
  chain_id        integer     not null default 137,
  token_symbol    text        not null,
  token_address   text,
  token_decimals  integer     not null,
  amount_human    text        not null,
  amount_raw      text        not null,
  usd_price       numeric(10,2),
  -- brief snapshot
  customer_name   text,
  contact_method  text,
  contact_value   text,
  project_link    text,
  brief           text,
  expected_output text,
  ref_links       text,
  notes           text,
  deadline        text,
  -- metadata
  client_ip       text,
  user_agent      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  paid_at         timestamptz,
  delivered_at    timestamptz
);

create index if not exists idx_orders_slug        on public.orders (slug);
create index if not exists idx_orders_status      on public.orders (status);
create index if not exists idx_orders_created_at  on public.orders (created_at desc);

-- ────────────────────────────── payments ──────────────────────────────
-- One row per verified on-chain payment. A tx hash can only be used once.
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid        not null references public.orders(id) on delete cascade,
  chain_id        integer     not null,
  tx_hash         text        not null,
  from_address    text        not null,
  to_address      text        not null,
  token_symbol    text        not null,
  token_address   text,
  amount_raw      text        not null,
  amount_human    text        not null,
  block_number    bigint      not null,
  block_timestamp timestamptz not null,
  confirmations   integer     not null default 0,
  verified_at     timestamptz not null default now(),
  raw_receipt     jsonb
);

create unique index if not exists idx_payments_tx_unique on public.payments (chain_id, lower(tx_hash));
create index if not exists idx_payments_order_id on public.payments (order_id);

-- ────────────────────────────── order_events ──────────────────────────────
-- Append-only audit log for every order lifecycle transition.
create table if not exists public.order_events (
  id          uuid        primary key default gen_random_uuid(),
  order_id    uuid        not null references public.orders(id) on delete cascade,
  event_type  text        not null,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_order_events_order_id on public.order_events (order_id, created_at desc);

-- ────────────────────────────── email_events ──────────────────────────────
-- Append-only log for every email attempt (success or failure).
create table if not exists public.email_events (
  id          uuid        primary key default gen_random_uuid(),
  order_id    uuid        references public.orders(id) on delete set null,
  to_address  text        not null,
  subject     text        not null,
  status      text        not null check (status in ('sent','failed')),
  error       text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_email_events_order_id on public.email_events (order_id, created_at desc);

-- ────────────────────────────── updated_at trigger ──────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ────────────────────────────── Row Level Security ──────────────────────────────
-- All access is via server-side service role (which bypasses RLS).
-- No anon access is granted.

alter table public.orders       enable row level security;
alter table public.payments     enable row level security;
alter table public.order_events enable row level security;
alter table public.email_events enable row level security;

-- No policies are created — the service role key bypasses RLS and anon
-- access is denied by default because RLS is enabled with no policies.
