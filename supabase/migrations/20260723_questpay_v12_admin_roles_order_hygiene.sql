-- QuestPay v12 — Admin/Creator role split + order archive hygiene
-- Idempotent, Neon-safe (no RLS / auth.uid(); access is server-only via the
-- service credential). Runs AFTER v11.
--
-- WHY: the v5 bootstrap seeded BOTH the escrow wallet
--   0xa111a8c806b1fac9d27650455344f5c2f144a743 (SUPER_ADMIN) and the creator
--   wallet 0xea8ab08eabbead7e3d28cb067ec7f638d40b39cf onto the SAME root
--   account, so the creator wallet resolved to super_admin. The new
--   architecture makes admin authorization env-driven (ROOT_SUPER_ADMIN_WALLETS,
--   read in src/lib/auth.ts) and demotes the creator wallet to `creator`.
--
-- This migration fixes the DATA so the creator wallet no longer maps to the
-- root (super_admin) account. The escrow wallet is untouched and remains the
-- sole super_admin (also enforced in code from the env allowlist).

-- ── 1. Split the creator wallet off the root super_admin account ──────
DO $$
DECLARE
  root_account    uuid := '00000000-0000-4000-8000-000000000001';
  creator_account uuid := '00000000-0000-4000-8000-000000000002';
  creator_wallet  text := '0xea8ab08eabbead7e3d28cb067ec7f638d40b39cf';
BEGIN
  -- Dedicated creator account — buyer + creator ONLY, never super_admin.
  -- (accounts has no display_name column — that lives on account_profiles.)
  INSERT INTO accounts (id, status)
  VALUES (creator_account, 'active')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO account_profiles (account_id, display_name)
  VALUES (creator_account, 'QuestPay Creator')
  ON CONFLICT (account_id) DO NOTHING;

  INSERT INTO account_roles (account_id, role, grant_reason)
  VALUES
    (creator_account, 'buyer',   'creator wallet split (v12)'),
    (creator_account, 'creator', 'creator wallet split (v12)')
  ON CONFLICT (account_id, role) DO NOTHING;

  -- Belt-and-braces: the creator account must never carry a super_admin grant.
  DELETE FROM account_roles
  WHERE account_id = creator_account AND role = 'super_admin';

  -- Stop the creator wallet from claiming the root (super_admin) account and
  -- re-point its root-identity claim at the dedicated creator account so future
  -- logins land on a stable, non-admin account.
  INSERT INTO root_identity_claims (provider, normalized_identifier, target_account_id, claimed_at)
  VALUES ('wallet', creator_wallet, creator_account, now())
  ON CONFLICT (provider, normalized_identifier)
  DO UPDATE SET target_account_id = EXCLUDED.target_account_id,
                claimed_at        = COALESCE(root_identity_claims.claimed_at, now());

  -- If the creator wallet identity was already attached to the root account
  -- from a prior login, move it to the creator account. The partial unique
  -- index on normalized_wallet means it can live on exactly one account.
  UPDATE account_identities
  SET account_id = creator_account
  WHERE provider = 'wallet'
    AND normalized_wallet = creator_wallet
    AND account_id = root_account;

  -- Revoke any live session authenticated via the creator wallet identity, so a
  -- pre-split session bound to the root account cannot linger as super_admin via
  -- the ROOT_EMAIL path; the next sign-in re-resolves to the creator account.
  -- Only the creator wallet's own sessions are touched — the escrow admin is untouched.
  UPDATE account_sessions
  SET revoked_at = now()
  WHERE revoked_at IS NULL
    AND authenticated_identity_id IN (
      SELECT ai.id FROM account_identities ai
      WHERE ai.provider = 'wallet' AND ai.normalized_wallet = creator_wallet
    );
END $$;

-- ── 2. Order archive support (admin soft-archive of non-paid orders) ──
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES public.accounts(id);

-- Extend the lifecycle status check to allow 'archived' (superset of v7).
ALTER TABLE IF EXISTS public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE IF EXISTS public.orders
  ADD CONSTRAINT orders_status_check CHECK (
    status IN (
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
      'refunded',
      'archived'
    )
  );

CREATE INDEX IF NOT EXISTS idx_orders_archived_at
  ON public.orders (archived_at)
  WHERE archived_at IS NOT NULL;
