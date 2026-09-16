-- Admin panel login: map username or email to a staff/owner Auth email (SPEC §8).

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
