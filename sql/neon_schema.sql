-- QuestPay consolidated Neon Postgres schema
-- Idempotent: safe to run multiple times on a fresh Neon database.
-- Replaces Supabase-hosted tables for app data (auth sessions, orders, studio).

create extension if not exists "pgcrypto";

-- ────────────────────────────── helpers ──────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create type public.questpay_role as enum ('buyer', 'creator', 'super_admin');
exception when duplicate_object then null; end $$;

-- ────────────────────────────── accounts / auth ──────────────────────────────
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  avatar_url text,
  primary_email text,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'merged', 'deleted')),
  onboarding_completed_at timestamptz,
  cookie_preferences jsonb not null default '{"necessary":true,"analytics":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_identities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  provider text not null check (provider in ('google', 'email', 'wallet')),
  provider_subject text not null,
  normalized_email text,
  normalized_wallet text,
  verified_at timestamptz not null,
  is_primary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(provider, provider_subject)
);

create unique index if not exists account_identity_unique_google_email
  on public.account_identities(normalized_email)
  where normalized_email is not null and provider in ('google', 'email');

create unique index if not exists account_identity_unique_wallet
  on public.account_identities(normalized_wallet)
  where normalized_wallet is not null and provider = 'wallet';

create table if not exists public.account_roles (
  account_id uuid not null references public.accounts(id) on delete cascade,
  role public.questpay_role not null,
  granted_by uuid references public.accounts(id),
  grant_reason text,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.accounts(id),
  primary key (account_id, role)
);

create table if not exists public.root_identity_claims (
  provider text not null,
  normalized_identifier text not null,
  target_account_id uuid not null references public.accounts(id),
  claimed_at timestamptz,
  primary key (provider, normalized_identifier)
);

create table if not exists public.account_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  token_hash text not null unique,
  authenticated_by text not null check (authenticated_by in ('google', 'email', 'wallet')),
  authenticated_identity_id uuid references public.account_identities(id),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  user_agent_hash text,
  ip_prefix_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_nonces (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  nonce_hash text not null unique,
  domain text not null,
  chain_id integer not null default 137,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.identity_link_attempts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  provider text not null,
  state_hash text not null unique,
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.creator_invitations (
  id uuid primary key default gen_random_uuid(),
  invited_email text,
  invited_wallet text,
  token_hash text not null unique,
  invited_by uuid not null references public.accounts(id),
  note text,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references public.accounts(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_account_id uuid not null references public.accounts(id),
  action text not null,
  target_account_id uuid references public.accounts(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

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

-- ────────────────────────────── orders / payments ──────────────────────────────
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  public_order_id text        not null unique,
  slug            text        not null,
  status          text        not null default 'pending'
                  check (status in (
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
                  )),
  receive_address text        not null,
  chain_id        integer     not null default 137,
  token_symbol    text        not null,
  token_address   text,
  token_decimals  integer     not null,
  amount_human    text        not null,
  amount_raw      text        not null,
  usd_price       numeric(12,2),
  unique_amount_suffix text,
  amount_suffix   integer,
  customer_name   text,
  contact_method  text,
  contact_value   text,
  project_link    text,
  brief           text,
  expected_output text,
  ref_links       text,
  notes           text,
  deadline        text,
  client_ip       text,
  user_agent      text,
  buyer_id        uuid,
  buyer_wallet    text,
  account_id      uuid references public.accounts(id) on delete set null,
  creator_account_id uuid references public.accounts(id),
  creator_wallet  text,
  quote_id        text,
  quote_expires_at timestamptz,
  payment_expires_at timestamptz,
  brief_sha256    text,
  delivery_sha256 text,
  started_at      timestamptz,
  paid_at         timestamptz,
  delivered_at    timestamptz,
  completed_at    timestamptz,
  work_submitted_at timestamptz,
  accepted_at     timestamptz,
  released_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table if exists public.orders
  drop constraint if exists orders_unique_amount_suffix_format;
alter table if exists public.orders
  add constraint orders_unique_amount_suffix_format
  check (
    unique_amount_suffix is null
    or unique_amount_suffix ~ '^(?!0000)\d{4}$'
  );

alter table if exists public.orders
  drop constraint if exists orders_amount_suffix_range;
alter table if exists public.orders
  add constraint orders_amount_suffix_range
  check (
    amount_suffix is null
    or (amount_suffix >= 1 and amount_suffix <= 9999)
  );

create index if not exists idx_orders_slug on public.orders (slug);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_account_id on public.orders(account_id, created_at desc);
create index if not exists idx_orders_status_updated on public.orders (status, updated_at desc);
create index if not exists idx_orders_payment_expires_at
  on public.orders (payment_expires_at)
  where status in ('awaiting_payment', 'payment_submitted', 'pending');
create index if not exists idx_orders_awaiting_payment_suffix
  on public.orders (unique_amount_suffix)
  where status = 'awaiting_payment';

create unique index if not exists idx_orders_active_unique_amount_suffix
  on public.orders (chain_id, token_symbol, unique_amount_suffix)
  where status in ('awaiting_payment', 'payment_submitted', 'pending')
    and unique_amount_suffix is not null;

create unique index if not exists orders_active_payment_amount_unique
  on public.orders (chain_id, token_symbol, amount_raw)
  where status in ('awaiting_payment', 'payment_submitted', 'pending');

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

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

create unique index if not exists idx_payments_tx_unique
  on public.payments (chain_id, lower(tx_hash));
create index if not exists idx_payments_order_id on public.payments (order_id);

create table if not exists public.payment_quotes (
  id text primary key,
  service_slug text not null,
  chain_id integer not null default 137,
  token_symbol text not null,
  token_address text,
  token_decimals integer not null,
  usd_price numeric not null,
  token_usd_price numeric not null,
  amount_human text not null,
  amount_raw text not null,
  source text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.questpay_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_questpay_order_events_order
  on public.questpay_order_events(order_id, created_at desc);

create table if not exists public.questpay_email_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  site text not null default 'questpay',
  email_type text not null,
  recipient text not null,
  status text not null check (status in ('sent','failed')),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists idx_questpay_email_events_order
  on public.questpay_email_events(order_id, created_at desc);

-- Legacy names kept for compatibility (unused by app code paths that use questpay_*)
create table if not exists public.order_events (
  id          uuid        primary key default gen_random_uuid(),
  order_id    uuid        not null references public.orders(id) on delete cascade,
  event_type  text        not null,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.email_events (
  id          uuid        primary key default gen_random_uuid(),
  order_id    uuid        references public.orders(id) on delete set null,
  to_address  text        not null,
  subject     text        not null,
  status      text        not null check (status in ('sent','failed')),
  error       text,
  created_at  timestamptz not null default now()
);

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

create unique index if not exists releases_order_id_unique on public.releases (order_id);
create unique index if not exists releases_idempotency_key_unique on public.releases (idempotency_key);
create unique index if not exists releases_chain_tx_unique
  on public.releases (chain_id, lower(tx_hash))
  where tx_hash is not null;
create index if not exists releases_status_idx on public.releases (status);
create index if not exists releases_to_address_idx on public.releases (lower(to_address));

-- ────────────────────────────── studio ──────────────────────────────
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
create unique index if not exists creator_applications_one_pending_per_account
  on public.creator_applications(account_id)
  where status = 'pending';

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

-- ────────────────────────────── root bootstrap ──────────────────────────────
do $$
declare
  root_account uuid := '00000000-0000-4000-8000-000000000001';
begin
  insert into public.accounts (id, display_name, primary_email, status)
  values (root_account, 'Winaya Arya', 'winayaarya@gmail.com', 'active')
  on conflict (id) do nothing;

  insert into public.account_roles (account_id, role, grant_reason)
  values
    (root_account, 'buyer'::public.questpay_role, 'root bootstrap'),
    (root_account, 'creator'::public.questpay_role, 'root bootstrap'),
    (root_account, 'super_admin'::public.questpay_role, 'root bootstrap')
  on conflict (account_id, role) do nothing;

  insert into public.root_identity_claims (provider, normalized_identifier, target_account_id)
  values
    ('google_email', 'winayaarya@gmail.com', root_account),
    ('wallet', '0xea8ab08eabbead7e3d28cb067ec7f638d40b39cf', root_account),
    ('wallet', '0xa111a8c806b1fac9d27650455344f5c2f144a743', root_account)
  on conflict do nothing;
end $$;
