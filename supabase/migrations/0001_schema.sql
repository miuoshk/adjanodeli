-- AdjanoDeli schema: tables, triggers, RLS, storage, indexes.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables (FK order)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'staff', 'owner')),
  marketing_consent boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.settings (
  id int primary key check (id = 1),
  bakery_name text default 'AdjanoDeli',
  cutoff_time time not null default '20:00',
  order_weekdays int[] not null default '{1,2,3,4,5}',
  max_days_ahead int not null default 7,
  closed_dates date[] not null default '{}',
  pending_order_ttl_minutes int not null default 30,
  max_qty_per_item int not null default 15,
  owner_email text not null,
  owner_phone text,
  currency text not null default 'PLN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pickup_points (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  address text not null,
  description text,
  pickup_from time not null,
  pickup_to time not null,
  weekdays int[] not null default '{1,2,3,4,5}',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id),
  name text not null,
  slug text unique not null,
  description text,
  price_grosze int not null check (price_grosze >= 0),
  image_path text,
  allergens text[] not null default '{}',
  tags text[] not null default '{}',
  daily_cap_default int not null default 20,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_day_overrides (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  day date not null,
  cap int,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, day)
);

create table public.daily_stock (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  day date not null,
  cap int not null,
  reserved_qty int not null default 0 check (reserved_qty >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, day)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  user_id uuid not null references public.profiles (id),
  pickup_point_id uuid not null references public.pickup_points (id),
  pickup_date date not null,
  status text not null default 'pending_payment' check (
    status in (
      'pending_payment',
      'paid',
      'in_production',
      'delivered',
      'picked_up',
      'expired',
      'cancelled',
      'refunded'
    )
  ),
  pickup_code text,
  customer_name text not null,
  customer_phone text,
  customer_email text not null,
  note text check (note is null or char_length(note) <= 200),
  subtotal_grosze int not null,
  discount_grosze int not null default 0,
  total_grosze int not null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  expires_at timestamptz,
  paid_at timestamptz,
  delivered_at timestamptz,
  picked_up_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pickup_date, pickup_code)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id),
  product_name text not null,
  unit_price_grosze int not null,
  qty int not null check (qty > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.special_requests (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  email text,
  wanted_date date,
  description text not null,
  status text default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status text,
  to_status text,
  actor uuid references public.profiles (id),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.pickup_points
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.product_day_overrides
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.daily_stock
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.order_items
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.special_requests
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.order_events
  for each row execute function public.set_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Seed settings
-- ---------------------------------------------------------------------------

insert into public.settings (id, owner_email, bakery_name)
values (1, 'ZMIEN@adjanodeli.pl', 'AdjanoDeli');

-- ---------------------------------------------------------------------------
-- Role helpers (read profiles.role for auth.uid())
-- ---------------------------------------------------------------------------

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('staff', 'owner')
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'owner'
  );
$$;

grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_owner() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.pickup_points enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_day_overrides enable row level security;
alter table public.daily_stock enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.special_requests enable row level security;
alter table public.order_events enable row level security;

-- profiles: own select/update; staff select all
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy profiles_select_staff
  on public.profiles
  for select
  to authenticated
  using (public.is_staff());

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- settings: public select; owner write
create policy settings_select
  on public.settings
  for select
  to anon, authenticated
  using (true);

create policy settings_insert_owner
  on public.settings
  for insert
  to authenticated
  with check (public.is_owner());

create policy settings_update_owner
  on public.settings
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy settings_delete_owner
  on public.settings
  for delete
  to authenticated
  using (public.is_owner());

-- pickup_points / categories / products: public select of active rows; owner write
create policy pickup_points_select
  on public.pickup_points
  for select
  to anon, authenticated
  using (is_active or public.is_owner());

create policy pickup_points_insert_owner
  on public.pickup_points
  for insert
  to authenticated
  with check (public.is_owner());

create policy pickup_points_update_owner
  on public.pickup_points
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy pickup_points_delete_owner
  on public.pickup_points
  for delete
  to authenticated
  using (public.is_owner());

create policy categories_select
  on public.categories
  for select
  to anon, authenticated
  using (is_active or public.is_owner());

create policy categories_insert_owner
  on public.categories
  for insert
  to authenticated
  with check (public.is_owner());

create policy categories_update_owner
  on public.categories
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy categories_delete_owner
  on public.categories
  for delete
  to authenticated
  using (public.is_owner());

create policy products_select
  on public.products
  for select
  to anon, authenticated
  using (is_active or public.is_owner());

create policy products_insert_owner
  on public.products
  for insert
  to authenticated
  with check (public.is_owner());

create policy products_update_owner
  on public.products
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy products_delete_owner
  on public.products
  for delete
  to authenticated
  using (public.is_owner());

-- product_day_overrides / daily_stock: public select; owner write
create policy product_day_overrides_select
  on public.product_day_overrides
  for select
  to anon, authenticated
  using (true);

create policy product_day_overrides_insert_owner
  on public.product_day_overrides
  for insert
  to authenticated
  with check (public.is_owner());

create policy product_day_overrides_update_owner
  on public.product_day_overrides
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy product_day_overrides_delete_owner
  on public.product_day_overrides
  for delete
  to authenticated
  using (public.is_owner());

create policy daily_stock_select
  on public.daily_stock
  for select
  to anon, authenticated
  using (true);

create policy daily_stock_insert_owner
  on public.daily_stock
  for insert
  to authenticated
  with check (public.is_owner());

create policy daily_stock_update_owner
  on public.daily_stock
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy daily_stock_delete_owner
  on public.daily_stock
  for delete
  to authenticated
  using (public.is_owner());

-- orders / order_items / order_events: select only (mutations via SECURITY DEFINER / service_role)
create policy orders_select
  on public.orders
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_staff());

create policy order_items_select
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_staff())
    )
  );

create policy order_events_select
  on public.order_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_events.order_id
        and (o.user_id = auth.uid() or public.is_staff())
    )
  );

-- special_requests: insert anon + authenticated; select/update staff
create policy special_requests_insert
  on public.special_requests
  for insert
  to anon, authenticated
  with check (true);

create policy special_requests_select_staff
  on public.special_requests
  for select
  to authenticated
  using (public.is_staff());

create policy special_requests_update_staff
  on public.special_requests
  for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Privileges (RLS still applies)
grant select, update on public.profiles to authenticated;

grant select on public.settings to anon, authenticated;
grant insert, update, delete on public.settings to authenticated;

grant select on public.pickup_points to anon, authenticated;
grant insert, update, delete on public.pickup_points to authenticated;

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

grant select on public.product_day_overrides to anon, authenticated;
grant insert, update, delete on public.product_day_overrides to authenticated;

grant select on public.daily_stock to anon, authenticated;
grant insert, update, delete on public.daily_stock to authenticated;

grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select on public.order_events to authenticated;

grant insert on public.special_requests to anon, authenticated;
grant select, update on public.special_requests to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: public-read products bucket; owner write
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('products', 'products', true);

create policy products_bucket_select
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'products');

create policy products_bucket_insert_owner
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'products' and public.is_owner());

create policy products_bucket_update_owner
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'products' and public.is_owner())
  with check (bucket_id = 'products' and public.is_owner());

create policy products_bucket_delete_owner
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'products' and public.is_owner());

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index orders_pickup_date_status_idx on public.orders (pickup_date, status);
create index orders_user_id_idx on public.orders (user_id);
create index orders_stripe_checkout_session_id_idx on public.orders (stripe_checkout_session_id);
create index order_items_order_id_idx on public.order_items (order_id);
create index daily_stock_day_idx on public.daily_stock (day);
create index product_day_overrides_day_idx on public.product_day_overrides (day);
