-- Owner analytics (SPEC §9 /admin/statystyki). Aggregation stays in SQL.

create or replace function public.stats_require_owner_range(p_from date, p_to date)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then
    raise exception 'FORBIDDEN';
  end if;
  if p_from is null or p_to is null or p_from > p_to or (p_to - p_from) > 365 then
    raise exception 'INVALID_RANGE';
  end if;
end;
$$;

create or replace function public.stats_summary(p_from date, p_to date)
returns table (
  revenue_grosze bigint,
  order_count int,
  avg_order_grosze int,
  unique_customers int,
  returning_customers int,
  uncollected_count int
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today date;
begin
  perform public.stats_require_owner_range(p_from, p_to);
  v_today := (public.warsaw_now() at time zone 'Europe/Warsaw')::date;

  return query
  with counted as (
    select o.user_id, o.status, o.pickup_date, o.total_grosze
    from public.orders o
    where o.pickup_date >= p_from
      and o.pickup_date <= p_to
      and o.status in ('paid', 'in_production', 'delivered', 'picked_up')
  )
  select
    coalesce(sum(c.total_grosze), 0)::bigint,
    count(*)::int,
    case
      when count(*) = 0 then 0
      else (sum(c.total_grosze) / count(*))::int
    end,
    count(distinct c.user_id)::int,
    (
      select count(*)::int
      from (
        select c2.user_id
        from counted c2
        group by c2.user_id
        having count(*) >= 2
      ) r
    ),
    count(*) filter (
      where c.status = 'delivered' and c.pickup_date < v_today
    )::int
  from counted c;
end;
$$;

create or replace function public.stats_revenue_by_day(p_from date, p_to date)
returns table (
  day date,
  revenue_grosze bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.stats_require_owner_range(p_from, p_to);

  return query
  select
    d.day,
    coalesce(sum(o.total_grosze), 0)::bigint
  from generate_series(p_from, p_to, interval '1 day') as g(day)
  cross join lateral (select g.day::date) d
  left join public.orders o
    on o.pickup_date = d.day
   and o.status in ('paid', 'in_production', 'delivered', 'picked_up')
  group by d.day
  order by d.day;
end;
$$;

create or replace function public.stats_orders_by_weekday(p_from date, p_to date)
returns table (
  weekday int,
  avg_orders numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.stats_require_owner_range(p_from, p_to);

  return query
  with days as (
    select
      g.day::date as day,
      extract(isodow from g.day)::int as weekday
    from generate_series(p_from, p_to, interval '1 day') as g(day)
  ),
  per_day as (
    select
      d.day,
      d.weekday,
      count(o.id)::int as order_count
    from days d
    left join public.orders o
      on o.pickup_date = d.day
     and o.status in ('paid', 'in_production', 'delivered', 'picked_up')
    group by d.day, d.weekday
  )
  select
    w.weekday,
    coalesce(avg(p.order_count), 0)::numeric(10, 2)
  from generate_series(1, 7) as w(weekday)
  left join per_day p on p.weekday = w.weekday
  group by w.weekday
  order by w.weekday;
end;
$$;

create or replace function public.stats_top_products(p_from date, p_to date)
returns table (
  product_id uuid,
  product_name text,
  qty int,
  revenue_grosze bigint,
  sellout_days int,
  sale_days int,
  sellout_pct numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.stats_require_owner_range(p_from, p_to);

  return query
  with counted as (
    select o.id
    from public.orders o
    where o.pickup_date >= p_from
      and o.pickup_date <= p_to
      and o.status in ('paid', 'in_production', 'delivered', 'picked_up')
  ),
  sales as (
    select
      oi.product_id,
      max(oi.product_name) as product_name,
      sum(oi.qty)::int as qty,
      sum(oi.unit_price_grosze * oi.qty)::bigint as revenue_grosze
    from public.order_items oi
    join counted c on c.id = oi.order_id
    where oi.product_id is not null
    group by oi.product_id
  ),
  days as (
    select g.day::date as day
    from generate_series(p_from, p_to, interval '1 day') as g(day)
  ),
  settings_row as (
    select s.order_weekdays, s.closed_dates
    from public.settings s
    where s.id = 1
  ),
  sale_cal as (
    select
      p.id as product_id,
      count(*)::int as sale_days
    from days d
    cross join public.products p
    cross join settings_row s
    left join public.product_day_overrides o
      on o.product_id = p.id
     and o.day = d.day
    where extract(isodow from d.day)::int = any (s.order_weekdays)
      and not (d.day = any (s.closed_dates))
      and p.created_at::date <= d.day
      and coalesce(o.is_available, true)
    group by p.id
  ),
  sellouts as (
    select
      ds.product_id,
      count(*)::int as sellout_days
    from public.daily_stock ds
    join days d on d.day = ds.day
    left join public.product_day_overrides o
      on o.product_id = ds.product_id
     and o.day = ds.day
    where ds.cap > 0
      and ds.reserved_qty >= ds.cap
      and coalesce(o.is_available, true)
    group by ds.product_id
  )
  select
    s.product_id,
    s.product_name,
    s.qty,
    s.revenue_grosze,
    coalesce(so.sellout_days, 0),
    coalesce(sc.sale_days, 0),
    case
      when coalesce(sc.sale_days, 0) = 0 then 0
      else round(100.0 * coalesce(so.sellout_days, 0) / sc.sale_days, 1)
    end
  from sales s
  left join sale_cal sc on sc.product_id = s.product_id
  left join sellouts so on so.product_id = s.product_id
  order by s.qty desc, s.revenue_grosze desc;
end;
$$;

create or replace function public.stats_by_pickup_point(p_from date, p_to date)
returns table (
  pickup_point_id uuid,
  point_name text,
  order_count int,
  revenue_grosze bigint,
  uncollected_count int,
  uncollected_pct numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today date;
begin
  perform public.stats_require_owner_range(p_from, p_to);
  v_today := (public.warsaw_now() at time zone 'Europe/Warsaw')::date;

  return query
  select
    pp.id,
    pp.name,
    count(o.id)::int,
    coalesce(sum(o.total_grosze), 0)::bigint,
    count(o.id) filter (
      where o.status = 'delivered' and o.pickup_date < v_today
    )::int,
    case
      when count(o.id) filter (where o.pickup_date < v_today) = 0 then 0
      else round(
        100.0 * count(o.id) filter (
          where o.status = 'delivered' and o.pickup_date < v_today
        ) / count(o.id) filter (where o.pickup_date < v_today),
        1
      )
    end
  from public.pickup_points pp
  join public.orders o on o.pickup_point_id = pp.id
  where o.pickup_date >= p_from
    and o.pickup_date <= p_to
    and o.status in ('paid', 'in_production', 'delivered', 'picked_up')
  group by pp.id, pp.name, pp.sort_order
  order by coalesce(sum(o.total_grosze), 0) desc, pp.sort_order;
end;
$$;

create or replace function public.stats_sellout_alerts()
returns table (
  product_id uuid,
  product_name text,
  sellout_days int,
  current_cap int,
  suggested_cap int
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_today date;
  v_from date;
begin
  if not public.is_owner() then
    raise exception 'FORBIDDEN';
  end if;

  v_today := (public.warsaw_now() at time zone 'Europe/Warsaw')::date;
  v_from := v_today - 13;

  return query
  with days as (
    select g.day::date as day
    from generate_series(v_from, v_today, interval '1 day') as g(day)
  ),
  sellouts as (
    select
      ds.product_id,
      count(*)::int as sellout_days,
      max(ds.reserved_qty)::int as max_reserved
    from public.daily_stock ds
    join days d on d.day = ds.day
    left join public.product_day_overrides o
      on o.product_id = ds.product_id
     and o.day = ds.day
    where ds.cap > 0
      and ds.reserved_qty >= ds.cap
      and coalesce(o.is_available, true)
    group by ds.product_id
  )
  select
    p.id,
    p.name,
    s.sellout_days,
    p.daily_cap_default,
    greatest(p.daily_cap_default + 5, s.max_reserved)
  from sellouts s
  join public.products p on p.id = s.product_id
  where s.sellout_days >= 3
  order by s.sellout_days desc, p.name;
end;
$$;

grant execute on function public.stats_summary(date, date) to authenticated;
grant execute on function public.stats_revenue_by_day(date, date) to authenticated;
grant execute on function public.stats_orders_by_weekday(date, date) to authenticated;
grant execute on function public.stats_top_products(date, date) to authenticated;
grant execute on function public.stats_by_pickup_point(date, date) to authenticated;
grant execute on function public.stats_sellout_alerts() to authenticated;
