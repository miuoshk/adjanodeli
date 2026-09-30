-- Section permissions for staff. RLS on shop data stays is_staff().
-- Pages and server actions check the permission in the app.

alter table public.profiles
  add column staff_permissions text[] not null default '{}',
  add column is_active boolean not null default true,
  add column must_change_password boolean not null default false;

alter table public.profiles
  add constraint profiles_staff_permissions_check
  check (
    staff_permissions <@ array[
      'dashboard',
      'orders',
      'production',
      'packages',
      'handover',
      'special_requests'
    ]::text[]
  );

update public.profiles
set staff_permissions = array[
  'dashboard',
  'orders',
  'production',
  'packages',
  'handover',
  'special_requests'
]::text[]
where role = 'staff';

create or replace function public.has_staff_permission(p text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and pr.is_active
      and (
        pr.role = 'owner'
        or (pr.role = 'staff' and p = any (pr.staff_permissions))
      )
  );
$$;

revoke all on function public.has_staff_permission(text) from public;
grant execute on function public.has_staff_permission(text) to authenticated;

create or replace function public.admin_login_email(p_login text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.email
  from public.profiles p
  where p.role in ('staff', 'owner')
    and p.is_active
    and length(trim(p_login)) > 0
    and (
      lower(p.email) = lower(trim(p_login))
      or split_part(lower(p.email), '@', 1) = lower(trim(p_login))
    )
  order by case when p.role = 'owner' then 0 else 1 end, p.created_at
  limit 1;
$$;

revoke all on function public.admin_login_email(text) from public;
grant execute on function public.admin_login_email(text) to anon, authenticated;

-- A staff session can update its own profile row. Keep privilege columns locked
-- unless the caller is the service role, the database owner, or an owner.
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
  return new;
end;
$$;

create trigger profiles_protect_privileges
  before update on public.profiles
  for each row
  execute function public.protect_profile_privileges();
