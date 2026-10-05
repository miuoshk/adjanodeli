-- pgTAP: volume tiers at 19/20/39/40, versus a voucher and a capped code,
-- and no volume discount when the setting is off.

begin;
select plan(8);

create temp table vol_ctx (
  product_id uuid,
  point_id uuid,
  day date
);

insert into vol_ctx (product_id, point_id, day)
select p.id, pt.id, null
from public.products p
cross join public.pickup_points pt
where pt.slug = 'piekarnia'
  and not exists (
    select 1
    from public.product_option_groups g
    where g.product_id = p.id
      and g.is_required
  )
order by p.created_at
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
where id = (select product_id from vol_ctx);

delete from public.daily_stock
where product_id = (select product_id from vol_ctx);

update public.settings
set
  volume_discount_enabled = true,
  volume_discount_tiers = '[{"min_qty":20,"pct":10},{"min_qty":40,"pct":20}]'::jsonb,
  max_qty_per_item = 15,
  require_point_code = true
where id = 1;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee',
  'authenticated',
  'authenticated',
  'volume-discount-test@example.com',
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
  select 'cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid;
$$;

select set_config('request.jwt.claim.sub', 'cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee","role":"authenticated"}',
  true
);

insert into public.pickup_point_access (user_id, pickup_point_id, granted_via)
select 'cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee', point_id, 'admin'
from vol_ctx
on conflict (user_id, pickup_point_id) do nothing;

update vol_ctx
set day = (select min(d) from public.available_pickup_dates() d);

create temp table vol_result (
  label text primary key,
  discount_grosze int,
  discount_source text,
  discount_pct int
);

create or replace function pg_temp.volume_order(p_label text, p_qty int, p_discount jsonb default null)
returns void
language plpgsql
as $$
declare
  v_items jsonb;
  v_id uuid;
  v_order public.orders;
begin
  select jsonb_agg(jsonb_build_object('product_id', c.product_id, 'qty', least(15, p_qty - n)))
  into v_items
  from vol_ctx c
  cross join generate_series(0, p_qty - 1, 15) as n;

  v_id := public.create_order(
    (select point_id from vol_ctx),
    (select day from vol_ctx),
    v_items,
    null,
    p_discount,
    null
  );
  select * into v_order from public.orders where id = v_id;
  insert into vol_result (label, discount_grosze, discount_source, discount_pct)
  values (p_label, v_order.discount_grosze, v_order.discount_source, v_order.discount_pct);
end;
$$;

select pg_temp.volume_order('q19', 19);
select pg_temp.volume_order('q20', 20);
select pg_temp.volume_order('q39', 39);
select pg_temp.volume_order('q40', 40);

insert into public.loyalty_vouchers (id, user_id, type, expires_at)
values
  ('dddddddd-bbbb-cccc-dddd-eeeeeeeeee01', 'cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee', 'PCT50', now() + interval '7 days'),
  ('dddddddd-bbbb-cccc-dddd-eeeeeeeeee02', 'cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee', 'PCT10', now() + interval '7 days');

select pg_temp.volume_order('v50', 25, '{"voucher_id":"dddddddd-bbbb-cccc-dddd-eeeeeeeeee01"}'::jsonb);
select pg_temp.volume_order('v10', 40, '{"voucher_id":"dddddddd-bbbb-cccc-dddd-eeeeeeeeee02"}'::jsonb);

insert into public.discount_codes (code, type, value, max_discount_grosze, per_user_once, is_active)
values ('VOLUMETEST', 'percent', 50, 1000, false, true);

select pg_temp.volume_order('code', 40, '{"code":"VOLUMETEST"}'::jsonb);

update public.settings set volume_discount_enabled = false where id = 1;
select pg_temp.volume_order('off', 40);

select is(
  (select discount_grosze::text || coalesce(discount_source, '-') from vol_result where label = 'q19'),
  '0-',
  '19 pieces get no volume discount'
);
select is(
  (select discount_grosze::text || discount_source || discount_pct::text from vol_result where label = 'q20'),
  '2000volume10',
  '20 pieces are 10%'
);
select is(
  (select discount_pct::text || discount_grosze::text from vol_result where label = 'q39'),
  '103900',
  '39 pieces stay on 10%'
);
select is(
  (select discount_grosze::text || discount_pct::text from vol_result where label = 'q40'),
  '800020',
  '40 pieces are 20%'
);
select is(
  (select discount_source || discount_grosze::text from vol_result where label = 'v50'),
  'voucher4000',
  'a 50% voucher capped at 40 zł beats 10% volume'
);
select is(
  (select discount_source from vol_result where label = 'v10')
    || (select used_order_id is null from public.loyalty_vouchers where id = 'dddddddd-bbbb-cccc-dddd-eeeeeeeeee02')::text,
  'volumetrue',
  '20% volume wins and the 10% voucher stays unused'
);
select is(
  (select discount_source from vol_result where label = 'code')
    || (select uses_count::text from public.discount_codes where code = 'VOLUMETEST'),
  'volume0',
  'volume beats a code capped at 10 zł and the code is not used'
);
select is(
  (select discount_grosze::text || coalesce(discount_source, '-') from vol_result where label = 'off'),
  '0-',
  'turning the setting off removes the volume discount'
);

select * from finish();
rollback;
