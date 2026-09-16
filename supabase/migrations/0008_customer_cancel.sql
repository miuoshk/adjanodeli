-- Customer cancel of paid orders until cutoff on the day before pickup (SPEC §5–6).
-- Monday pickup → Sunday 20:00, not Friday.

alter table public.settings
  add column if not exists customer_cancellation_enabled boolean not null default true;

create or replace function public.customer_cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_order public.orders%rowtype;
  v_settings public.settings%rowtype;
  v_deadline timestamptz;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into strict v_settings from public.settings where id = 1;
  if not v_settings.customer_cancellation_enabled then
    raise exception 'CANCELLATION_DISABLED';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.user_id is distinct from v_uid then
    raise exception 'FORBIDDEN';
  end if;

  if v_order.status <> 'paid' then
    raise exception 'INVALID_TRANSITION';
  end if;

  -- pickup_date - 1 day + cutoff, as Europe/Warsaw wall clock.
  v_deadline := ((v_order.pickup_date - 1) + v_settings.cutoff_time) at time zone 'Europe/Warsaw';
  if public.warsaw_now() >= v_deadline then
    raise exception 'CANCEL_DEADLINE_PASSED';
  end if;

  update public.orders
  set
    status = 'cancelled',
    cancelled_at = coalesce(cancelled_at, now())
  where id = p_order_id;

  perform public.release_order_stock(p_order_id);
  perform public.restore_loyalty_for_order(p_order_id);

  insert into public.order_events (order_id, from_status, to_status, actor, note)
  values (p_order_id, 'paid', 'cancelled', v_uid, 'customer_cancel');
end;
$$;

grant execute on function public.customer_cancel_order(uuid) to authenticated;

create or replace function public.mark_order_refunded(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.status = 'refunded' then
    return;
  end if;

  if v_order.status <> 'cancelled' then
    raise exception 'INVALID_TRANSITION';
  end if;

  update public.orders
  set status = 'refunded'
  where id = p_order_id;

  perform public.restore_loyalty_for_order(p_order_id);

  insert into public.order_events (order_id, from_status, to_status, actor, note)
  values (p_order_id, 'cancelled', 'refunded', null, 'stripe_refund');
end;
$$;

revoke all on function public.mark_order_refunded(uuid) from public;
revoke all on function public.mark_order_refunded(uuid) from anon, authenticated;
grant execute on function public.mark_order_refunded(uuid) to service_role;
