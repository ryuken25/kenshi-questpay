-- QuestPay v9 — work_submissions + releases foundation (custody → accept → release)
-- Idempotent migration: safe to run multiple times.
-- Spec: funds held at QUESTPAY_RECEIVE_ADDRESS; release only after buyer accept;
-- server-authoritative, one release per order.

-- ────────────────────────────── order lifecycle columns (ensure present) ──────────────────────────────
alter table if exists public.orders
  add column if not exists work_submitted_at timestamptz;

alter table if exists public.orders
  add column if not exists accepted_at timestamptz;

alter table if exists public.orders
  add column if not exists released_at timestamptz;

alter table if exists public.orders
  add column if not exists creator_wallet text;

alter table if exists public.orders
  add column if not exists creator_account_id uuid references public.accounts(id);

comment on column public.orders.creator_wallet is
  'Snapshot of creator payout wallet at order time (or latest known). Release target is server-authoritative.';

-- Expand lifecycle statuses for custody flow (keep legacy values).
alter table if exists public.orders drop constraint if exists orders_status_check;
alter table if exists public.orders
  add constraint orders_status_check check (
    status in (
      'pending',
      'awaiting_payment',
      'payment_submitted',
      'paid',
      'work_submitted',
      'reviewing',
      'accepted',
      'in_progress',
      'awaiting_client',
      'ready_for_review',
      'delivered',
      'released',
      'completed',
      'expired',
      'cancelled',
      'disputed',
      'refunded'
    )
  );

-- ────────────────────────────── work_submissions ──────────────────────────────
-- Creator delivers work/proof before buyer accept.
create table if not exists public.work_submissions (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  submitted_by    uuid references public.accounts(id),
  note            text not null default '',
  delivery_url    text,
  file_urls       jsonb not null default '[]'::jsonb,
  links           jsonb not null default '[]'::jsonb,
  metadata        jsonb not null default '{}'::jsonb,
  submitted_at    timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists work_submissions_order_id_idx
  on public.work_submissions (order_id, submitted_at desc);

create index if not exists work_submissions_submitted_by_idx
  on public.work_submissions (submitted_by);

comment on table public.work_submissions is
  'Creator work proofs / delivery packages. Buyer accept is required before custody release.';

-- ────────────────────────────── releases ──────────────────────────────
-- One successful release intent per order (idempotency via unique order_id).
create table if not exists public.releases (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  chain_id          integer not null,
  from_address      text not null,
  to_address        text not null,
  token_symbol      text not null,
  token_address     text,
  amount_raw        text not null,
  amount_human      text not null,
  tx_hash           text,
  status            text not null default 'pending'
                    check (status in ('pending', 'broadcast', 'confirmed', 'failed', 'skipped')),
  failure_reason    text,
  idempotency_key   text not null,
  metadata          jsonb not null default '{}'::jsonb,
  released_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Exactly one release row per order (idempotent accept/release retries).
create unique index if not exists releases_order_id_unique
  on public.releases (order_id);

create unique index if not exists releases_idempotency_key_unique
  on public.releases (idempotency_key);

-- One on-chain tx hash per chain when present.
create unique index if not exists releases_chain_tx_unique
  on public.releases (chain_id, lower(tx_hash))
  where tx_hash is not null;

create index if not exists releases_status_idx
  on public.releases (status);

create index if not exists releases_to_address_idx
  on public.releases (lower(to_address));

comment on table public.releases is
  'Server-only custody release log: QUESTPAY_RECEIVE_ADDRESS → creator_wallet after status=accepted.';

comment on column public.releases.idempotency_key is
  'Stable key (typically release:<order_id>) so concurrent release attempts collapse to one row.';

-- ────────────────────────────── RLS ──────────────────────────────
-- Service role bypasses; no anon policies (deny-by-default).
alter table public.work_submissions enable row level security;
alter table public.releases enable row level security;
