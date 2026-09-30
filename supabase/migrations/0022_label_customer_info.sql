-- Ile danych klienta widać na etykiecie paczki.

alter table public.settings
  add column label_customer_info text not null default 'masked_email'
  check (label_customer_info in ('masked', 'masked_email', 'full'));
