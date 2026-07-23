-- QuestPay v11 — Neon auth-schema reconciliation (idempotent, Neon-safe)
--
-- WHY: prod Neon was built from the consolidated db/neon-schema.sql, which had
-- drifted from the code (src/lib/auth.ts, profile.ts). The live payment test
-- surfaced that wallet sign-in + onboarding were fully broken in production:
--   * wallet_nonces + admin_audit_log tables were absent (SIWE → nonce_not_found),
--   * account_identities lacked normalized_wallet/verified_at/is_primary/metadata
--     (identity insert failed → empty identityId → session insert failed too),
--   * account_roles lacked grant_reason (role insert failed),
--   * the code uses table account_profiles but the schema created `profiles`
--     (onboarding 500 → orders blocked on profile completion).
--
-- These tables carry RLS + auth.uid() policies in the Supabase migrations; those
-- are OMITTED here because auth.uid() does not exist on Neon and access is
-- server-only via the service credential (RLS would only break plain Postgres).

-- ── missing auth tables ──────────────────────────────────────────────
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

-- ── account_identities column drift (code inserts these) ─────────────
ALTER TABLE IF EXISTS account_identities ADD COLUMN IF NOT EXISTS normalized_wallet text;
ALTER TABLE IF EXISTS account_identities ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE IF EXISTS account_identities ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS account_identities ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS account_identities_wallet_idx ON account_identities(normalized_wallet);

-- ── account_roles column drift ───────────────────────────────────────
ALTER TABLE IF EXISTS account_roles ADD COLUMN IF NOT EXISTS grant_reason text;
ALTER TABLE IF EXISTS account_roles ADD COLUMN IF NOT EXISTS granted_by uuid REFERENCES accounts(id);
ALTER TABLE IF EXISTS account_roles ADD COLUMN IF NOT EXISTS revoked_by uuid REFERENCES accounts(id);

-- ── profiles → account_profiles (the name the code actually uses) ─────
-- Clone the existing profiles structure if account_profiles is absent.
DO $$
BEGIN
  IF to_regclass('public.account_profiles') IS NULL THEN
    IF to_regclass('public.profiles') IS NOT NULL THEN
      EXECUTE 'CREATE TABLE account_profiles (LIKE profiles INCLUDING ALL)';
    ELSE
      EXECUTE $ddl$
        CREATE TABLE account_profiles (
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
        )
      $ddl$;
    END IF;
  END IF;
END $$;
