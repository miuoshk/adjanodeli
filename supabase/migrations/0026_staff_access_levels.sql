-- Section access is view or manage. A bare key from prompt 16 becomes manage.

alter table public.profiles
  drop constraint if exists profiles_staff_permissions_check;

update public.profiles
set staff_permissions = (
  select coalesce(
    array_agg(mapped.section || ':' || mapped.level order by mapped.section),
    '{}'::text[]
  )
  from (
    select
      split_part(token, ':', 1) as section,
      case when bool_or(split_part(token, ':', 2) = 'manage') then 'manage' else 'view' end as level
    from (
      select case
        when item ~ '^(dashboard|orders|production|packages|handover|special_requests):(view|manage)$' then item
        when item in ('dashboard', 'orders', 'production', 'packages', 'handover', 'special_requests') then item || ':manage'
        else null
      end as token
      from unnest(staff_permissions) as item
    ) raw
    where token is not null
    group by split_part(token, ':', 1)
  ) mapped
);

create or replace function public.staff_permissions_valid(items text[])
returns boolean
language sql
immutable
as $$
  select coalesce(
    (
      select
        bool_and(
          item ~ '^(dashboard|orders|production|packages|handover|special_requests):(view|manage)$'
        )
        and count(*) = count(distinct split_part(item, ':', 1))
      from unnest(items) as item
    ),
    true
  );
$$;

revoke all on function public.staff_permissions_valid(text[]) from public, anon, authenticated;

alter table public.profiles
  add constraint profiles_staff_permissions_check
  check (public.staff_permissions_valid(staff_permissions));

create or replace function public.has_staff_permission(p_section text, p_level text default 'view')
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
        or (
          pr.role = 'staff'
          and (
            (p_section || ':' || p_level) = any (pr.staff_permissions)
            or (
              p_level = 'view'
              and (p_section || ':manage') = any (pr.staff_permissions)
            )
          )
        )
      )
  );
$$;

revoke all on function public.has_staff_permission(text, text) from public;
grant execute on function public.has_staff_permission(text, text) to authenticated;

drop function if exists public.has_staff_permission(text);
