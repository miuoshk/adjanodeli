-- pgTAP: available_pickup_dates lead_days vs cutoff (SPEC §4 / §6).
-- Friday 2026-09-18: lead 1 → Monday, lead 2 → Tuesday.

begin;
select plan(8);

insert into public.pickup_points (
  name, slug, address, pickup_from, pickup_to, weekdays, is_active
)
values (
  'Test lead', 'test-lead-days', 'Test 1', '08:00', '09:00', '{1,2,3,4,5}', true
)
on conflict (slug) do update
set
  is_active = true,
  weekdays = excluded.weekdays;

update public.settings
set
  cutoff_time = '20:00',
  order_weekdays = '{1,2,3,4,5}',
  closed_dates = '{}',
  max_days_ahead = 7
where id = 1;

create or replace function public.warsaw_now()
returns timestamptz
language sql
stable
set search_path = public
as $$
  select timestamptz '2026-09-18 10:00:00+02';
$$;

select is(
  (select min(d)::text from public.available_pickup_dates(1) d),
  '2026-09-21',
  'Friday before cutoff, lead 1 → Monday'
);

select is(
  (select min(d)::text from public.available_pickup_dates(2) d),
  '2026-09-22',
  'Friday before cutoff, lead 2 → Tuesday'
);

select is(
  (select min(d)::text from public.available_pickup_dates() d),
  (select min(d)::text from public.available_pickup_dates(1) d),
  'no-arg wrapper equals lead 1'
);

create or replace function public.warsaw_now()
returns timestamptz
language sql
stable
set search_path = public
as $$
  select timestamptz '2026-09-18 21:00:00+02';
$$;

select is(
  (select min(d)::text from public.available_pickup_dates(1) d),
  '2026-09-21',
  'Friday after cutoff, lead 1 → Monday'
);

select is(
  (select min(d)::text from public.available_pickup_dates(2) d),
  '2026-09-22',
  'Friday after cutoff, lead 2 → Tuesday'
);

create or replace function public.warsaw_now()
returns timestamptz
language sql
stable
set search_path = public
as $$
  select timestamptz '2026-09-17 10:00:00+02';
$$;

select is(
  (select min(d)::text from public.available_pickup_dates(1) d),
  '2026-09-18',
  'Thursday before cutoff, lead 1 → Friday'
);

select is(
  (select min(d)::text from public.available_pickup_dates(2) d),
  '2026-09-21',
  'Thursday before cutoff, lead 2 → Monday'
);

create or replace function public.warsaw_now()
returns timestamptz
language sql
stable
set search_path = public
as $$
  select timestamptz '2026-09-17 21:00:00+02';
$$;

select is(
  (select min(d)::text from public.available_pickup_dates(2) d),
  '2026-09-22',
  'Thursday after cutoff, lead 2 → Tuesday'
);

select * from finish();
rollback;
