-- QuestPay v6 — Account Profile Onboarding
-- Idempotent migration: safe to run multiple times

-- 1. account_profiles (one-to-one with accounts)
create table if not exists public.account_profiles (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  display_name text,
  public_handle text,
  contact_method text
    check (contact_method in ('email', 'discord', 'telegram', 'x', 'whatsapp', 'other')),
  contact_value text,
  organization text,
  avatar_url text,
  preferred_chain text not null default 'polygon'
    check (preferred_chain in ('polygon', 'bnb')),
  timezone text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Link orders to the owning account (nullable — historical anonymous orders exist)
do $$ begin
  alter table public.orders add column if not exists account_id uuid;
exception when duplicate_column then null; end $$;

do $$ begin
  alter table public.orders
    add constraint orders_account_id_fkey
    foreign key (account_id)
    references public.accounts(id)
    on delete set null;
exception when duplicate_object then null; end $$;

create index if not exists idx_orders_account_id
  on public.orders(account_id, created_at desc);

-- 3. RLS
alter table public.account_profiles enable row level security;
-- Service role bypasses RLS. All reads/writes go through server-side API routes
-- (/api/profile, /api/profile/onboarding) using the service-role client and the
-- authenticated session's account_id — never a client-supplied account_id.
