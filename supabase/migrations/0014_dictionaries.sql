-- Allergen and product-tag dictionaries (SPEC §3 / §9 /admin/slowniki).

create table public.allergens (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  color text not null default 'gold' check (color in ('gold', 'khaki', 'red')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.allergens
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.product_tags
  for each row execute function public.set_updated_at();

alter table public.allergens enable row level security;
alter table public.product_tags enable row level security;

create policy allergens_select
  on public.allergens
  for select
  to anon, authenticated
  using (true);

create policy allergens_insert_owner
  on public.allergens
  for insert
  to authenticated
  with check (public.is_owner());

create policy allergens_update_owner
  on public.allergens
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy allergens_delete_owner
  on public.allergens
  for delete
  to authenticated
  using (public.is_owner());

create policy product_tags_select
  on public.product_tags
  for select
  to anon, authenticated
  using (true);

create policy product_tags_insert_owner
  on public.product_tags
  for insert
  to authenticated
  with check (public.is_owner());

create policy product_tags_update_owner
  on public.product_tags
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy product_tags_delete_owner
  on public.product_tags
  for delete
  to authenticated
  using (public.is_owner());

grant select on public.allergens to anon, authenticated;
grant insert, update, delete on public.allergens to authenticated;

grant select on public.product_tags to anon, authenticated;
grant insert, update, delete on public.product_tags to authenticated;

insert into public.allergens (name, sort_order)
values
  ('gluten', 1),
  ('skorupiaki', 2),
  ('jaja', 3),
  ('ryby', 4),
  ('orzeszki ziemne', 5),
  ('soja', 6),
  ('mleko', 7),
  ('orzechy', 8),
  ('seler', 9),
  ('gorczyca', 10),
  ('sezam', 11),
  ('dwutlenek siarki i siarczyny', 12),
  ('łubin', 13),
  ('mięczaki', 14)
on conflict (name) do update
set sort_order = excluded.sort_order;

insert into public.product_tags (name, slug, color, sort_order)
values
  ('keto', 'keto', 'gold', 1),
  ('wege', 'wege', 'khaki', 2),
  ('bez laktozy', 'bez-laktozy', 'gold', 3),
  ('ostre', 'ostre', 'red', 4),
  ('nowość', 'nowosc', 'gold', 5)
on conflict (name) do update
set
  slug = excluded.slug,
  color = excluded.color,
  sort_order = excluded.sort_order;

update public.products
set allergens = array_replace(allergens, 'siarczyny', 'dwutlenek siarki i siarczyny')
where allergens @> array['siarczyny']::text[];

create or replace function public.rename_allergen(p_old text, p_new text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text;
  v_new text;
begin
  if not public.is_owner() then
    raise exception 'FORBIDDEN';
  end if;

  v_old := trim(p_old);
  v_new := trim(p_new);
  if v_old = '' or v_new = '' then
    raise exception 'INVALID_NAME';
  end if;
  if v_old = v_new then
    return;
  end if;

  update public.allergens
  set name = v_new
  where name = v_old;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  update public.products
  set allergens = array_replace(allergens, v_old, v_new)
  where allergens @> array[v_old]::text[];
end;
$$;

create or replace function public.rename_tag(p_old text, p_new text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text;
  v_new text;
begin
  if not public.is_owner() then
    raise exception 'FORBIDDEN';
  end if;

  v_old := trim(p_old);
  v_new := trim(p_new);
  if v_old = '' or v_new = '' then
    raise exception 'INVALID_NAME';
  end if;
  if v_old = v_new then
    return;
  end if;

  update public.product_tags
  set name = v_new
  where name = v_old;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  update public.products
  set tags = array_replace(tags, v_old, v_new)
  where tags @> array[v_old]::text[];
end;
$$;

revoke all on function public.rename_allergen(text, text) from public;
grant execute on function public.rename_allergen(text, text) to authenticated;

revoke all on function public.rename_tag(text, text) from public;
grant execute on function public.rename_tag(text, text) to authenticated;
