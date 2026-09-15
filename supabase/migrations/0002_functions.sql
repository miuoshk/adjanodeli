-- AdjanoDeli business functions (SPEC §4–6). No client-side cutoff or stock checks.

-- ---------------------------------------------------------------------------
-- warsaw_now
-- ---------------------------------------------------------------------------

create or replace function public.warsaw_now()
returns timestamptz
language sql
stable
set search_path = public
as $$
  select (now() at time zone 'Europe/Warsaw') at time zone 'Europe/Warsaw';
$$;

-- ---------------------------------------------------------------------------
-- available_pickup_dates
-- ---------------------------------------------------------------------------

create or replace function public.available_pickup_dates()
returns setof date
language plpgsql
stable
set search_path = public
as $$
declare
  v_settings public.settings%rowtype;
  v_local timestamp;
  v_today date;
  v_start date;
  v_d date;
  i int;
begin
  select * into strict v_settings from public.settings where id = 1;
  v_local := public.warsaw_now() at time zone 'Europe/Warsaw';
  v_today := v_local::date;

  if v_local::time < v_settings.cutoff_time then
    v_start := v_today + 1;
  else
    v_start := v_today + 2;
  end if;

  for i in 0 .. (v_settings.max_days_ahead - 1) loop
    v_d := v_start + i;
    if extract(isodow from v_d)::int = any (v_settings.order_weekdays)
       and not (v_d = any (v_settings.closed_dates))
       and exists (
         select 1
         from public.pickup_points pp
         where pp.is_active
           and extract(isodow from v_d)::int = any (pp.weekdays)
       )
    then
      return next v_d;
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- product_availability
-- ---------------------------------------------------------------------------

create or replace function public.product_availability(p_day date)
returns table (
  product_id uuid,
  cap int,
  reserved int,
  remaining int,
  is_available boolean
)
language sql
stable
set search_path = public
as $$
  select
    p.id as product_id,
    coalesce(o.cap, p.daily_cap_default) as cap,
    coalesce(s.reserved_qty, 0) as reserved,
    greatest(coalesce(o.cap, p.daily_cap_default) - coalesce(s.reserved_qty, 0), 0) as remaining,
    coalesce(o.is_available, true) as is_available
  from public.products p
  left join public.product_day_overrides o
    on o.product_id = p.id
   and o.day = p_day
  left join public.daily_stock s
    on s.product_id = p.id
   and s.day = p_day
  where p.is_active;
$$;

-- ---------------------------------------------------------------------------
-- create_order
-- ---------------------------------------------------------------------------

create or replace function public.create_order(
  p_pickup_point_id uuid,
  p_pickup_date date,
  p_items jsonb,
  p_note text
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
  v_order_id uuid;
  v_code text;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_try int;
  v_i int;
  v_dow int;
  v_item_count int;
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
  end loop;

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
    expires_at
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
    0,
    v_subtotal,
    now() + (v_settings.pending_order_ttl_minutes || ' minutes')::interval
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

  insert into public.order_events (order_id, from_status, to_status, actor, note)
  values (v_order_id, null, 'pending_payment', v_uid, null);

  return v_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- release_order_stock
-- ---------------------------------------------------------------------------

create or replace function public.release_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date;
  v_item record;
begin
  select pickup_date into v_day from public.orders where id = p_order_id;
  if not found then
    return;
  end if;

  for v_item in
    select product_id, qty
    from public.order_items
    where order_id = p_order_id
      and product_id is not null
  loop
    update public.daily_stock
    set reserved_qty = greatest(reserved_qty - v_item.qty, 0)
    where product_id = v_item.product_id
      and day = v_day;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- expire_pending_orders
-- ---------------------------------------------------------------------------

create or replace function public.expire_pending_orders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
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
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- set_order_status
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

  insert into public.order_events (order_id, from_status, to_status, actor, note)
  values (p_order_id, v_order.status, p_status, auth.uid(), p_note);
end;
$$;

-- ---------------------------------------------------------------------------
-- production_summary
-- ---------------------------------------------------------------------------

create or replace function public.production_summary(p_day date)
returns table (
  product_id uuid,
  product_name text,
  total_qty int,
  by_point jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;

  return query
  with lines as (
    select
      oi.product_id,
      max(oi.product_name) as product_name,
      pp.name as point_name,
      sum(oi.qty)::int as qty
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    join public.pickup_points pp on pp.id = o.pickup_point_id
    where o.pickup_date = p_day
      and o.status in ('paid', 'in_production', 'delivered', 'picked_up')
    group by oi.product_id, pp.name
  )
  select
    l.product_id,
    max(l.product_name),
    sum(l.qty)::int,
    jsonb_object_agg(l.point_name, l.qty)
  from lines l
  group by l.product_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- mark_order_paid (service_role / Stripe webhook)
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
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant execute on function public.warsaw_now() to anon, authenticated;
grant execute on function public.available_pickup_dates() to anon, authenticated;
grant execute on function public.product_availability(date) to anon, authenticated;
grant execute on function public.create_order(uuid, date, jsonb, text) to authenticated;
grant execute on function public.set_order_status(uuid, text, text) to authenticated;
grant execute on function public.production_summary(date) to authenticated;

revoke all on function public.mark_order_paid(uuid, text) from public;
revoke all on function public.mark_order_paid(uuid, text) from anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text) to service_role;

revoke all on function public.expire_pending_orders() from public;
revoke all on function public.expire_pending_orders() from anon, authenticated;
grant execute on function public.expire_pending_orders() to service_role;

revoke all on function public.release_order_stock(uuid) from public;
revoke all on function public.release_order_stock(uuid) from anon, authenticated;
grant execute on function public.release_order_stock(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- pg_cron: expire pending orders every 5 minutes
-- ---------------------------------------------------------------------------

create extension if not exists pg_cron;

select cron.schedule(
  'expire-pending-orders',
  '*/5 * * * *',
  'select public.expire_pending_orders()'
);
