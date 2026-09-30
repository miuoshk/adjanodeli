-- Product option groups (sauce and similar). Snapshot lives on order_items.

alter table public.order_items
  add column options jsonb not null default '[]'::jsonb;

create table public.product_option_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  is_required boolean not null default true,
  max_choices int not null default 1 check (max_choices >= 1),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.product_option_groups (id) on delete cascade,
  name text not null,
  price_delta_grosze int not null default 0 check (price_delta_grosze >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_option_groups_product_idx on public.product_option_groups (product_id, sort_order);
create index product_options_group_idx on public.product_options (group_id, sort_order);

create trigger set_updated_at before update on public.product_option_groups
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.product_options
  for each row execute function public.set_updated_at();

alter table public.product_option_groups enable row level security;
alter table public.product_options enable row level security;

create policy product_option_groups_select
  on public.product_option_groups
  for select
  to anon, authenticated
  using (true);

create policy product_option_groups_insert_owner
  on public.product_option_groups
  for insert
  to authenticated
  with check (public.is_owner());

create policy product_option_groups_update_owner
  on public.product_option_groups
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy product_option_groups_delete_owner
  on public.product_option_groups
  for delete
  to authenticated
  using (public.is_owner());

create policy product_options_select
  on public.product_options
  for select
  to anon, authenticated
  using (is_active or public.is_owner());

create policy product_options_insert_owner
  on public.product_options
  for insert
  to authenticated
  with check (public.is_owner());

create policy product_options_update_owner
  on public.product_options
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy product_options_delete_owner
  on public.product_options
  for delete
  to authenticated
  using (public.is_owner());

grant select on public.product_option_groups to anon, authenticated;
grant select on public.product_options to anon, authenticated;
grant insert, update, delete on public.product_option_groups to authenticated;
grant insert, update, delete on public.product_options to authenticated;

create or replace function public.resolve_order_item_options(
  p_product_id uuid,
  p_option_ids jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ids uuid[] := '{}';
  v_matched int;
  v_missing text;
  v_over boolean;
  v_delta int;
  v_snapshot jsonb;
begin
  if p_option_ids is null then
    p_option_ids := '[]'::jsonb;
  end if;
  if jsonb_typeof(p_option_ids) <> 'array' then
    raise exception 'OPTIONS_INVALID:%', p_product_id;
  end if;

  begin
    select coalesce(array_agg(elem::uuid), '{}')
    into v_ids
    from jsonb_array_elements_text(p_option_ids) as elem;
  exception
    when others then
      raise exception 'OPTIONS_INVALID:%', p_product_id;
  end;

  if v_ids is null then
    v_ids := '{}';
  end if;

  if (select count(*) from unnest(v_ids) as picked) <>
     (select count(distinct picked) from unnest(v_ids) as picked)
  then
    raise exception 'OPTIONS_INVALID:%', p_product_id;
  end if;

  select count(*)::int
  into v_matched
  from public.product_options o
  join public.product_option_groups g on g.id = o.group_id
  where o.id = any (v_ids)
    and g.product_id = p_product_id
    and o.is_active;

  if v_matched <> coalesce(array_length(v_ids, 1), 0) then
    raise exception 'OPTIONS_INVALID:%', p_product_id;
  end if;

  select exists (
    select 1
    from public.product_options o
    join public.product_option_groups g on g.id = o.group_id
    where o.id = any (v_ids)
      and g.product_id = p_product_id
    group by g.id, g.max_choices
    having count(*) > g.max_choices
  )
  into v_over;

  if v_over then
    raise exception 'OPTIONS_INVALID:%', p_product_id;
  end if;

  select g.name
  into v_missing
  from public.product_option_groups g
  where g.product_id = p_product_id
    and g.is_required
    and not exists (
      select 1
      from public.product_options o
      where o.group_id = g.id
        and o.id = any (v_ids)
        and o.is_active
    )
  order by g.sort_order, g.name
  limit 1;

  if v_missing is not null then
    raise exception 'OPTIONS_REQUIRED:%:%', p_product_id, v_missing;
  end if;

  select coalesce(sum(o.price_delta_grosze), 0)
  into v_delta
  from public.product_options o
  where o.id = any (v_ids);

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'group_id', g.id,
        'group_name', g.name,
        'option_id', o.id,
        'option_name', o.name,
        'price_delta_grosze', o.price_delta_grosze
      )
      order by g.sort_order, o.sort_order, o.name
    ),
    '[]'::jsonb
  )
  into v_snapshot
  from public.product_options o
  join public.product_option_groups g on g.id = o.group_id
  where o.id = any (v_ids);

  return jsonb_build_object('price_delta_grosze', v_delta, 'options', v_snapshot);
end;
$$;

revoke all on function public.resolve_order_item_options(uuid, jsonb) from public;
grant execute on function public.resolve_order_item_options(uuid, jsonb) to authenticated;

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

  if v_point.visibility = 'restricted'
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


drop function if exists public.production_summary(date);

create function public.production_summary(p_day date)
returns table (
  product_id uuid,
  product_name text,
  total_qty int,
  by_point jsonb,
  by_option jsonb
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
  ),
  option_lines as (
    select
      oi.product_id,
      (
        select string_agg(opt ->> 'option_name', ', ' order by opt ->> 'group_name', opt ->> 'option_name')
        from jsonb_array_elements(coalesce(oi.options, '[]'::jsonb)) as opt
      ) as label,
      sum(oi.qty)::int as qty
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.pickup_date = p_day
      and o.status in ('paid', 'in_production', 'delivered', 'picked_up')
      and jsonb_array_length(coalesce(oi.options, '[]'::jsonb)) > 0
    group by oi.product_id, 2
  ),
  option_agg as (
    select
      option_lines.product_id,
      jsonb_agg(
        jsonb_build_object('label', option_lines.label, 'qty', option_lines.qty)
        order by option_lines.qty desc, option_lines.label
      ) as by_option
    from option_lines
    where option_lines.label is not null
      and option_lines.label <> ''
    group by option_lines.product_id
  )
  select
    l.product_id,
    max(l.product_name),
    sum(l.qty)::int,
    jsonb_object_agg(l.point_name, l.qty),
    coalesce(max(oa.by_option), '[]'::jsonb)
  from lines l
  left join option_agg oa on oa.product_id = l.product_id
  group by l.product_id;
end;
$$;

grant execute on function public.production_summary(date) to authenticated;
