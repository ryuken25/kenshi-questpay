-- QuestPay perf indexes — purely additive, idempotent, safe to run multiple times.
-- Targets the hottest read paths (buyer receipts/orders, creator lists, public
-- verify). No column/constraint/behavior changes; nothing here touches payment,
-- verify, or release semantics.

-- ────────────────────────── buyer: /receipts + /orders ──────────────────────────
-- Query shape: WHERE account_id = $1 ORDER BY created_at DESC LIMIT 50
-- orders has NO index on account_id today, so this is a seq scan + sort on every
-- authenticated receipts/orders load. A composite (account_id, created_at desc)
-- lets Postgres satisfy the filter, ordering, and LIMIT from one index scan.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'account_id'
  ) then
    create index if not exists idx_orders_account_created
      on public.orders (account_id, created_at desc)
      where account_id is not null;
  end if;
end $$;

-- ────────────────────────── creator: studio order lists ──────────────────────────
-- Query shape: WHERE creator_account_id = $1 ORDER BY created_at DESC
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'creator_account_id'
  ) then
    create index if not exists idx_orders_creator_created
      on public.orders (creator_account_id, created_at desc)
      where creator_account_id is not null;
  end if;
end $$;

-- ────────────────────────── public: /verify/[txHash] ──────────────────────────
-- Query shape: WHERE lower(tx_hash) = lower($1)
-- The existing unique index is on (chain_id, lower(tx_hash)); a lookup that omits
-- the leading chain_id column cannot use it. Add a standalone expression index so
-- verify resolves by hash alone.
create index if not exists idx_payments_tx_hash_lower
  on public.payments (lower(tx_hash));

-- Refresh planner statistics so the new indexes are considered immediately.
analyze public.orders;
analyze public.payments;
