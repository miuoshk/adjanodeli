-- Loyalty stamps and vouchers (SPEC §13).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.loyalty_stamps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  order_id uuid not null references public.orders (id),
  earned_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  cycle_started_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.loyalty_vouchers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('PCT10', 'PCT50', 'ONE_GROSZ')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_order_id uuid references public.orders (id),
  restored_from_order_id uuid references public.orders (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.loyalty_stamps
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.loyalty_vouchers
  for each row execute function public.set_updated_at();

create index loyalty_stamps_user_active_idx
  on public.loyalty_stamps (user_id, expires_at)
  where consumed_at is null;

create index loyalty_stamps_order_id_idx on public.loyalty_stamps (order_id);
create index loyalty_vouchers_user_id_idx on public.loyalty_vouchers (user_id);
create index loyalty_vouchers_used_order_id_idx on public.loyalty_vouchers (used_order_id);

-- ---------------------------------------------------------------------------
-- RLS: select own; writes only via SECURITY DEFINER
-- ---------------------------------------------------------------------------

alter table public.loyalty_stamps enable row level security;
alter table public.loyalty_vouchers enable row level security;

create policy loyalty_stamps_select_own
  on public.loyalty_stamps
  for select
  to authenticated
  using (user_id = auth.uid());

create policy loyalty_vouchers_select_own
  on public.loyalty_vouchers
  for select
  to authenticated
  using (user_id = auth.uid());

grant select on public.loyalty_stamps to authenticated;
grant select on public.loyalty_vouchers to authenticated;

-- ---------------------------------------------------------------------------
-- loyalty_status
-- ---------------------------------------------------------------------------

create or replace function public.loyalty_status(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_n int;
  v_next int;
  v_vouchers jsonb;
begin
  if auth.uid() is not null
     and auth.uid() is distinct from p_user
     and not public.is_staff()
  then
    raise exception 'FORBIDDEN';
  end if;

  select count(*)::int
  into v_n
  from public.loyalty_stamps
  where user_id = p_user
    and consumed_at is null
    and expires_at > now();

  if v_n < 10 then
    v_next := 10;
  elsif v_n < 20 then
    v_next := 20;
  else
    v_next := 30;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', v.id,
        'type', v.type,
        'issued_at', v.issued_at,
        'expires_at', v.expires_at
      )
      order by v.expires_at
    ),
    '[]'::jsonb
  )
  into v_vouchers
  from public.loyalty_vouchers v
  where v.user_id = p_user
    and v.used_order_id is null
    and v.expires_at > now();

  return jsonb_build_object(
    'active_stamps', v_n,
    'next_threshold', v_next,
    'vouchers', v_vouchers
  );
end;
$$;

grant execute on function public.loyalty_status(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- grant_stamps_for_order
-- Thresholds (deterministic):
-- After insert, N = active (unexpired, unconsumed) stamps in the current cycle.
-- cycle_started_at is copied from existing active stamps, or now() if none.
-- A voucher of a given type is issued at most once per cycle
-- (exists loyalty_vouchers where issued_at >= cycle_started_at).
-- 1) N >= 30 → issue ONE_GROSZ, consume all active stamps, stop.
-- 2) else N >= 20 and no PCT50 in this cycle → issue PCT50.
-- 3) else/also N >= 10 and no PCT10 in this cycle → issue PCT10.
-- Jumping over a threshold (8 → 13 or 8 → 25) still issues the crossed
-- voucher(s). Hitting 30+ issues only ONE_GROSZ.
-- ---------------------------------------------------------------------------

create or replace function public.grant_stamps_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_qty int;
  v_cycle timestamptz;
  v_n int;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    return;
  end if;

  perform 1 from public.profiles where id = v_order.user_id for update;

  if exists (
    select 1 from public.loyalty_stamps where order_id = p_order_id
  ) then
    return;
  end if;

  select coalesce(sum(qty), 0)::int
  into v_qty
  from public.order_items
  where order_id = p_order_id;

  if v_qty < 1 then
    return;
  end if;

  select min(cycle_started_at)
  into v_cycle
  from public.loyalty_stamps
  where user_id = v_order.user_id
    and consumed_at is null
    and expires_at > now();

  if v_cycle is null then
    v_cycle := now();
  end if;

  insert into public.loyalty_stamps (
    user_id,
    order_id,
    earned_at,
    expires_at,
    cycle_started_at
  )
  select
    v_order.user_id,
    p_order_id,
    now(),
    now() + interval '60 days',
    v_cycle
  from generate_series(1, v_qty);

  select count(*)::int
  into v_n
  from public.loyalty_stamps
  where user_id = v_order.user_id
    and consumed_at is null
    and expires_at > now();

  if v_n >= 30 then
    insert into public.loyalty_vouchers (user_id, type, issued_at, expires_at)
    values (v_order.user_id, 'ONE_GROSZ', now(), now() + interval '30 days');

    update public.loyalty_stamps
    set consumed_at = now()
    where user_id = v_order.user_id
      and consumed_at is null
      and expires_at > now();

    return;
  end if;

  if v_n >= 20
     and not exists (
       select 1
       from public.loyalty_vouchers
       where user_id = v_order.user_id
         and type = 'PCT50'
         and issued_at >= v_cycle
     )
  then
    insert into public.loyalty_vouchers (user_id, type, issued_at, expires_at)
    values (v_order.user_id, 'PCT50', now(), now() + interval '30 days');
  end if;

  if v_n >= 10
     and not exists (
       select 1
       from public.loyalty_vouchers
       where user_id = v_order.user_id
         and type = 'PCT10'
         and issued_at >= v_cycle
     )
  then
    insert into public.loyalty_vouchers (user_id, type, issued_at, expires_at)
    values (v_order.user_id, 'PCT10', now(), now() + interval '30 days');
  end if;
end;
$$;

revoke all on function public.grant_stamps_for_order(uuid) from public;
revoke all on function public.grant_stamps_for_order(uuid) from anon, authenticated;
grant execute on function public.grant_stamps_for_order(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- restore_loyalty_for_order — cancel / expire / refund
-- ---------------------------------------------------------------------------

create or replace function public.restore_loyalty_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.loyalty_stamps
  where order_id = p_order_id;

  update public.loyalty_vouchers
  set
    used_order_id = null,
    restored_from_order_id = p_order_id
  where used_order_id = p_order_id
    and expires_at > now();
end;
$$;

revoke all on function public.restore_loyalty_for_order(uuid) from public;
revoke all on function public.restore_loyalty_for_order(uuid) from anon, authenticated;
grant execute on function public.restore_loyalty_for_order(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- create_order + p_voucher_id
-- ---------------------------------------------------------------------------

drop function if exists public.create_order(uuid, date, jsonb, text);

create or replace function public.create_order(
  p_pickup_point_id uuid,
  p_pickup_date date,
  p_items jsonb,
  p_note text,
  p_voucher_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_settings public.settings%rowtype;
  v_point public.pickup_points%rowtype;
  v_profile public.profiles%rowtype;
  v_item jsonb;
  v_product_id uuid;
  v_qty int;
  v_avail record;
  v_stock public.daily_stock%rowtype;
  v_product public.products%rowtype;
  v_subtotal int := 0;
  v_discount int := 0;
  v_total int;
  v_cheapest int;
  v_order_id uuid;
  v_code text;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_try int;
  v_i int;
  v_dow int;
  v_item_count int;
  v_voucher public.loyalty_vouchers%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into v_profile from public.profiles where id = v_uid;
  if not found then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into strict v_settings from public.settings where id = 1;

  if p_note is not null and char_length(p_note) > 200 then
    raise exception 'INVALID_ITEMS';
  end if;

  if not exists (
    select 1
    from public.available_pickup_dates() d
    where d = p_pickup_date
  ) then
    raise exception 'DATE_NOT_AVAILABLE';
  end if;

  select * into v_point from public.pickup_points where id = p_pickup_point_id;
  v_dow := extract(isodow from p_pickup_date)::int;
  if not found
     or not v_point.is_active
     or not (v_dow = any (v_point.weekdays))
  then
    raise exception 'POINT_NOT_AVAILABLE';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ITEMS';
  end if;

  v_item_count := jsonb_array_length(p_items);
  if v_item_count < 1 or v_item_count > 30 then
    raise exception 'INVALID_ITEMS';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    begin
      v_product_id := (v_item ->> 'product_id')::uuid;
      v_qty := (v_item ->> 'qty')::int;
    exception
      when others then
        raise exception 'INVALID_ITEMS';
    end;

    if v_product_id is null
       or v_qty is null
       or v_qty < 1
       or v_qty > v_settings.max_qty_per_item
    then
      raise exception 'INVALID_ITEMS';
    end if;
  end loop;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'qty')::int;

    select *
    into v_avail
    from public.product_availability(p_pickup_date) pa
    where pa.product_id = v_product_id;

    if not found then
      raise exception 'OUT_OF_STOCK:%:%', v_product_id, 0;
    end if;

    insert into public.daily_stock (product_id, day, cap)
    values (v_product_id, p_pickup_date, v_avail.cap)
    on conflict (product_id, day) do nothing;

    select *
    into v_stock
    from public.daily_stock
    where product_id = v_product_id
      and day = p_pickup_date
    for update;

    select *
    into v_avail
    from public.product_availability(p_pickup_date) pa
    where pa.product_id = v_product_id;

    if not v_avail.is_available
       or v_stock.reserved_qty + v_qty > v_stock.cap
    then
      raise exception 'OUT_OF_STOCK:%:%',
        v_product_id,
        greatest(v_stock.cap - v_stock.reserved_qty, 0);
    end if;

    update public.daily_stock
    set reserved_qty = reserved_qty + v_qty
    where id = v_stock.id;
  end loop;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'qty')::int;

    select * into v_product from public.products where id = v_product_id;
    if not found then
      raise exception 'OUT_OF_STOCK:%:%', v_product_id, 0;
    end if;

    v_subtotal := v_subtotal + (v_product.price_grosze * v_qty);
    if v_cheapest is null or v_product.price_grosze < v_cheapest then
      v_cheapest := v_product.price_grosze;
    end if;
  end loop;

  if p_voucher_id is not null then
    select * into v_voucher
    from public.loyalty_vouchers
    where id = p_voucher_id
    for update;

    if not found
       or v_voucher.user_id is distinct from v_uid
       or v_voucher.used_order_id is not null
       or v_voucher.expires_at <= now()
    then
      raise exception 'VOUCHER_INVALID';
    end if;

    if v_voucher.type = 'PCT10' then
      v_discount := v_subtotal / 10;
    elsif v_voucher.type = 'PCT50' then
      v_discount := least(v_subtotal / 2, 4000);
    elsif v_voucher.type = 'ONE_GROSZ' then
      if v_cheapest is not null and v_cheapest > 1 then
        v_discount := v_cheapest - 1;
      else
        v_discount := 0;
      end if;
    end if;
  end if;

  v_total := v_subtotal - v_discount;
  if v_discount > 0 and v_total < 200 then
    raise exception 'TOTAL_BELOW_MINIMUM';
  end if;

  v_code := null;
  for v_try in 1 .. 20 loop
    v_code := '';
    for v_i in 1 .. 4 loop
      v_code := v_code || substr(
        v_alphabet,
        1 + floor(random() * length(v_alphabet))::int,
        1
      );
    end loop;

    exit when not exists (
      select 1
      from public.orders
      where pickup_date = p_pickup_date
        and pickup_code = v_code
    );
    v_code := null;
  end loop;

  if v_code is null then
    raise exception 'PICKUP_CODE_UNAVAILABLE';
  end if;

  insert into public.orders (
    user_id,
    pickup_point_id,
    pickup_date,
    status,
    pickup_code,
    customer_name,
    customer_phone,
    customer_email,
    note,
    subtotal_grosze,
    discount_grosze,
    total_grosze,
    expires_at,
    terms_accepted_at
  )
  values (
    v_uid,
    p_pickup_point_id,
    p_pickup_date,
    'pending_payment',
    v_code,
    coalesce(nullif(trim(v_profile.full_name), ''), v_profile.email),
    v_profile.phone,
    v_profile.email,
    p_note,
    v_subtotal,
    v_discount,
    v_total,
    now() + (v_settings.pending_order_ttl_minutes || ' minutes')::interval,
    now()
  )
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'qty')::int;

    select * into v_product from public.products where id = v_product_id;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      unit_price_grosze,
      qty
    )
    values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price_grosze,
      v_qty
    );
  end loop;

  if p_voucher_id is not null then
    update public.loyalty_vouchers
    set used_order_id = v_order_id
    where id = p_voucher_id;
  end if;

  insert into public.order_events (order_id, from_status, to_status, actor, note)
  values (v_order_id, null, 'pending_payment', v_uid, null);

  return v_order_id;
end;
$$;

grant execute on function public.create_order(uuid, date, jsonb, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- mark_order_paid grants stamps
-- ---------------------------------------------------------------------------

create or replace function public.mark_order_paid(
  p_order_id uuid,
  p_payment_intent_id text
)
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

  if v_order.status = 'paid' then
    return;
  end if;

  if v_order.status = 'expired' then
    raise exception 'ORDER_EXPIRED';
  end if;

  if v_order.status <> 'pending_payment' then
    raise exception 'INVALID_TRANSITION';
  end if;

  update public.orders
  set
    status = 'paid',
    paid_at = now(),
    stripe_payment_intent_id = p_payment_intent_id
  where id = p_order_id;

  insert into public.order_events (order_id, from_status, to_status, actor, note)
  values (p_order_id, 'pending_payment', 'paid', null, null);

  perform public.grant_stamps_for_order(p_order_id);
end;
$$;

revoke all on function public.mark_order_paid(uuid, text) from public;
revoke all on function public.mark_order_paid(uuid, text) from anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- set_order_status: restore loyalty on cancelled / refunded
-- ---------------------------------------------------------------------------

create or replace function public.set_order_status(
  p_order_id uuid,
  p_status text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_allowed boolean := false;
  v_needs_owner boolean := false;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.status = 'pending_payment' and p_status = 'cancelled' then
    v_allowed := true;
    v_needs_owner := true;
  elsif v_order.status = 'paid' and p_status = 'in_production' then
    v_allowed := true;
  elsif v_order.status = 'paid' and p_status = 'cancelled' then
    v_allowed := true;
    v_needs_owner := true;
  elsif v_order.status = 'cancelled' and p_status = 'refunded' then
    v_allowed := true;
    v_needs_owner := true;
  elsif v_order.status = 'in_production' and p_status = 'delivered' then
    v_allowed := true;
  elsif v_order.status = 'delivered' and p_status = 'picked_up' then
    v_allowed := true;
  elsif v_order.status = 'in_production' and p_status = 'cancelled' then
    v_allowed := true;
    v_needs_owner := true;
  end if;

  if not v_allowed then
    raise exception 'INVALID_TRANSITION';
  end if;

  if v_needs_owner and not public.is_owner() then
    raise exception 'FORBIDDEN';
  end if;

  update public.orders
  set
    status = p_status,
    paid_at = case
      when p_status = 'paid' then coalesce(paid_at, now())
      else paid_at
    end,
    delivered_at = case
      when p_status = 'delivered' then coalesce(delivered_at, now())
      else delivered_at
    end,
    picked_up_at = case
      when p_status = 'picked_up' then coalesce(picked_up_at, now())
      else picked_up_at
    end,
    cancelled_at = case
      when p_status = 'cancelled' then coalesce(cancelled_at, now())
      else cancelled_at
    end
  where id = p_order_id;

  if p_status = 'cancelled' then
    perform public.release_order_stock(p_order_id);
  end if;

  if p_status in ('cancelled', 'refunded') then
    perform public.restore_loyalty_for_order(p_order_id);
  end if;

  insert into public.order_events (order_id, from_status, to_status, actor, note)
  values (p_order_id, v_order.status, p_status, auth.uid(), p_note);
end;
$$;

grant execute on function public.set_order_status(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- expire_order / expire_pending_orders restore used voucher
-- ---------------------------------------------------------------------------

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
  perform public.restore_loyalty_for_order(p_order_id);

  insert into public.order_events (order_id, from_status, to_status, actor, note)
  values (p_order_id, 'pending_payment', 'expired', null, null);
end;
$$;

revoke all on function public.expire_order(uuid) from public;
revoke all on function public.expire_order(uuid) from anon, authenticated;
grant execute on function public.expire_order(uuid) to service_role;

create or replace function public.expire_pending_orders()
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
    perform public.restore_loyalty_for_order(v_order.id);

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
