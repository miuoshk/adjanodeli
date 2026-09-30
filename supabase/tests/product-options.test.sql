-- pgTAP: product options in create_order (SPEC §4).
-- missing required option, option from another product, too many choices,
-- a correct order whose unit price includes the surcharge.

begin;
select plan(4);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'authenticated', 'authenticated', 'options-test@example.com',
  crypt('test', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
)
on conflict (id) do nothing;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid;
$$;

update public.products
set
  price_grosze = 1500,
  promo_price_grosze = null,
  promo_from = null,
  promo_to = null,
  is_active = true,
  lead_days = 1,
  daily_cap_default = 40,
  weekdays = '{1,2,3,4,5,6,7}'
where id = (select id from public.products where is_active order by sort_order limit 1);

update public.products
set is_active = true, daily_cap_default = 40, weekdays = '{1,2,3,4,5,6,7}'
where id = (
  select id from public.products
  where id <> (select id from public.products where is_active order by sort_order limit 1)
  order by sort_order
  limit 1
);

insert into public.product_option_groups (id, product_id, name, is_required, max_choices, sort_order)
select
  '11111111-1111-1111-1111-111111111111',
  id,
  'Sos',
  true,
  1,
  0
from public.products
where is_active
order by sort_order
limit 1;

insert into public.product_options (id, group_id, name, price_delta_grosze, is_active, sort_order)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'czosnkowy', 0, true, 0),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'pomidorowy', 200, true, 1);

insert into public.product_option_groups (id, product_id, name, is_required, max_choices, sort_order)
select
  '44444444-4444-4444-4444-444444444444',
  id,
  'Inny',
  false,
  1,
  0
from public.products
where id <> (select product_id from public.product_option_groups where id = '11111111-1111-1111-1111-111111111111')
order by sort_order
limit 1;

insert into public.product_options (id, group_id, name, price_delta_grosze, is_active, sort_order)
values (
  '55555555-5555-5555-5555-555555555555',
  '44444444-4444-4444-4444-444444444444',
  'obcy',
  0,
  true,
  0
);

delete from public.daily_stock
where product_id = (select product_id from public.product_option_groups where id = '11111111-1111-1111-1111-111111111111');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee","role":"authenticated"}',
  true
);

select throws_ok(
  format(
    'select public.create_order(%L::uuid, %L::date, %L::jsonb, null)',
    (select id from public.pickup_points where slug = 'piekarnia'),
    (select min(d) from public.available_pickup_dates()),
    jsonb_build_array(jsonb_build_object(
      'product_id', (select product_id from public.product_option_groups where id = '11111111-1111-1111-1111-111111111111'),
      'qty', 1,
      'option_ids', '[]'::jsonb
    ))::text
  ),
  'P0001',
  'OPTIONS_REQUIRED:',
  'missing required option'
);

select throws_ok(
  format(
    'select public.create_order(%L::uuid, %L::date, %L::jsonb, null)',
    (select id from public.pickup_points where slug = 'piekarnia'),
    (select min(d) from public.available_pickup_dates()),
    jsonb_build_array(jsonb_build_object(
      'product_id', (select product_id from public.product_option_groups where id = '11111111-1111-1111-1111-111111111111'),
      'qty', 1,
      'option_ids', jsonb_build_array('55555555-5555-5555-5555-555555555555'::uuid)
    ))::text
  ),
  'P0001',
  'OPTIONS_INVALID:',
  'option from another product'
);

select throws_ok(
  format(
    'select public.create_order(%L::uuid, %L::date, %L::jsonb, null)',
    (select id from public.pickup_points where slug = 'piekarnia'),
    (select min(d) from public.available_pickup_dates()),
    jsonb_build_array(jsonb_build_object(
      'product_id', (select product_id from public.product_option_groups where id = '11111111-1111-1111-1111-111111111111'),
      'qty', 1,
      'option_ids', jsonb_build_array(
        '22222222-2222-2222-2222-222222222222'::uuid,
        '33333333-3333-3333-3333-333333333333'::uuid
      )
    ))::text
  ),
  'P0001',
  'OPTIONS_INVALID:',
  'too many choices'
);

select is(
  (
    select oi.unit_price_grosze
    from public.order_items oi
    where oi.order_id = public.create_order(
      (select id from public.pickup_points where slug = 'piekarnia'),
      (select min(d) from public.available_pickup_dates()),
      jsonb_build_array(jsonb_build_object(
        'product_id', (select product_id from public.product_option_groups where id = '11111111-1111-1111-1111-111111111111'),
        'qty', 1,
        'option_ids', jsonb_build_array('33333333-3333-3333-3333-333333333333'::uuid)
      )),
      null
    )
    limit 1
  ),
  1700,
  'unit price includes the 2 zl surcharge'
);

select * from finish();
rollback;
