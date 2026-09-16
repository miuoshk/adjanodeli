-- Product promo prices + discount codes (SPEC §3 / §4 / §6).

alter table public.products
  add column if not exists promo_price_grosze int,
  add column if not exists promo_from date,
  add column if not exists promo_to date;

alter table public.products
  drop constraint if exists products_promo_price_check;

alter table public.products
  add constraint products_promo_price_check
  check (
    promo_price_grosze is null
    or (promo_price_grosze >= 0 and promo_price_grosze < price_grosze)
  );

alter table public.products
  drop constraint if exists products_promo_dates_check;

alter table public.products
  add constraint products_promo_dates_check
  check (promo_from is null or promo_to is null or promo_from <= promo_to);

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  code text not null unique,
  type text not null check (type in ('percent', 'amount')),
  value int not null,
  min_order_grosze int not null default 0 check (min_order_grosze >= 0),
  max_discount_grosze int check (max_discount_grosze is null or max_discount_grosze >= 1),
  valid_from date,
  valid_to date,
  max_uses int check (max_uses is null or max_uses >= 1),
  uses_count int not null default 0 check (uses_count >= 0),
  per_user_once boolean not null default true,
  pickup_point_id uuid references public.pickup_points (id),
  is_active boolean not null default true,
  check (
    (type = 'percent' and value between 1 and 100)
    or (type = 'amount' and value >= 1)
  ),
  check (valid_from is null or valid_to is null or valid_from <= valid_to),
  check (code = upper(code) and position(' ' in code) = 0 and char_length(code) >= 1)
);

create trigger set_updated_at before update on public.discount_codes
  for each row execute function public.set_updated_at();

create table if not exists public.discount_code_uses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  code_id uuid not null references public.discount_codes (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  order_id uuid not null references public.orders (id) on delete cascade,
  unique (code_id, order_id)
);

create trigger set_updated_at before update on public.discount_code_uses
  for each row execute function public.set_updated_at();

create index if not exists discount_code_uses_user_id_idx
  on public.discount_code_uses (user_id);

create index if not exists discount_code_uses_order_id_idx
  on public.discount_code_uses (order_id);

alter table public.orders
  add column if not exists discount_code_id uuid references public.discount_codes (id);

alter table public.discount_codes enable row level security;
alter table public.discount_code_uses enable row level security;

revoke all on table public.discount_codes from public, anon, authenticated;
revoke all on table public.discount_code_uses from public, anon, authenticated;

grant select, insert, update, delete on table public.discount_codes to authenticated;
grant select on table public.discount_code_uses to authenticated;

create policy discount_codes_owner_all
  on public.discount_codes
  for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy discount_code_uses_owner_select
  on public.discount_code_uses
  for select
  to authenticated
  using (public.is_owner());

create or replace function public.discount_code_amount(
  p_type text,
  p_value int,
  p_max_discount_grosze int,
  p_subtotal int
)
returns int
language sql
immutable
set search_path = public
as $$
  select greatest(
    0,
    least(
      coalesce(p_max_discount_grosze, 2147483647),
      p_subtotal,
      case
        when p_type = 'percent' then (p_subtotal * p_value) / 100
        else p_value
      end
    )
  );
$$;

create or replace function public.validate_discount_code(
  p_code text,
  p_subtotal int,
  p_pickup_point_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_today date;
  v_row public.discount_codes%rowtype;
  v_code text;
  v_discount int;
  v_min_label text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return jsonb_build_object('valid', false, 'discount_grosze', 0, 'message', 'Zaloguj się, żeby użyć kodu.');
  end if;

  v_code := upper(replace(trim(coalesce(p_code, '')), ' ', ''));
  if v_code = '' then
    return jsonb_build_object('valid', false, 'discount_grosze', 0, 'message', 'Kod jest nieprawidłowy.');
  end if;

  v_today := (public.warsaw_now() at time zone 'Europe/Warsaw')::date;

  select * into v_row
  from public.discount_codes
  where code = v_code;

  if not found or not v_row.is_active then
    return jsonb_build_object('valid', false, 'discount_grosze', 0, 'message', 'Kod jest nieprawidłowy.');
  end if;

  if v_row.valid_from is not null and v_today < v_row.valid_from then
    return jsonb_build_object('valid', false, 'discount_grosze', 0, 'message', 'Kod jeszcze nie działa.');
  end if;

  if v_row.valid_to is not null and v_today > v_row.valid_to then
    return jsonb_build_object('valid', false, 'discount_grosze', 0, 'message', 'Kod wygasł');
  end if;

  if v_row.pickup_point_id is not null then
    if p_pickup_point_id is null then
      return jsonb_build_object(
        'valid', false,
        'discount_grosze', 0,
        'message', 'Wybierz punkt odbioru — ten kod jest na konkretny punkt.'
      );
    end if;
    if p_pickup_point_id is distinct from v_row.pickup_point_id then
      return jsonb_build_object(
        'valid', false,
        'discount_grosze', 0,
        'message', 'Ten kod jest na inny punkt odbioru.'
      );
    end if;
  end if;

  if v_row.max_uses is not null and v_row.uses_count >= v_row.max_uses then
    return jsonb_build_object('valid', false, 'discount_grosze', 0, 'message', 'Kod został już wykorzystany.');
  end if;

  if v_row.per_user_once and exists (
    select 1
    from public.discount_code_uses u
    where u.code_id = v_row.id
      and u.user_id = v_uid
  ) then
    return jsonb_build_object('valid', false, 'discount_grosze', 0, 'message', 'Ten kod już wykorzystałeś');
  end if;

  if coalesce(p_subtotal, 0) < v_row.min_order_grosze then
    if v_row.min_order_grosze % 100 = 0 then
      v_min_label := (v_row.min_order_grosze / 100)::text || ' zł';
    else
      v_min_label := replace((v_row.min_order_grosze::numeric / 100)::numeric(12, 2)::text, '.', ',') || ' zł';
    end if;
    return jsonb_build_object(
      'valid', false,
      'discount_grosze', 0,
      'message', 'Minimalna wartość zamówienia dla tego kodu to ' || v_min_label
    );
  end if;

  v_discount := public.discount_code_amount(
    v_row.type,
    v_row.value,
    v_row.max_discount_grosze,
    coalesce(p_subtotal, 0)
  );

  if v_discount > 0 and coalesce(p_subtotal, 0) - v_discount < 200 then
    return jsonb_build_object(
      'valid', false,
      'discount_grosze', 0,
      'message', 'Po rabacie zamówienie musi mieć min. 2,00 zł. Dodaj jeszcze produkt.'
    );
  end if;

  return jsonb_build_object('valid', true, 'discount_grosze', v_discount, 'message', '');
end;
$$;

revoke all on function public.validate_discount_code(text, int, uuid) from public, anon;
grant execute on function public.validate_discount_code(text, int, uuid) to authenticated;

create or replace function public.restore_discount_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_use public.discount_code_uses%rowtype;
begin
  for v_use in
    select *
    from public.discount_code_uses
    where order_id = p_order_id
    for update
  loop
    delete from public.discount_code_uses where id = v_use.id;
    update public.discount_codes
    set uses_count = greatest(uses_count - 1, 0)
    where id = v_use.code_id;
  end loop;

  update public.orders
  set discount_code_id = null
  where id = p_order_id
    and discount_code_id is not null;
end;
$$;

revoke all on function public.restore_discount_for_order(uuid) from public, anon, authenticated;
grant execute on function public.restore_discount_for_order(uuid) to service_role;

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

  perform public.restore_discount_for_order(p_order_id);
end;
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
  earliest_date date,
  effective_price_grosze int,
  is_promo boolean
)
language sql
stable
set search_path = public
as $$
  with today as (
    select (public.warsaw_now() at time zone 'Europe/Warsaw')::date as d
  ),
  active as (
    select
      p.id,
      p.daily_cap_default,
      p.weekdays,
      p.price_grosze,
      p.promo_price_grosze,
      p.promo_from,
      p.promo_to,
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
    e.earliest_date,
    case
      when a.promo_price_grosze is not null
        and (a.promo_from is null or a.promo_from <= t.d)
        and (a.promo_to is null or a.promo_to >= t.d)
      then a.promo_price_grosze
      else a.price_grosze
    end as effective_price_grosze,
    (
      a.promo_price_grosze is not null
      and (a.promo_from is null or a.promo_from <= t.d)
      and (a.promo_to is null or a.promo_to >= t.d)
    ) as is_promo
  from active a
  cross join today t
  join earliest e on e.lead_days = a.lead_days
  left join public.product_day_overrides o
    on o.product_id = a.id
   and o.day = p_day
  left join public.daily_stock s
    on s.product_id = a.id
   and s.day = p_day;
$$;

grant execute on function public.product_availability(date) to anon, authenticated;

drop function if exists public.create_order(uuid, date, jsonb, text, uuid, jsonb);

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
      v_unit,
      v_qty
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
grant execute on function public.discount_code_amount(text, int, int, int) to authenticated;
