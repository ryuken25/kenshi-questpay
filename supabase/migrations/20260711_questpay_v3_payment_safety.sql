-- QuestPay v3 payment safety additions.

alter table if exists orders add column if not exists buyer_id uuid;
alter table if exists orders add column if not exists buyer_wallet text;
alter table if exists orders add column if not exists quote_id text;
alter table if exists orders add column if not exists quote_expires_at timestamptz;
alter table if exists orders add column if not exists payment_expires_at timestamptz;
alter table if exists orders add column if not exists started_at timestamptz;
alter table if exists orders add column if not exists delivered_at timestamptz;
alter table if exists orders add column if not exists completed_at timestamptz;
alter table if exists orders add column if not exists brief_sha256 text;
alter table if exists orders add column if not exists delivery_sha256 text;
alter table if exists orders add column if not exists updated_at timestamptz default now();

create table if not exists payment_quotes (
  id text primary key,
  service_slug text not null,
  chain_id integer not null default 137,
  token_symbol text not null,
  token_address text,
  token_decimals integer not null,
  usd_price numeric not null,
  token_usd_price numeric not null,
  amount_human numeric not null,
  amount_raw numeric not null,
  source text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create unique index if not exists payments_chain_tx_unique on payments (chain_id, lower(tx_hash));

create table if not exists buyer_profiles (
  id uuid primary key default gen_random_uuid(),
  primary_wallet text,
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists wallet_identities (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references buyer_profiles(id) on delete cascade,
  chain_id integer not null,
  wallet_address text not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists wallet_identities_chain_wallet_unique on wallet_identities (chain_id, lower(wallet_address));

create table if not exists wallet_nonces (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  nonce_hash text not null,
  domain text not null,
  chain_id integer not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists wallet_sessions (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references buyer_profiles(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  user_agent_hash text,
  created_at timestamptz not null default now()
);
create unique index if not exists wallet_sessions_token_hash_unique on wallet_sessions (token_hash);

create table if not exists order_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  title text,
  summary text,
  delivery_url text,
  repository_url text,
  deployment_url text,
  file_url text,
  delivery_sha256 text,
  created_by text,
  delivered_at timestamptz not null default now()
);

create table if not exists order_internal_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  author_id text,
  body text not null,
  created_at timestamptz not null default now()
);

create or replace function record_verified_payment(
  p_order_id uuid,
  p_chain_id integer,
  p_tx_hash text,
  p_from_address text,
  p_to_address text,
  p_token_symbol text,
  p_token_address text,
  p_amount_raw numeric,
  p_amount_human numeric,
  p_block_number bigint,
  p_block_timestamp timestamptz,
  p_confirmations integer,
  p_raw_receipt jsonb
)
returns void
language plpgsql
security definer
as $$
declare
  v_status text;
begin
  select status into v_status from orders where id = p_order_id for update;
  if v_status is null then raise exception 'order_not_found'; end if;
  if v_status in ('paid', 'in_progress', 'awaiting_client', 'ready_for_review', 'delivered', 'completed') then return; end if;
  if v_status not in ('awaiting_payment', 'payment_submitted', 'pending') then raise exception 'invalid_order_status'; end if;

  insert into payments (order_id, chain_id, tx_hash, from_address, to_address, token_symbol, token_address, amount_raw, amount_human, block_number, block_timestamp, confirmations, raw_receipt)
  values (p_order_id, p_chain_id, lower(p_tx_hash), lower(p_from_address), lower(p_to_address), p_token_symbol, lower(coalesce(p_token_address, '')), p_amount_raw, p_amount_human, p_block_number, p_block_timestamp, p_confirmations, p_raw_receipt);

  update orders set status = 'paid', paid_at = now(), updated_at = now() where id = p_order_id;
  insert into questpay_order_events (order_id, event_type, from_status, to_status, metadata)
  values (p_order_id, 'payment_verified', v_status, 'paid', jsonb_build_object('tx_hash', lower(p_tx_hash), 'token', p_token_symbol, 'amount', p_amount_human));
end;
$$;
