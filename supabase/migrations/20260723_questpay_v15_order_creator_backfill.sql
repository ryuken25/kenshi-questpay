-- QuestPay v15 — backfill order → creator for pre-v14 orders
-- Idempotent, Neon-safe. Runs AFTER v14. Only writes orders.creator_account_id /
-- creator_wallet where they are NULL; payment, verification, and receipt rows are
-- NEVER touched (protected submission evidence for qp-mrwrbroz-akkn2e stays sealed).
-- Records one admin_audit_log entry per backfilled order, guarded against duplicates
-- so a re-run is a no-op.
DO $$
DECLARE
  root_account uuid := '00000000-0000-4000-8000-000000000001';
  r RECORD;
BEGIN
  FOR r IN
    SELECT o.id, o.public_order_id, sc.creator_account_id, sc.creator_wallet
    FROM orders o
    JOIN service_creators sc ON sc.service_slug = o.slug
    WHERE o.creator_account_id IS NULL
  LOOP
    UPDATE orders
       SET creator_account_id = r.creator_account_id,
           creator_wallet     = r.creator_wallet,
           updated_at         = now()
     WHERE id = r.id
       AND creator_account_id IS NULL;   -- never overwrite an existing creator link

    IF NOT EXISTS (
      SELECT 1 FROM admin_audit_log
      WHERE action = 'order_creator_backfill'
        AND metadata->>'public_order_id' = r.public_order_id
    ) THEN
      INSERT INTO admin_audit_log (actor_account_id, action, target_account_id, metadata)
      VALUES (
        root_account,
        'order_creator_backfill',
        r.creator_account_id,
        jsonb_build_object(
          'public_order_id',    r.public_order_id,
          'creator_account_id', r.creator_account_id,
          'creator_wallet',     r.creator_wallet,
          'source',             'migration_v15',
          'note',               'payment + verification records untouched'
        )
      );
    END IF;
  END LOOP;
END $$;
