-- QuestPay v14 — service → creator mapping (makes orders assignable/scopable)
-- Idempotent, Neon-safe (server-only access; no RLS / auth.uid()). Runs AFTER v13.
--
-- WHY: orders.creator_account_id / creator_wallet were never populated on order
-- create, so custody release refused (creator_wallet_missing) and the per-order
-- creator-ownership guards on work-submit / progress / studio-status were dead code
-- (Agent R F1/F2/F3). This table is the SERVER-side source of truth for which
-- creator account owns each service; POST /api/orders reads it to stamp every new
-- order's creator_account_id + creator_wallet. The client can never supply them.

CREATE TABLE IF NOT EXISTS public.service_creators (
  service_slug       text PRIMARY KEY,
  creator_account_id uuid NOT NULL REFERENCES public.accounts(id),
  creator_wallet     text NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_creators_creator_account
  ON public.service_creators (creator_account_id);

-- Scoping index: studio/creator order views filter by orders.creator_account_id.
CREATE INDEX IF NOT EXISTS idx_orders_creator_account
  ON public.orders (creator_account_id)
  WHERE creator_account_id IS NOT NULL;

-- Seed the current static catalog (src/lib/services.ts) to the v12 creator account
-- (wallet 0xEa8Ab08eaBBEAD7e3D28Cb067eC7f638d40b39cf, normalized lowercase).
-- Upsert so a re-run repairs drift. If the catalog gains a service, add it here.
INSERT INTO public.service_creators (service_slug, creator_account_id, creator_wallet)
VALUES
  ('ux-quick-look',     '00000000-0000-4000-8000-000000000002', '0xea8ab08eabbead7e3d28cb067ec7f638d40b39cf'),
  ('ui-review',         '00000000-0000-4000-8000-000000000002', '0xea8ab08eabbead7e3d28cb067ec7f638d40b39cf'),
  ('quick-fix',         '00000000-0000-4000-8000-000000000002', '0xea8ab08eabbead7e3d28cb067ec7f638d40b39cf'),
  ('component-build',   '00000000-0000-4000-8000-000000000002', '0xea8ab08eabbead7e3d28cb067ec7f638d40b39cf'),
  ('landing-polish',    '00000000-0000-4000-8000-000000000002', '0xea8ab08eabbead7e3d28cb067ec7f638d40b39cf'),
  ('integration-sprint','00000000-0000-4000-8000-000000000002', '0xea8ab08eabbead7e3d28cb067ec7f638d40b39cf')
ON CONFLICT (service_slug) DO UPDATE
  SET creator_account_id = EXCLUDED.creator_account_id,
      creator_wallet     = EXCLUDED.creator_wallet,
      updated_at         = now();
