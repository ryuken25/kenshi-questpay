-- QuestPay contest v3 additive hardening.
-- Uses namespaced event tables because the shared project already owns
-- order_events/email_events for the portfolio CMS order_requests domain.

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (
  status in ('pending','awaiting_payment','paid','reviewing','accepted','in_progress','delivered','completed','expired','cancelled')
);
create index if not exists idx_orders_status_updated on public.orders (status, updated_at desc);

create table if not exists public.questpay_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_questpay_order_events_order on public.questpay_order_events(order_id,created_at desc);

create table if not exists public.questpay_email_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  site text not null default 'questpay',
  email_type text not null,
  recipient text not null,
  status text not null check (status in ('sent','failed')),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists idx_questpay_email_events_order on public.questpay_email_events(order_id,created_at desc);

alter table public.questpay_order_events enable row level security;
alter table public.questpay_email_events enable row level security;
-- No anonymous policies. QuestPay uses server-side service-role handlers only.
