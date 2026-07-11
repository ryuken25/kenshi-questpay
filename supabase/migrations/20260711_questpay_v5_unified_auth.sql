-- QuestPay v5 — Unified Auth, RBAC, and Root Super Admin Bootstrap
-- Idempotent migration: safe to run multiple times

-- 1. accounts
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

-- 2. account_identities
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

-- 3. account_roles
do $$ begin
  create type public.questpay_role as enum ('buyer', 'creator', 'super_admin');
exception when duplicate_object then null; end $$;

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

-- 4. root_identity_claims
create table if not exists public.root_identity_claims (
  provider text not null,
  normalized_identifier text not null,
  target_account_id uuid not null references public.accounts(id),
  claimed_at timestamptz,
  primary key (provider, normalized_identifier)
);

-- 5. account_sessions
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

-- 6. wallet_nonces
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

-- 7. identity_link_attempts
create table if not exists public.identity_link_attempts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  provider text not null,
  state_hash text not null unique,
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 8. creator_invitations
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

-- 9. admin_audit_log
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_account_id uuid not null references public.accounts(id),
  action text not null,
  target_account_id uuid references public.accounts(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 10. Add account_id to orders
do $$ begin
  alter table public.orders add column if not exists creator_account_id uuid references public.accounts(id);
exception when duplicate_column then null; end $$;

-- 11. Bootstrap root account
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

-- 12. RLS policies
alter table public.accounts enable row level security;
alter table public.account_identities enable row level security;
alter table public.account_roles enable row level security;
alter table public.account_sessions enable row level security;
alter table public.wallet_nonces enable row level security;
alter table public.root_identity_claims enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.creator_invitations enable row level security;

-- Clients can read their own account row
create policy if not exists accounts_self_read on public.accounts
  for select using (auth.uid() is not null);

-- Service role bypasses RLS for all tables
-- All mutations go through server-side API routes with service-role client
