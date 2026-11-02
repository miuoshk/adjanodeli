-- Customer contact, ban, and order-count stamps.
-- One paid order = one stamp. Ten stamps issue one PCT30 voucher
-- (−30%, cap 40,00 zł) and those ten stamps are consumed.
-- Already issued PCT10, PCT50 and ONE_GROSZ stay valid.
-- Extra unconsumed stamps earned per piece are folded to one per order,
-- and a customer keeps at most nine, so a piled-up card does not
-- mint a voucher on the next click.

alter table public.profiles
  add column if not exists is_banned boolean not null default false;

alter table public.loyalty_vouchers
  drop constraint if exists loyalty_vouchers_type_check;

alter table public.loyalty_vouchers
  add constraint loyalty_vouchers_type_check
  check (type in ('PCT10', 'PCT30', 'PCT50', 'ONE_GROSZ'));

alter table public.loyalty_vouchers
  add column if not exists source_order_id uuid references public.orders (id);

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role')
     or auth.role() = 'service_role'
     or public.is_owner() then
    return new;
  end if;

  new.role := old.role;
  new.staff_permissions := old.staff_permissions;
  new.is_active := old.is_active;
  new.must_change_password := old.must_change_password;
  new.is_banned := old.is_banned;
  return new;
end;
$$;

-- One stamp per order, then at most nine active stamps per customer.
delete from public.loyalty_stamps
where consumed_at is null
  and id not in (
    select id
    from (
      select
        id,
        row_number() over (
          partition by user_id
          order by earned_at desc, id desc
        ) as rn
      from (
        select distinct on (user_id, order_id)
          id,
          user_id,
          earned_at
        from public.loyalty_stamps
        where consumed_at is null
        order by user_id, order_id, earned_at asc, id asc
      ) one_per_order
    ) ranked
    where rn <= 9
  );

create or replace function public.loyalty_status(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_n int;
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
    'next_threshold', 10,
    'vouchers', v_vouchers
  );
end;
$$;

-- One paid order inserts one stamp, whatever the piece count or the total.
-- At 10 active stamps: one PCT30, then those 10 stamps are consumed.
create or replace function public.grant_stamps_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
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

  if not exists (
    select 1 from public.order_items where order_id = p_order_id
  ) then
    return;
  end if;

  select coalesce(
    (
      select s.cycle_started_at
      from public.loyalty_stamps s
      where s.user_id = v_order.user_id
        and s.consumed_at is null
        and s.expires_at > now()
      order by s.earned_at
      limit 1
    ),
    now()
  )
  into v_cycle;

  insert into public.loyalty_stamps (
    user_id,
    order_id,
    earned_at,
    expires_at,
    cycle_started_at
  )
  values (
    v_order.user_id,
    p_order_id,
    now(),
    now() + interval '60 days',
    v_cycle
  );

  select count(*)::int
  into v_n
  from public.loyalty_stamps
  where user_id = v_order.user_id
    and consumed_at is null
    and expires_at > now();

  if v_n >= 10 then
    insert into public.loyalty_vouchers (
      user_id,
      type,
      issued_at,
      expires_at,
      source_order_id
    )
    values (
      v_order.user_id,
      'PCT30',
      now(),
      now() + interval '30 days',
      p_order_id
    );

    update public.loyalty_stamps
    set consumed_at = now()
    where id in (
      select id
      from public.loyalty_stamps
      where user_id = v_order.user_id
        and consumed_at is null
        and expires_at > now()
      order by earned_at, id
      limit 10
    );
  end if;
end;
$$;

create or replace function public.restore_loyalty_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_voucher public.loyalty_vouchers%rowtype;
begin
  delete from public.loyalty_stamps
  where order_id = p_order_id;

  update public.loyalty_vouchers
  set
    used_order_id = null,
    restored_from_order_id = p_order_id
  where used_order_id = p_order_id
    and expires_at > now();

  select *
  into v_voucher
  from public.loyalty_vouchers
  where source_order_id = p_order_id
    and used_order_id is null
  limit 1;

  if found then
    update public.loyalty_stamps
    set consumed_at = null
    where user_id = v_voucher.user_id
      and consumed_at is not null
      and consumed_at >= v_voucher.issued_at - interval '1 minute'
      and consumed_at <= v_voucher.issued_at + interval '1 minute';

    delete from public.loyalty_vouchers
    where id = v_voucher.id;
  end if;
end;
$$;

create or replace function public.customer_order_stats()
returns table (
  user_id uuid,
  full_name text,
  phone text,
  email text,
  is_banned boolean,
  order_count bigint,
  spent_grosze bigint,
  last_order_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then
    raise exception 'FORBIDDEN';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.phone,
    p.email,
    p.is_banned,
    count(o.id) filter (
      where o.status in ('paid', 'in_production', 'delivered', 'picked_up')
    ),
    coalesce(sum(o.total_grosze) filter (
      where o.status in ('paid', 'in_production', 'delivered', 'picked_up')
    ), 0)::bigint,
    max(o.created_at) filter (
      where o.status in ('paid', 'in_production', 'delivered', 'picked_up')
    )
  from public.profiles p
  left join public.orders o on o.user_id = p.id
  where p.role = 'customer'
  group by p.id, p.full_name, p.phone, p.email, p.is_banned;
end;
$$;

revoke all on function public.customer_order_stats() from public;
grant execute on function public.customer_order_stats() to authenticated;

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
  v_qty_sum int := 0;
  v_volume_pct int;
  v_volume_discount int := 0;
  v_discount_source text;
  v_discount_pct int;
  v_min int;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into v_profile from public.profiles where id = v_uid;
  if not found then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if v_profile.is_banned then
    raise exception 'CUSTOMER_BANNED';
  end if;

  if v_profile.role = 'customer'
     and (
       coalesce(v_profile.full_name, '') !~ '^[^[:space:]]{2,}[[:space:]]+[^[:space:]]{2,}'
       or length(regexp_replace(coalesce(v_profile.phone, ''), '[^0-9]', '', 'g')) not in (9, 11)
     )
  then
    raise exception 'PROFILE_INCOMPLETE';
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
    v_invoice_nip := regexp_replace(coalesce(p_invoice ->> 'nip', ''), '[^0-9]', '', 'g');
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
    v_qty_sum := v_qty_sum + v_qty;
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
    elsif v_voucher.type = 'PCT30' then
      v_discount := least((v_subtotal * 30) / 100, 4000);
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

  v_discount_source := case
    when v_discount > 0 and v_code_text is not null then 'code'
    when v_discount > 0 and v_voucher_id is not null then 'voucher'
    else null
  end;
  v_discount_pct := null;
  if v_discount_source = 'voucher' then
    if v_voucher.type = 'PCT10' then
      v_discount_pct := 10;
    elsif v_voucher.type = 'PCT30' then
      v_discount_pct := 30;
    elsif v_voucher.type = 'PCT50' then
      v_discount_pct := 50;
    end if;
  elsif v_discount_source = 'code' and v_discount_row.type = 'percent' then
    v_discount_pct := v_discount_row.value;
  end if;

  if v_settings.volume_discount_enabled then
    select (tier ->> 'pct')::int
    into v_volume_pct
    from jsonb_array_elements(v_settings.volume_discount_tiers) as tier
    where (tier ->> 'min_qty')::int <= v_qty_sum
    order by (tier ->> 'min_qty')::int desc
    limit 1;

    if v_volume_pct is not null then
      v_volume_discount := (v_subtotal * v_volume_pct) / 100;
    end if;
  end if;

  if v_volume_discount > v_discount then
    v_discount := v_volume_discount;
    v_discount_source := 'volume';
    v_discount_pct := v_volume_pct;
    v_code_text := null;
    v_voucher_id := null;
  end if;

  v_total := v_subtotal - v_discount;
  v_min := greatest(1000, coalesce(v_point.min_order_grosze, 1000));
  if v_total < v_min then
    raise exception 'TOTAL_BELOW_MINIMUM:%', v_min;
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
    discount_code_id,
    discount_source,
    discount_pct
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
    case when v_discount_source = 'code' then v_discount_row.id else null end,
    v_discount_source,
    v_discount_pct
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
