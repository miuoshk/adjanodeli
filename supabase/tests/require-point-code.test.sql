-- pgTAP: require_point_code blocks a public point without access,
-- allows it with access, and allows it again when the setting is off.

begin;
select plan(3);

update public.settings set require_point_code = true where id = 1;

update public.pickup_points
set visibility = 'public', is_active = true, weekdays = '{1,2,3,4,5}'
where slug = 'piekarnia';

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
  'authenticated',
  'authenticated',
  'point-code-test@example.com',
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
  select 'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid;
$$;

select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee","role":"authenticated"}',
  true
);

select throws_ok(
  format(
    'select public.create_order(%L::uuid, %L::date, %L::jsonb, null)',
    (select id from public.pickup_points where slug = 'piekarnia'),
    (select min(d) from public.available_pickup_dates()),
    '[]'
  ),
  'P0001',
  'POINT_FORBIDDEN',
  'public point without access is forbidden while the code is required'
);

insert into public.pickup_point_access (user_id, pickup_point_id, granted_via)
select 'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee', id, 'admin'
from public.pickup_points
where slug = 'piekarnia'
on conflict (user_id, pickup_point_id) do nothing;

select lives_ok(
  format(
    'select public.create_order(%L::uuid, %L::date, %L::jsonb, null)',
    (select id from public.pickup_points where slug = 'piekarnia'),
    (select min(d) from public.available_pickup_dates()),
    (
      select jsonb_build_array(jsonb_build_object('product_id', p.id, 'qty', 1))
      from public.products p
      where p.is_active
        and p.price_grosze >= 1000
        and coalesce(p.lead_days, 1) = 1
        and not exists (
          select 1
          from public.product_option_groups g
          where g.product_id = p.id
            and g.is_required
        )
      order by p.sort_order
      limit 1
    )
  ),
  'create_order to a public point succeeds with access'
);

delete from public.pickup_point_access
where user_id = 'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee';

update public.settings set require_point_code = false where id = 1;

select lives_ok(
  format(
    'select public.create_order(%L::uuid, %L::date, %L::jsonb, null)',
    (select id from public.pickup_points where slug = 'piekarnia'),
    (select min(d) from public.available_pickup_dates()),
    (
      select jsonb_build_array(jsonb_build_object('product_id', p.id, 'qty', 1))
      from public.products p
      where p.is_active
        and p.price_grosze >= 1000
        and coalesce(p.lead_days, 1) = 1
        and not exists (
          select 1
          from public.product_option_groups g
          where g.product_id = p.id
            and g.is_required
        )
      order by p.sort_order
      limit 1
    )
  ),
  'create_order to a public point succeeds when the code is not required'
);

select * from finish();
rollback;
