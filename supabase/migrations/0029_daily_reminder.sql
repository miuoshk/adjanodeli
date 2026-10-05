-- Daily 18:00 reminder. Separate from marketing_consent.
-- Sent only after the customer opts in.

alter table public.profiles
  add column daily_reminder boolean not null default false,
  add column daily_reminder_consent_at timestamptz,
  add column daily_reminder_consent_text text,
  add column daily_reminder_prompted_at timestamptz,
  add column unsubscribe_token uuid not null default gen_random_uuid();

alter table public.profiles
  add constraint profiles_unsubscribe_token_key unique (unsubscribe_token);

alter table public.settings
  add column daily_reminder_enabled boolean not null default false;

alter table public.orders
  add column entry_source text;

alter table public.orders
  drop constraint if exists orders_entry_source_check;

alter table public.orders
  add constraint orders_entry_source_check
  check (entry_source is null or entry_source = 'przypomnienie');

alter table public.email_log
  drop constraint if exists email_log_kind_check;

alter table public.email_log
  add constraint email_log_kind_check
  check (kind in (
    'order_paid',
    'order_delivered',
    'standing_reminder',
    'special_request_owner',
    'manual_refund_owner',
    'paid_after_expiry_owner',
    'pickup_point_changed',
    'daily_reminder',
    'test'
  ));

-- Who would get today's reminder for a given pickup day.
-- The cron decides that the day is tomorrow and that the setting is on.
create or replace function public.daily_reminder_recipients(p_pickup_day date, p_today date)
returns table (
  user_id uuid,
  email text,
  unsubscribe_token uuid,
  point_name text,
  pickup_from time,
  pickup_to time
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.email,
    p.unsubscribe_token,
    pt.name,
    pt.pickup_from,
    pt.pickup_to
  from public.profiles p
  left join lateral (
    select o.pickup_point_id
    from public.orders o
    where o.user_id = p.id
      and o.status in ('paid', 'in_production', 'delivered', 'picked_up')
    order by o.created_at desc
    limit 1
  ) last_order on true
  left join public.pickup_points pt on pt.id = last_order.pickup_point_id
  where p.daily_reminder
    and not exists (
      select 1
      from public.orders o
      where o.user_id = p.id
        and o.pickup_date = p_pickup_day
        and o.status in ('paid', 'in_production', 'delivered', 'picked_up')
    )
    and not exists (
      select 1
      from public.email_log e
      where e.recipient = p.email
        and e.kind = 'standing_reminder'
        and e.status = 'sent'
        and (e.created_at at time zone 'Europe/Warsaw')::date = p_today
    )
    and not exists (
      select 1
      from public.email_log e
      where e.recipient = p.email
        and e.kind = 'daily_reminder'
        and e.status = 'sent'
        and (e.created_at at time zone 'Europe/Warsaw')::date = p_today
    );
$$;

revoke all on function public.daily_reminder_recipients(date, date) from public, anon, authenticated;
grant execute on function public.daily_reminder_recipients(date, date) to service_role;

create or replace function public.disable_daily_reminder(p_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_token is null then
    return;
  end if;

  update public.profiles
  set
    daily_reminder = false,
    daily_reminder_prompted_at = now()
  where unsubscribe_token = p_token;
end;
$$;

revoke all on function public.disable_daily_reminder(uuid) from public;
grant execute on function public.disable_daily_reminder(uuid) to anon, authenticated;

create or replace function public.note_order_entry_source(p_order_id uuid, p_source text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_source is distinct from 'przypomnienie' then
    return;
  end if;

  update public.orders
  set entry_source = 'przypomnienie'
  where id = p_order_id
    and user_id = auth.uid()
    and entry_source is null
    and created_at > now() - interval '30 minutes';
end;
$$;

revoke all on function public.note_order_entry_source(uuid, text) from public, anon;
grant execute on function public.note_order_entry_source(uuid, text) to authenticated;
