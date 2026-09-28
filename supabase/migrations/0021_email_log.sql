-- Dziennik wysyłek. Zapis tylko kluczem serwisowym, odczyt dla staff.

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete set null,
  kind text not null check (kind in (
    'order_paid',
    'order_delivered',
    'standing_reminder',
    'special_request_owner',
    'manual_refund_owner',
    'paid_after_expiry_owner',
    'test'
  )),
  recipient text not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);

create index email_log_order_id_kind_idx on public.email_log (order_id, kind);

alter table public.email_log enable row level security;

create policy email_log_select_staff
  on public.email_log
  for select
  to authenticated
  using (public.is_staff());

revoke all on public.email_log from public, anon;
grant select on public.email_log to authenticated;
grant select, insert on public.email_log to service_role;
