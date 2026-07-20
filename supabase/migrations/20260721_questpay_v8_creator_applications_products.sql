-- QuestPay v8 — Creator applications + creator products (services) foundation
-- Idempotent migration: safe to run multiple times

-- 1. creator_applications
create table if not exists public.creator_applications (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  display_name text not null,
  craft text not null,
  portfolio_url text,
  note text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  reviewed_by uuid references public.accounts(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_applications_account_idx
  on public.creator_applications(account_id);

create index if not exists creator_applications_status_idx
  on public.creator_applications(status);

-- At most one open (pending) application per account
create unique index if not exists creator_applications_one_pending_per_account
  on public.creator_applications(account_id)
  where status = 'pending';

-- 2. creator_services (per-creator product catalog)
create table if not exists public.creator_services (
  id uuid primary key default gen_random_uuid(),
  creator_account_id uuid not null references public.accounts(id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null default '',
  outcome text not null default '',
  usd_price numeric(12, 2) not null check (usd_price >= 0),
  delivery text not null default '',
  revisions text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (creator_account_id, slug)
);

create index if not exists creator_services_creator_idx
  on public.creator_services(creator_account_id);

create index if not exists creator_services_status_idx
  on public.creator_services(status);

-- 3. RLS — service role bypasses; no anon policies
alter table public.creator_applications enable row level security;
alter table public.creator_services enable row level security;
