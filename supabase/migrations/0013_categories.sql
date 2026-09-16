-- Categories: image, description, lead_days + public-read storage bucket (SPEC §3).

alter table public.categories
  add column if not exists image_path text,
  add column if not exists description text,
  add column if not exists lead_days int not null default 1;

alter table public.categories
  drop constraint if exists categories_lead_days_check;

alter table public.categories
  add constraint categories_lead_days_check check (lead_days >= 1);

insert into storage.buckets (id, name, public)
values ('categories', 'categories', true)
on conflict (id) do nothing;

drop policy if exists categories_bucket_select on storage.objects;
create policy categories_bucket_select
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'categories');

drop policy if exists categories_bucket_insert_owner on storage.objects;
create policy categories_bucket_insert_owner
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'categories' and public.is_owner());

drop policy if exists categories_bucket_update_owner on storage.objects;
create policy categories_bucket_update_owner
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'categories' and public.is_owner())
  with check (bucket_id = 'categories' and public.is_owner());

drop policy if exists categories_bucket_delete_owner on storage.objects;
create policy categories_bucket_delete_owner
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'categories' and public.is_owner());
