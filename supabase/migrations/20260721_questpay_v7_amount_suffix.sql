-- QuestPay v7 — unique 4-digit payment amount suffix + 30-minute expiry foundation.
-- Spec: exact-amount matching via unique decimal suffix (0001–9999) among active
-- awaiting_payment orders; payment_expires_at window; cancelled on timeout.
--
-- amount_human form: whole.XXXX  (e.g. 12.0017) where XXXX is unique_amount_suffix.
-- amount_raw is parseUnits(amount_human, token_decimals) — server-authoritative exact match.

-- ────────────────────────────── columns ──────────────────────────────
alter table if exists public.orders
  add column if not exists unique_amount_suffix text;

alter table if exists public.orders
  add column if not exists amount_suffix integer;

alter table if exists public.orders
  add column if not exists payment_expires_at timestamptz;

alter table if exists public.orders
  add column if not exists work_submitted_at timestamptz;

alter table if exists public.orders
  add column if not exists accepted_at timestamptz;

alter table if exists public.orders
  add column if not exists released_at timestamptz;

alter table if exists public.orders
  add column if not exists creator_wallet text;

comment on column public.orders.unique_amount_suffix is
  'Zero-padded 4-digit suffix (0001-9999) used as the last 4 decimals of amount_human for exact payment matching.';

comment on column public.orders.amount_suffix is
  'Integer form of unique_amount_suffix (1-9999). Kept for index/query convenience.';

-- Suffix format: 0001–9999 when present (avoid 0000).
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

-- Expand lifecycle statuses for vNext custody flow (keep legacy values).
alter table if exists public.orders drop constraint if exists orders_status_check;
alter table if exists public.orders
  add constraint orders_status_check check (
    status in (
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
    )
  );

-- Unique 4-digit suffix among orders still open for payment (per chain+token).
create unique index if not exists idx_orders_active_unique_amount_suffix
  on public.orders (chain_id, token_symbol, unique_amount_suffix)
  where status in ('awaiting_payment', 'payment_submitted', 'pending')
    and unique_amount_suffix is not null;

-- Exact amount fingerprint uniqueness per chain + token among open payment intents.
create unique index if not exists orders_active_payment_amount_unique
  on public.orders (chain_id, token_symbol, amount_raw)
  where status in ('awaiting_payment', 'payment_submitted', 'pending');

create index if not exists idx_orders_payment_expires_at
  on public.orders (payment_expires_at)
  where status in ('awaiting_payment', 'payment_submitted', 'pending');

create index if not exists idx_orders_awaiting_payment_suffix
  on public.orders (unique_amount_suffix)
  where status = 'awaiting_payment';

-- Atomic verify: exact amount_raw match + payment window enforcement.
create or replace function public.record_verified_payment(
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
  v_chain_id integer;
  v_token_symbol text;
  v_amount_raw text;
  v_payment_expires_at timestamptz;
  v_receive_address text;
begin
  select
    status,
    chain_id,
    token_symbol,
    amount_raw,
    payment_expires_at,
    receive_address
  into
    v_status,
    v_chain_id,
    v_token_symbol,
    v_amount_raw,
    v_payment_expires_at,
    v_receive_address
  from public.orders
  where id = p_order_id
  for update;

  if v_status is null then
    raise exception 'order_not_found';
  end if;

  if v_status in (
    'paid',
    'work_submitted',
    'in_progress',
    'awaiting_client',
    'ready_for_review',
    'reviewing',
    'accepted',
    'delivered',
    'released',
    'completed'
  ) then
    return;
  end if;

  if v_status not in ('awaiting_payment', 'payment_submitted', 'pending') then
    raise exception 'invalid_order_status';
  end if;

  if v_payment_expires_at is not null and v_payment_expires_at < now() then
    update public.orders
      set status = 'cancelled', updated_at = now()
      where id = p_order_id;
    insert into public.questpay_order_events (order_id, event_type, from_status, to_status, metadata)
    values (
      p_order_id,
      'order_cancelled_payment_expired',
      v_status,
      'cancelled',
      jsonb_build_object(
        'payment_expires_at', v_payment_expires_at,
        'reason', 'payment_window_elapsed'
      )
    );
    raise exception 'payment_window_expired';
  end if;

  if v_chain_id is distinct from p_chain_id then
    raise exception 'chain_mismatch';
  end if;

  if lower(coalesce(v_token_symbol, '')) <> lower(coalesce(p_token_symbol, '')) then
    raise exception 'token_mismatch';
  end if;

  -- Exact amount match (server-authoritative). Compare as normalized text.
  if trim(both from v_amount_raw::text) <> trim(both from p_amount_raw::text) then
    raise exception 'amount_mismatch';
  end if;

  if p_to_address is not null
     and v_receive_address is not null
     and lower(p_to_address) <> lower(v_receive_address) then
    raise exception 'receiver_mismatch';
  end if;

  insert into public.payments (
    order_id,
    chain_id,
    tx_hash,
    from_address,
    to_address,
    token_symbol,
    token_address,
    amount_raw,
    amount_human,
    block_number,
    block_timestamp,
    confirmations,
    raw_receipt
  )
  values (
    p_order_id,
    p_chain_id,
    lower(p_tx_hash),
    lower(p_from_address),
    lower(p_to_address),
    p_token_symbol,
    lower(coalesce(p_token_address, '')),
    p_amount_raw,
    p_amount_human,
    p_block_number,
    p_block_timestamp,
    p_confirmations,
    p_raw_receipt
  );

  update public.orders
    set status = 'paid', paid_at = now(), updated_at = now()
    where id = p_order_id;

  insert into public.questpay_order_events (order_id, event_type, from_status, to_status, metadata)
  values (
    p_order_id,
    'payment_verified',
    v_status,
    'paid',
    jsonb_build_object(
      'tx_hash', lower(p_tx_hash),
      'token', p_token_symbol,
      'amount', p_amount_human,
      'amount_raw', p_amount_raw::text,
      'exact_match', true
    )
  );
end;
$$;
