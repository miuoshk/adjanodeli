-- pgTAP: restricted pickup points (SPEC §6 / §8).
-- anon / user without access cannot see restricted; create_order raises POINT_FORBIDDEN;
-- after unlock the point is visible.

begin;
select plan(6);

update public.pickup_points
set
  visibility = 'restricted',
  access_code = 'TESTCD88',
  is_active = true,
  weekdays = '{1,2,3,4,5}'
where slug = 'sad-rejonowy';

update public.pickup_points
set visibility = 'public', is_active = true
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
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'authenticated',
  'authenticated',
  'access-test@example.com',
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
  select 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid;
$$;

set local role anon;

select is(
  (select count(*)::int from public.pickup_points where slug = 'sad-rejonowy'),
  0,
  'anon does not see restricted point'
);

select ok(
  (select count(*)::int from public.pickup_points where slug = 'piekarnia') >= 1,
  'anon still sees public bakery'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee","role":"authenticated"}',
  true
);

select is(
  (select count(*)::int from public.pickup_points where slug = 'sad-rejonowy'),
  0,
  'user without access does not see restricted point'
);

reset role;

select throws_ok(
  format(
    'select public.create_order(%L::uuid, %L::date, %L::jsonb, null)',
    (select id from public.pickup_points where slug = 'sad-rejonowy'),
    (select min(d) from public.available_pickup_dates()),
    '[]'
  ),
  'P0001',
  'POINT_FORBIDDEN',
  'create_order without access raises POINT_FORBIDDEN'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.unlock_pickup_point('TESTCD88')$$,
  'unlock_pickup_point accepts the example code'
);

select is(
  (select count(*)::int from public.pickup_points where slug = 'sad-rejonowy'),
  1,
  'user sees restricted point after unlock'
);

select * from finish();
rollback;
