alter table public.products
  add column if not exists is_featured boolean not null default false;

comment on column public.products.is_featured is
  'Pokazywany w sekcji Polecamy na stronie głównej (ustawia owner).';
