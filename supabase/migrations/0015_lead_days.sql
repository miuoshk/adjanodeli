-- Product lead_days + pickup-date shift (SPEC §3 / §4 / §6).

alter table public.products
  add column if not exists lead_days int;

alter table public.products
  drop constraint if exists products_lead_days_check;

alter table public.products
  add constraint products_lead_days_check check (lead_days is null or lead_days >= 1);

create or replace function public.available_pickup_dates(p_lead_days int)
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
  v_needed int;
  v_skipped int;
  i int;
  v_guard int;
begin
  select * into strict v_settings from public.settings where id = 1;
  v_local := public.warsaw_now() at time zone 'Europe/Warsaw';
  v_today := v_local::date;

  if v_local::time < v_settings.cutoff_time then
    v_start := v_today + 1;
  else
    v_start := v_today + 2;
  end if;

  v_needed := greatest(coalesce(p_lead_days, 1), 1) - 1;
  v_skipped := 0;
  v_guard := 0;
  while v_skipped < v_needed and v_guard < 60 loop
    if extract(isodow from v_start)::int = any (v_settings.order_weekdays)
       and not (v_start = any (v_settings.closed_dates))
    then
      v_skipped := v_skipped + 1;
    end if;
    v_start := v_start + 1;
    v_guard := v_guard + 1;
  end loop;

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

create or replace function public.available_pickup_dates()
returns setof date
language sql
stable
set search_path = public
as $$
  select public.available_pickup_dates(1);
$$;

drop function if exists public.product_availability(date);

create function public.product_availability(p_day date)
returns table (
  product_id uuid,
  cap int,
  reserved int,
  remaining int,
  is_available boolean,
  lead_days int,
  earliest_date date
)
language sql
stable
set search_path = public
as $$
  with active as (
    select
      p.id,
      p.daily_cap_default,
      p.weekdays,
      greatest(coalesce(p.lead_days, c.lead_days, 1), 1) as lead_days
    from public.products p
    left join public.categories c on c.id = p.category_id
    where p.is_active
  ),
  distinct_leads as (
    select distinct a.lead_days from active a
  ),
  earliest as (
    select
      d.lead_days,
      (select min(x) from public.available_pickup_dates(d.lead_days) x) as earliest_date
    from distinct_leads d
  )
  select
    a.id as product_id,
    coalesce(o.cap, a.daily_cap_default) as cap,
    coalesce(s.reserved_qty, 0) as reserved,
    greatest(coalesce(o.cap, a.daily_cap_default) - coalesce(s.reserved_qty, 0), 0) as remaining,
    (
      coalesce(o.is_available, true)
      and extract(isodow from p_day)::int = any (a.weekdays)
    ) as is_available,
    a.lead_days,
    e.earliest_date
  from active a
  join earliest e on e.lead_days = a.lead_days
  left join public.product_day_overrides o
    on o.product_id = a.id
   and o.day = p_day
  left join public.daily_stock s
    on s.product_id = a.id
   and s.day = p_day;
$$;

create or replace function public.create_order(
  p_pickup_point_id uuid,
  p_pickup_date date,
  p_items jsonb,
  p_note text,
  p_voucher_id uuid default null,
  p_invoice jsonb default null
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
  v_invoice_requested boolean := false;
  v_invoice_nip text;
  v_invoice_company text;
  v_invoice_address text;
  v_item_lead int;
  v_max_lead int := 1;
  v_lead_product uuid;
  v_earliest date;
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

  if p_invoice is not null and coalesce((p_invoice ->> 'requested')::boolean, false) then
    v_invoice_requested := true;
    v_invoice_nip := regexp_replace(coalesce(p_invoice ->> 'nip', ''), '\D', '', 'g');
    v_invoice_company := nullif(trim(coalesce(p_invoice ->> 'company', '')), '');
    v_invoice_address := nullif(trim(coalesce(p_invoice ->> 'address', '')), '');
    if not public.is_valid_nip(v_invoice_nip)
       or v_invoice_company is null
       or v_invoice_address is null
    then
      raise exception 'INVALID_INVOICE';
    end if;
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

    select greatest(coalesce(p.lead_days, c.lead_days, 1), 1)
    into v_item_lead
    from public.products p
    left join public.categories c on c.id = p.category_id
    where p.id = v_product_id;

    if v_item_lead is null then
      raise exception 'OUT_OF_STOCK:%:%', v_product_id, 0;
    end if;

    if v_item_lead > v_max_lead then
      v_max_lead := v_item_lead;
      v_lead_product := v_product_id;
    end if;
  end loop;

  if v_max_lead > 1 then
    select min(d) into v_earliest from public.available_pickup_dates(v_max_lead) d;
    if not exists (
      select 1
      from public.available_pickup_dates(v_max_lead) d
      where d = p_pickup_date
    ) then
      raise exception 'LEAD_TIME:%:%', v_lead_product, v_earliest;
    end if;
  end if;

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
    terms_accepted_at,
    invoice_requested,
    invoice_nip,
    invoice_company,
    invoice_address
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
    now(),
    v_invoice_requested,
    v_invoice_nip,
    v_invoice_company,
    v_invoice_address
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

grant execute on function public.available_pickup_dates() to anon, authenticated;
grant execute on function public.available_pickup_dates(int) to anon, authenticated;
grant execute on function public.product_availability(date) to anon, authenticated;
grant execute on function public.create_order(uuid, date, jsonb, text, uuid, jsonb) to authenticated;
