-- QuestPay Neon schema (consolidated, no Supabase RLS dependency)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_email text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS account_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_subject text NOT NULL,
  normalized_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_subject)
);
CREATE INDEX IF NOT EXISTS account_identities_account_idx ON account_identities(account_id);
CREATE INDEX IF NOT EXISTS account_identities_email_idx ON account_identities(normalized_email);

CREATE TABLE IF NOT EXISTS account_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('buyer','creator','super_admin')),
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE(account_id, role)
);

CREATE TABLE IF NOT EXISTS account_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  authenticated_by text NOT NULL,
  authenticated_identity_id uuid,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS account_sessions_account_idx ON account_sessions(account_id);

CREATE TABLE IF NOT EXISTS root_identity_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  normalized_identifier text NOT NULL,
  target_account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  claimed_at timestamptz,
  UNIQUE(provider, normalized_identifier)
);

-- NOTE: the code (src/lib/profile.ts) uses table name `account_profiles`.
CREATE TABLE IF NOT EXISTS account_profiles (
  account_id uuid PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  display_name text,
  public_handle text,
  contact_method text,
  contact_value text,
  organization text,
  preferred_chain text,
  timezone text,
  onboarding_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_order_id text NOT NULL UNIQUE,
  slug text NOT NULL,
  account_id uuid REFERENCES accounts(id),
  creator_account_id uuid REFERENCES accounts(id),
  status text NOT NULL DEFAULT 'awaiting_payment',
  receive_address text,
  chain_id integer,
  token_symbol text,
  token_address text,
  token_decimals integer,
  amount_human text,
  amount_raw text,
  amount_suffix integer,
  unique_amount_suffix text,
  usd_price numeric,
  quote_id text,
  quote_expires_at timestamptz,
  payment_expires_at timestamptz,
  brief_sha256 text,
  customer_name text,
  contact_method text,
  contact_value text,
  project_link text,
  brief text,
  expected_output text,
  ref_links text,
  notes text,
  deadline text,
  client_ip text,
  user_agent text,
  creator_wallet text,
  paid_at timestamptz,
  work_submitted_at timestamptz,
  accepted_at timestamptz,
  released_at timestamptz,
  delivered_at timestamptz,
  -- NFT proof-of-purchase receipt (soulbound ERC-721). Decoupled from payment:
  -- an async sweeper mints for paid orders. Never affects order.status.
  nft_status text NOT NULL DEFAULT 'none',
  nft_token_id text,
  nft_mint_tx text,
  nft_contract text,
  nft_chain_id integer,
  nft_minted_at timestamptz,
  nft_attempts integer NOT NULL DEFAULT 0,
  nft_last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_nft_status_check CHECK (nft_status IN ('none','pending','minted','failed')),
  CONSTRAINT orders_status_check CHECK (status IN (
    'pending','awaiting_payment','payment_submitted','paid','work_submitted','reviewing','accepted',
    'in_progress','awaiting_client','ready_for_review','delivered','released','completed','expired','cancelled','disputed','refunded'
  ))
);
CREATE INDEX IF NOT EXISTS orders_account_idx ON orders(account_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE UNIQUE INDEX IF NOT EXISTS orders_active_payment_amount_unique
  ON orders (chain_id, token_symbol, amount_raw)
  WHERE status IN ('awaiting_payment','payment_submitted','pending');
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_active_unique_amount_suffix
  ON orders (chain_id, token_symbol, unique_amount_suffix)
  WHERE status IN ('awaiting_payment','payment_submitted','pending') AND unique_amount_suffix IS NOT NULL;

-- NFT receipt columns for pre-existing orders tables (CREATE TABLE above is a
-- no-op once the table exists, so add them explicitly — safe to re-run).
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS nft_status text NOT NULL DEFAULT 'none';
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS nft_token_id text;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS nft_mint_tx text;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS nft_contract text;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS nft_chain_id integer;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS nft_minted_at timestamptz;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS nft_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS nft_last_error text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_nft_token_id_unique
  ON orders (nft_token_id) WHERE nft_token_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_nft_pending_idx
  ON orders (status, nft_status) WHERE nft_status IN ('none','pending','failed');

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  chain_id integer NOT NULL,
  tx_hash text NOT NULL,
  from_address text,
  to_address text,
  token_symbol text,
  token_address text,
  amount_raw text,
  amount_human text,
  block_number bigint,
  block_timestamp timestamptz,
  confirmations integer,
  verified_at timestamptz DEFAULT now(),
  raw_receipt jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS payments_chain_tx_unique ON payments (chain_id, lower(tx_hash));

CREATE TABLE IF NOT EXISTS payment_quotes (
  id text PRIMARY KEY,
  service_slug text,
  chain_id integer,
  token_symbol text,
  token_address text,
  token_decimals integer,
  usd_price text,
  token_usd_price text,
  amount_human text,
  amount_raw text,
  source text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questpay_order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS questpay_order_events_order_idx ON questpay_order_events(order_id, created_at DESC);

-- Buyer/creator-facing lifecycle feed (status transitions + private creator
-- progress notes) shown on /orders/[publicOrderId]. SEPARATE from the low-level
-- questpay_order_events audit log above. Access is server-only and gated to the
-- order's participants (buyer / assigned creator / admin) in application code —
-- progress notes are private and never exposed on public surfaces. See
-- supabase/migrations/20260723_questpay_v13_order_events.sql for the backfill.
CREATE TABLE IF NOT EXISTS order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  actor_role text NOT NULL CHECK (actor_role IN ('buyer','creator','admin','system')),
  event_type text NOT NULL CHECK (event_type IN ('status_change','progress_note')),
  from_status text,
  to_status text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_events_order_created_idx ON order_events(order_id, created_at);

CREATE TABLE IF NOT EXISTS questpay_email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid,
  to_address text,
  subject text,
  status text,
  error text,
  email_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS creator_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  craft text NOT NULL,
  portfolio_url text,
  note text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','withdrawn')),
  reviewed_by uuid REFERENCES accounts(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS creator_applications_one_pending_per_account
  ON creator_applications(account_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS creator_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  outcome text NOT NULL DEFAULT '',
  usd_price numeric(12,2) NOT NULL CHECK (usd_price >= 0),
  delivery text NOT NULL DEFAULT '',
  revisions text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(creator_account_id, slug)
);

CREATE TABLE IF NOT EXISTS work_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES accounts(id),
  note text NOT NULL DEFAULT '',
  delivery_url text,
  file_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  chain_id integer NOT NULL,
  from_address text NOT NULL,
  to_address text NOT NULL,
  token_symbol text NOT NULL,
  token_address text,
  amount_raw text NOT NULL,
  amount_human text NOT NULL,
  tx_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','broadcast','confirmed','failed','skipped')),
  failure_reason text,
  idempotency_key text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS releases_order_id_unique ON releases(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS releases_idempotency_key_unique ON releases(idempotency_key);

-- Seed root super admin account + roles
INSERT INTO accounts (id, primary_email, status)
VALUES ('00000000-0000-4000-8000-000000000001', 'winanyaarya@gmail.com', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO account_roles (account_id, role)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'buyer'),
  ('00000000-0000-4000-8000-000000000001', 'creator'),
  ('00000000-0000-4000-8000-000000000001', 'super_admin')
ON CONFLICT (account_id, role) DO NOTHING;

INSERT INTO root_identity_claims (provider, normalized_identifier, target_account_id)
VALUES
  ('google_email', 'winanyaarya@gmail.com', '00000000-0000-4000-8000-000000000001'),
  ('wallet', '0xea8ab08eabbead7e3d28cb067ec7f638d40b39cf', '00000000-0000-4000-8000-000000000001'),
  ('wallet', '0xa111a8c806b1fac9d27650455344f5c2f144a743', '00000000-0000-4000-8000-000000000001')
ON CONFLICT (provider, normalized_identifier) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- Auth-schema reconciliation (see supabase/migrations/*_v11_neon_auth_schema_fix).
-- These tables/columns are required by src/lib/auth.ts but were absent from
-- earlier consolidated schemas (the Supabase migrations wrap them in RLS/auth.uid()
-- which is invalid on Neon — omitted here; access is server-only). Idempotent.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_nonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  nonce_hash text NOT NULL UNIQUE,
  domain text NOT NULL,
  chain_id integer NOT NULL DEFAULT 137,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wallet_nonces_wallet_idx ON wallet_nonces(wallet_address);
CREATE INDEX IF NOT EXISTS wallet_nonces_expires_idx ON wallet_nonces(expires_at);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_account_id uuid NOT NULL REFERENCES accounts(id),
  action text NOT NULL,
  target_account_id uuid REFERENCES accounts(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS account_identities ADD COLUMN IF NOT EXISTS normalized_wallet text;
ALTER TABLE IF EXISTS account_identities ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE IF EXISTS account_identities ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS account_identities ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS account_identities_wallet_idx ON account_identities(normalized_wallet);

ALTER TABLE IF EXISTS account_roles ADD COLUMN IF NOT EXISTS grant_reason text;
ALTER TABLE IF EXISTS account_roles ADD COLUMN IF NOT EXISTS granted_by uuid REFERENCES accounts(id);
ALTER TABLE IF EXISTS account_roles ADD COLUMN IF NOT EXISTS revoked_by uuid REFERENCES accounts(id);
