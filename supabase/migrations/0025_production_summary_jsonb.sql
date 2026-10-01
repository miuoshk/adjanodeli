-- production_summary aggregated by_option with max(jsonb), which Postgres does not have.
-- Staff calls then failed (42883) and the panel showed an empty baking plan.

create or replace function public.production_summary(p_day date)
returns table (
  product_id uuid,
  product_name text,
  total_qty int,
  by_point jsonb,
  by_option jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;

  return query
  with lines as (
    select
      oi.product_id,
      max(oi.product_name) as product_name,
      pp.name as point_name,
      sum(oi.qty)::int as qty
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    join public.pickup_points pp on pp.id = o.pickup_point_id
    where o.pickup_date = p_day
      and o.status in ('paid', 'in_production', 'delivered', 'picked_up')
    group by oi.product_id, pp.name
  ),
  option_lines as (
    select
      oi.product_id,
      (
        select string_agg(opt ->> 'option_name', ', ' order by opt ->> 'group_name', opt ->> 'option_name')
        from jsonb_array_elements(coalesce(oi.options, '[]'::jsonb)) as opt
      ) as label,
      sum(oi.qty)::int as qty
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.pickup_date = p_day
      and o.status in ('paid', 'in_production', 'delivered', 'picked_up')
      and jsonb_array_length(coalesce(oi.options, '[]'::jsonb)) > 0
    group by oi.product_id, 2
  ),
  option_agg as (
    select
      option_lines.product_id,
      jsonb_agg(
        jsonb_build_object('label', option_lines.label, 'qty', option_lines.qty)
        order by option_lines.qty desc, option_lines.label
      ) as by_option
    from option_lines
    where option_lines.label is not null
      and option_lines.label <> ''
    group by option_lines.product_id
  )
  select
    l.product_id,
    max(l.product_name),
    sum(l.qty)::int,
    jsonb_object_agg(l.point_name, l.qty),
    coalesce((max(oa.by_option::text))::jsonb, '[]'::jsonb)
  from lines l
  left join option_agg oa on oa.product_id = l.product_id
  group by l.product_id;
end;
$$;

grant execute on function public.production_summary(date) to authenticated;
