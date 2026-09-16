-- Product sale weekdays + new-badge (SPEC §3 products, §4 product_availability).

alter table public.products
  add column if not exists weekdays int[] not null default '{1,2,3,4,5,6,7}',
  add column if not exists is_new boolean not null default false;

alter table public.products
  drop constraint if exists products_weekdays_check;

alter table public.products
  add constraint products_weekdays_check check (
    cardinality(weekdays) > 0
    and weekdays <@ '{1,2,3,4,5,6,7}'::int[]
  );

create or replace function public.product_availability(p_day date)
returns table (
  product_id uuid,
  cap int,
  reserved int,
  remaining int,
  is_available boolean
)
language sql
stable
set search_path = public
as $$
  select
    p.id as product_id,
    coalesce(o.cap, p.daily_cap_default) as cap,
    coalesce(s.reserved_qty, 0) as reserved,
    greatest(coalesce(o.cap, p.daily_cap_default) - coalesce(s.reserved_qty, 0), 0) as remaining,
    (
      coalesce(o.is_available, true)
      and extract(isodow from p_day)::int = any (p.weekdays)
    ) as is_available
  from public.products p
  left join public.product_day_overrides o
    on o.product_id = p.id
   and o.day = p_day
  left join public.daily_stock s
    on s.product_id = p.id
   and s.day = p_day
  where p.is_active;
$$;
