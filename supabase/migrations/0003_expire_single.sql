-- expire_order: wygasza jedno pending_payment (Stripe checkout.session.expired)
-- expire_pending_orders: zwraca liczbę wygaszonych

create or replace function public.expire_order(p_order_id uuid)
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
    return;
  end if;

  if v_order.status <> 'pending_payment' then
    return;
  end if;

  update public.orders
  set status = 'expired'
  where id = p_order_id;

  perform public.release_order_stock(p_order_id);

  insert into public.order_events (order_id, from_status, to_status, actor, note)
  values (p_order_id, 'pending_payment', 'expired', null, null);
end;
$$;

revoke all on function public.expire_order(uuid) from public;
revoke all on function public.expire_order(uuid) from anon, authenticated;
grant execute on function public.expire_order(uuid) to service_role;

drop function if exists public.expire_pending_orders();

create function public.expire_pending_orders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_count int := 0;
begin
  for v_order in
    select id
    from public.orders
    where status = 'pending_payment'
      and expires_at is not null
      and expires_at < now()
    for update skip locked
  loop
    update public.orders
    set status = 'expired'
    where id = v_order.id;

    perform public.release_order_stock(v_order.id);

    insert into public.order_events (order_id, from_status, to_status, actor, note)
    values (v_order.id, 'pending_payment', 'expired', null, null);

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.expire_pending_orders() from public;
revoke all on function public.expire_pending_orders() from anon, authenticated;
grant execute on function public.expire_pending_orders() to service_role;
