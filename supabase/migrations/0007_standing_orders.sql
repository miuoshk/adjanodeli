-- Standing orders (SPEC §14). Own-row RLS. Max 3 per user.

create table public.standing_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  pickup_point_id uuid not null references public.pickup_points (id),
  weekdays int[] not null check (
    cardinality(weekdays) > 0
    and weekdays <@ '{1,2,3,4,5,6,7}'::int[]
  ),
  items jsonb not null,
  note text,
  is_active boolean not null default true,
  remind boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.standing_orders
  for each row execute function public.set_updated_at();

create index standing_orders_user_id_idx on public.standing_orders (user_id);

create or replace function public.enforce_standing_order_limit()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*)
    from public.standing_orders
    where user_id = new.user_id
  ) >= 3 then
    raise exception 'STANDING_ORDER_LIMIT';
  end if;
  return new;
end;
$$;

create trigger standing_orders_limit
  before insert on public.standing_orders
  for each row execute function public.enforce_standing_order_limit();

alter table public.standing_orders enable row level security;

create policy standing_orders_select_own
  on public.standing_orders
  for select
  to authenticated
  using (user_id = auth.uid());

create policy standing_orders_insert_own
  on public.standing_orders
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy standing_orders_update_own
  on public.standing_orders
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy standing_orders_delete_own
  on public.standing_orders
  for delete
  to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.standing_orders to authenticated;
