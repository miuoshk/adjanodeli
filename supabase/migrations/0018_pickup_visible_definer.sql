-- Anon cannot SELECT pickup_point_access; RLS and date helper must not read it as invoker.

create or replace function public.has_pickup_point_access(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pickup_point_access a
    where a.pickup_point_id = p_id
      and a.user_id = auth.uid()
  );
$$;

create or replace function public.pickup_point_visible(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_staff()
    or exists (
      select 1
      from public.pickup_points pp
      where pp.id = p_id
        and pp.is_active
        and (
          pp.visibility = 'public'
          or public.has_pickup_point_access(pp.id)
        )
    );
$$;

drop policy if exists pickup_points_select on public.pickup_points;
create policy pickup_points_select
  on public.pickup_points
  for select
  to anon, authenticated
  using (
    public.is_staff()
    or (
      is_active
      and (
        visibility = 'public'
        or public.has_pickup_point_access(id)
      )
    )
  );

revoke all on function public.has_pickup_point_access(uuid) from public;
revoke all on function public.pickup_point_visible(uuid) from public;
grant execute on function public.has_pickup_point_access(uuid) to anon, authenticated;
grant execute on function public.pickup_point_visible(uuid) to anon, authenticated;
