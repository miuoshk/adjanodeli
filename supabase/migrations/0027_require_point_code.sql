-- Kod punktu jest wymagany przed zamówieniem, gdy settings.require_point_code.
-- Stali klienci (opłacone zamówienie) dostają dostęp, żeby nie wpisywać kodu drugi raz.

alter table public.settings
  add column if not exists require_point_code boolean not null default true;

insert into public.pickup_point_access (user_id, pickup_point_id, granted_via)
select distinct o.user_id, o.pickup_point_id, 'admin'
from public.orders o
where o.paid_at is not null
  and o.user_id is not null
  and o.pickup_point_id is not null
on conflict (user_id, pickup_point_id) do nothing;

create or replace function public.sync_domain_access(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_domain text;
begin
  if p_user_id is null then
    return;
  end if;

  select email into v_email from public.profiles where id = p_user_id;
  if v_email is null then
    return;
  end if;

  v_domain := lower(split_part(v_email, '@', 2));
  if v_domain is null or v_domain = '' then
    return;
  end if;

  insert into public.pickup_point_access (user_id, pickup_point_id, granted_via)
  select p_user_id, pp.id, 'domain'
  from public.pickup_points pp
  where pp.is_active
    and v_domain = any (pp.allowed_email_domains)
  on conflict (user_id, pickup_point_id) do nothing;
end;
$$;

create or replace function public.unlock_pickup_point(p_code text)
returns public.pickup_points
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_code text;
  v_fails int;
  v_point public.pickup_points%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select count(*)::int into v_fails
  from public.pickup_point_unlock_attempts
  where user_id = v_uid
    and created_at > now() - interval '15 minutes';

  if v_fails >= 5 then
    raise exception 'UNLOCK_RATE_LIMIT';
  end if;

  v_code := upper(replace(trim(coalesce(p_code, '')), ' ', ''));

  if v_code !~ '^[A-Z0-9]{6,12}$' then
    insert into public.pickup_point_unlock_attempts (user_id) values (v_uid);
    raise exception 'UNLOCK_INVALID';
  end if;

  select * into v_point
  from public.pickup_points
  where is_active
    and access_code = v_code;

  if not found then
    insert into public.pickup_point_unlock_attempts (user_id) values (v_uid);
    raise exception 'UNLOCK_INVALID';
  end if;

  insert into public.pickup_point_access (user_id, pickup_point_id, granted_via)
  values (v_uid, v_point.id, 'code')
  on conflict (user_id, pickup_point_id) do nothing;

  return v_point;
end;
$$;

create or replace function public.create_order(
  p_pickup_point_id uuid,
  p_pickup_date date,
  p_items jsonb,
  p_note text,
  p_discount jsonb default null,
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
  v_today date;
  v_unit int;
  v_voucher_id uuid;
  v_code_text text;
  v_discount_row public.discount_codes%rowtype;
  v_check jsonb;
  v_resolved jsonb;
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
  v_today := (public.warsaw_now() at time zone 'Europe/Warsaw')::date;

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

  if v_settings.require_point_code then
    if not public.is_owner()
       and not exists (
         select 1
         from public.pickup_point_access a
         where a.pickup_point_id = v_point.id
           and a.user_id = v_uid
       )
    then
      raise exception 'POINT_FORBIDDEN';
    end if;
  elsif v_point.visibility = 'restricted'
     and not public.is_staff()
     and not exists (
       select 1
       from public.pickup_point_access a
       where a.pickup_point_id = v_point.id
         and a.user_id = v_uid
     )
  then
    raise exception 'POINT_FORBIDDEN';
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

  v_voucher_id := null;
  v_code_text := null;
  if p_discount is not null and jsonb_typeof(p_discount) = 'object' then
    v_code_text := nullif(upper(replace(trim(coalesce(p_discount ->> 'code', '')), ' ', '')), '');
    begin
      if nullif(p_discount ->> 'voucher_id', '') is not null then
        v_voucher_id := (p_discount ->> 'voucher_id')::uuid;
      end if;
    exception
      when others then
        raise exception 'DISCOUNT_INVALID';
    end;
    if v_code_text is not null then
      v_voucher_id := null;
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

    perform public.resolve_order_item_options(v_product_id, v_item -> 'option_ids');
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

    if v_product.promo_price_grosze is not null
       and (v_product.promo_from is null or v_product.promo_from <= v_today)
       and (v_product.promo_to is null or v_product.promo_to >= v_today)
    then
      v_unit := v_product.promo_price_grosze;
    else
      v_unit := v_product.price_grosze;
    end if;

    v_resolved := public.resolve_order_item_options(v_product_id, v_item -> 'option_ids');
    v_unit := v_unit + coalesce((v_resolved ->> 'price_delta_grosze')::int, 0);

    v_subtotal := v_subtotal + (v_unit * v_qty);
    if v_cheapest is null or v_unit < v_cheapest then
      v_cheapest := v_unit;
    end if;
  end loop;

  if v_code_text is not null then
    v_check := public.validate_discount_code(v_code_text, v_subtotal, p_pickup_point_id);
    if coalesce((v_check ->> 'valid')::boolean, false) is not true then
      raise exception 'DISCOUNT_INVALID';
    end if;

    select * into v_discount_row
    from public.discount_codes
    where code = v_code_text
    for update;

    if not found then
      raise exception 'DISCOUNT_INVALID';
    end if;

    if v_discount_row.max_uses is not null and v_discount_row.uses_count >= v_discount_row.max_uses then
      raise exception 'DISCOUNT_INVALID';
    end if;

    v_discount := public.discount_code_amount(
      v_discount_row.type,
      v_discount_row.value,
      v_discount_row.max_discount_grosze,
      v_subtotal
    );
  elsif v_voucher_id is not null then
    select * into v_voucher
    from public.loyalty_vouchers
    where id = v_voucher_id
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
  if v_total < 1000 then
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
    invoice_address,
    discount_code_id
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
    v_invoice_address,
    v_discount_row.id
  )
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'qty')::int;

    select * into v_product from public.products where id = v_product_id;

    if v_product.promo_price_grosze is not null
       and (v_product.promo_from is null or v_product.promo_from <= v_today)
       and (v_product.promo_to is null or v_product.promo_to >= v_today)
    then
      v_unit := v_product.promo_price_grosze;
    else
      v_unit := v_product.price_grosze;
    end if;

    v_resolved := public.resolve_order_item_options(v_product_id, v_item -> 'option_ids');
    v_unit := v_unit + coalesce((v_resolved ->> 'price_delta_grosze')::int, 0);

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      unit_price_grosze,
      qty,
      options
    )
    values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_unit,
      v_qty,
      coalesce(v_resolved -> 'options', '[]'::jsonb)
    );
  end loop;

  if v_code_text is not null then
    insert into public.discount_code_uses (code_id, user_id, order_id)
    values (v_discount_row.id, v_uid, v_order_id);
    update public.discount_codes
    set uses_count = uses_count + 1
    where id = v_discount_row.id;
  elsif v_voucher_id is not null then
    update public.loyalty_vouchers
    set used_order_id = v_order_id
    where id = v_voucher_id;
  end if;

  insert into public.order_events (order_id, from_status, to_status, actor, note)
  values (v_order_id, null, 'pending_payment', v_uid, null);

  return v_order_id;
end;
$$;


grant execute on function public.create_order(uuid, date, jsonb, text, jsonb, jsonb) to authenticated;

create or replace function public.change_order_pickup_point(
  p_order_id uuid,
  p_point_id uuid,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_point public.pickup_points%rowtype;
  v_old_name text;
  v_dow int;
  v_note text;
begin
  if not public.has_staff_permission('orders', 'manage') then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.status not in ('paid', 'in_production') then
    raise exception 'STATUS_NOT_ALLOWED';
  end if;

  select * into v_point from public.pickup_points where id = p_point_id;
  v_dow := extract(isodow from v_order.pickup_date)::int;
  if not found
     or not v_point.is_active
     or not (v_dow = any (v_point.weekdays))
  then
    raise exception 'POINT_NOT_AVAILABLE';
  end if;

  if v_order.pickup_point_id = v_point.id then
    return;
  end if;

  select name into v_old_name
  from public.pickup_points
  where id = v_order.pickup_point_id;

  update public.orders
  set pickup_point_id = v_point.id,
      updated_at = now()
  where id = v_order.id;

  if v_order.user_id is not null then
    insert into public.pickup_point_access (user_id, pickup_point_id, granted_via)
    values (v_order.user_id, v_point.id, 'admin')
    on conflict (user_id, pickup_point_id) do nothing;
  end if;

  v_note := nullif(trim(coalesce(p_note, '')), '');
  insert into public.order_events (order_id, from_status, to_status, actor, note)
  values (
    v_order.id,
    v_order.status,
    v_order.status,
    auth.uid(),
    concat_ws(
      ' ',
      'Punkt odbioru:',
      coalesce(v_old_name, '—'),
      '→',
      v_point.name || '.',
      v_note
    )
  );
end;
$$;

revoke all on function public.change_order_pickup_point(uuid, uuid, text) from public;
grant execute on function public.change_order_pickup_point(uuid, uuid, text) to authenticated;

do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.email_log'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%kind%'
  loop
    execute format('alter table public.email_log drop constraint %I', r.conname);
  end loop;
end $$;

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
    'test'
  ));
