-- pgTAP: has_staff_permission (owner, staff with it, staff without it, inactive).

begin;
select plan(5);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated', 'owner-perm@example.com',
    crypt('test', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated', 'staff-perm@example.com',
    crypt('test', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated', 'authenticated', 'inactive-perm@example.com',
    crypt('test', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  );

update public.profiles
set role = 'owner', is_active = true, staff_permissions = '{}'
where id = '11111111-1111-1111-1111-111111111111';

update public.profiles
set
  role = 'staff',
  is_active = true,
  staff_permissions = array['dashboard:manage', 'production:view']::text[]
where id = '22222222-2222-2222-2222-222222222222';

update public.profiles
set
  role = 'staff',
  is_active = false,
  staff_permissions = array['production:manage']::text[]
where id = '33333333-3333-3333-3333-333333333333';

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('test.uid', true), '')::uuid;
$$;

select set_config('test.uid', '11111111-1111-1111-1111-111111111111', true);
select ok(
  public.has_staff_permission('handover', 'manage'),
  'owner has every permission'
);

select set_config('test.uid', '22222222-2222-2222-2222-222222222222', true);
select ok(
  public.has_staff_permission('production', 'view'),
  'view can open the section'
);
select ok(
  not public.has_staff_permission('production', 'manage'),
  'view does not allow a change'
);

select ok(
  not public.has_staff_permission('handover', 'view'),
  'active staff without the permission fails'
);

select set_config('test.uid', '33333333-3333-3333-3333-333333333333', true);
select ok(
  not public.has_staff_permission('production', 'view'),
  'inactive staff fails even with the permission'
);

select * from finish();
rollback;
