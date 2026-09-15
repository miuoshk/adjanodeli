-- Synchronizacja daily_stock.cap z override i daily_cap_default.

create or replace function public.sync_daily_stock_cap_from_override()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid;
  v_day date;
  v_cap int;
begin
  if tg_op = 'DELETE' then
    v_product_id := old.product_id;
    v_day := old.day;
    select p.daily_cap_default into v_cap
    from public.products p
    where p.id = v_product_id;
  else
    v_product_id := new.product_id;
    v_day := new.day;
    if new.cap is not null then
      v_cap := new.cap;
    else
      select p.daily_cap_default into v_cap
      from public.products p
      where p.id = v_product_id;
    end if;
  end if;

  if v_cap is not null then
    update public.daily_stock
    set cap = v_cap
    where product_id = v_product_id
      and day = v_day;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists product_day_overrides_sync_stock on public.product_day_overrides;
create trigger product_day_overrides_sync_stock
  after insert or update or delete on public.product_day_overrides
  for each row execute function public.sync_daily_stock_cap_from_override();

create or replace function public.sync_daily_stock_cap_from_product()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.daily_cap_default is distinct from old.daily_cap_default then
    update public.daily_stock ds
    set cap = new.daily_cap_default
    where ds.product_id = new.id
      and ds.day >= (timezone('Europe/Warsaw', now()))::date
      and not exists (
        select 1
        from public.product_day_overrides o
        where o.product_id = ds.product_id
          and o.day = ds.day
      );
  end if;
  return new;
end;
$$;

drop trigger if exists products_sync_stock_cap on public.products;
create trigger products_sync_stock_cap
  after update of daily_cap_default on public.products
  for each row execute function public.sync_daily_stock_cap_from_product();
