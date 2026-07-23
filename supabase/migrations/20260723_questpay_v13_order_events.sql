-- QuestPay v13 — Buyer/creator-facing order lifecycle feed (order_events)
-- Idempotent, Neon-safe (no RLS / auth.uid(); access is server-only and gated
-- to order participants in application code). Runs AFTER v12.
--
-- WHY: /orders/[publicOrderId] needs a human-readable progress timeline —
-- status transitions plus private creator progress notes. This is SEPARATE
-- from `questpay_order_events` (the low-level system audit log written inside
-- the frozen payment/verify/release paths); that table stays untouched.
--
-- Rollback: DROP TABLE IF EXISTS order_events;  (no other object depends on it;
-- the FK is ON DELETE CASCADE from orders, so dropping is safe and reversible).

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

CREATE INDEX IF NOT EXISTS order_events_order_created_idx
  ON order_events (order_id, created_at);

-- ── Backfill (idempotent) ────────────────────────────────────────────
-- Seed a minimal timeline for orders that predate this table so existing
-- (and the real PAID) orders show a non-empty feed immediately.
--
-- Each INSERT is guarded by NOT EXISTS on the synthetic (actor_role='system',
-- event_type='status_change', to_status=…) shape it writes, so re-running the
-- migration never duplicates rows. Live hooks only ever write accept /
-- work_submitted / studio-transition rows (never these system rows), so there
-- is no collision with runtime events.

-- 1. "Order placed" — one per existing order, at its creation time.
INSERT INTO order_events (order_id, actor_role, event_type, from_status, to_status, note, created_at)
SELECT o.id, 'system', 'status_change', NULL, 'awaiting_payment', NULL, o.created_at
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM order_events e
  WHERE e.order_id = o.id
    AND e.actor_role = 'system'
    AND e.event_type = 'status_change'
    AND e.to_status = 'awaiting_payment'
);

-- 2. "Payment confirmed" — one per order that has a recorded paid_at.
INSERT INTO order_events (order_id, actor_role, event_type, from_status, to_status, note, created_at)
SELECT o.id, 'system', 'status_change', 'awaiting_payment', 'paid', NULL, o.paid_at
FROM orders o
WHERE o.paid_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM order_events e
    WHERE e.order_id = o.id
      AND e.actor_role = 'system'
      AND e.event_type = 'status_change'
      AND e.to_status = 'paid'
  );
