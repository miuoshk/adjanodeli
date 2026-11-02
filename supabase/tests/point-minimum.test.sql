-- pgTAP: one receipt per pickup point.
-- Shop floor stays 10 zł. A higher point minimum rejects a smaller order,
-- including after a percent code. The whole script rolls back.

begin;
select plan(6);

create temp table min_ctx (
  product_id uuid,
  point_id uuid,
  day date
);

insert into min_ctx (product_id, point_id, day)
select p.id, pt.id, null
from public.products p
cross join public.pickup_points pt
where pt.is_active
  and not exists (
    select 1
    from public.product_option_groups g
    where g.product_id = p.id
      and g.is_required
  )
order by pt.sort_order, p.created_at
limit 1;

update public.products
set
  price_grosze = 1000,
  promo_price_grosze = null,
  promo_from = null,
  promo_to = null,
  daily_cap_default = 2000,
  weekdays = '{1,2,3,4,5,6,7}',
  lead_days = 1,
  is_active = true
where id = (select product_id from min_ctx);

delete from public.daily_stock
where product_id = (select product_id from min_ctx);

update public.pickup_points
set min_order_grosze = 1000
where id = (select point_id from min_ctx);

update public.settings
set
  volume_discount_enabled = false,
  max_qty_per_item = 15,
  require_point_code = true
where id = 1;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'eeeeeeee-bbbb-cccc-dddd-eeeeeeeeeeee',
  'authenticated',
  'authenticated',
  'point-minimum-test@example.com',
  crypt('test', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
)
on conflict (id) do nothing;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select 'eeeeeeee-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid;
$$;

select set_config('request.jwt.claim.sub', 'eeeeeeee-bbbb-cccc-dddd-eeeeeeeeeeee', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"eeeeeeee-bbbb-cccc-dddd-eeeeeeeeeeee","role":"authenticated"}',
  true
);

insert into public.pickup_point_access (user_id, pickup_point_id, granted_via)
select 'eeeeeeee-bbbb-cccc-dddd-eeeeeeeeeeee', point_id, 'admin'
from min_ctx
on conflict (user_id, pickup_point_id) do nothing;

update min_ctx
set day = (select min(d) from public.available_pickup_dates() d);

create or replace function pg_temp.try_min_order(p_qty int, p_discount jsonb default null)
returns text
language plpgsql
as $$
declare
  v_id uuid;
  v_total int;
begin
  v_id := public.create_order(
    (select point_id from min_ctx),
    (select day from min_ctx),
    jsonb_build_array(jsonb_build_object(
      'product_id', (select product_id from min_ctx),
      'qty', p_qty
    )),
    null,
    p_discount,
    null
  );
  select total_grosze into v_total from public.orders where id = v_id;
  return 'ok:' || v_total::text;
exception
  when others then
    return sqlerrm;
end;
$$;

update public.products
set price_grosze = 500
where id = (select product_id from min_ctx);

select is(
  pg_temp.try_min_order(1),
  'TOTAL_BELOW_MINIMUM:1000',
  '5 zł stays under the shop floor'
);
select is(
  pg_temp.try_min_order(2),
  'ok:1000',
  '10 zł meets the shop floor'
);

update public.products
set price_grosze = 1000
where id = (select product_id from min_ctx);

update public.pickup_points
set min_order_grosze = 5000
where id = (select point_id from min_ctx);

select is(
  pg_temp.try_min_order(4),
  'TOTAL_BELOW_MINIMUM:5000',
  '40 zł is below a 50 zł point minimum'
);
select is(
  pg_temp.try_min_order(5),
  'ok:5000',
  '50 zł is one receipt at the point minimum'
);

insert into public.discount_codes (code, type, value, per_user_once, is_active)
values ('POINTMIN50', 'percent', 50, false, true);

select is(
  pg_temp.try_min_order(8, '{"code":"POINTMIN50"}'::jsonb),
  'TOTAL_BELOW_MINIMUM:5000',
  'a 50% code cannot drop one receipt under the point minimum'
);
select is(
  pg_temp.try_min_order(10, '{"code":"POINTMIN50"}'::jsonb),
  'ok:5000',
  'after 50% the receipt still meets 50 zł'
);

select * from finish();
rollback;
