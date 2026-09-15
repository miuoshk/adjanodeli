-- Startowe kategorie, produkty i punkty odbioru.
-- Idempotentne: on conflict (slug) do update.

insert into public.categories (name, slug, sort_order, is_active)
values
  ('Kanapki', 'kanapki', 1, true),
  ('Sałatki', 'salatki', 2, true),
  ('Deserki w kubeczkach', 'deserki', 3, true),
  ('Ciasta deserowe', 'ciasta', 4, true),
  ('Keto', 'keto', 5, true),
  ('Dania gastro', 'gastro', 6, true)
on conflict (slug) do update
set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.products (
  category_id,
  name,
  slug,
  description,
  price_grosze,
  allergens,
  tags,
  daily_cap_default,
  is_active,
  sort_order
)
values
  -- Kanapki (cap 30)
  (
    (select id from public.categories where slug = 'kanapki'),
    'Kanapka ser-szynka na chlebie żytnim',
    'kanapka-ser-szynka',
    'Chleb żytni, ser żółty, szynka, masło, ogórek kiszony.',
    1290,
    array['gluten', 'mleko']::text[],
    '{}'::text[],
    30,
    true,
    1
  ),
  (
    (select id from public.categories where slug = 'kanapki'),
    'Bajgiel grecki z fetą i oliwkami',
    'bajgiel-grecki',
    'Bajgiel, feta, oliwki, pomidor, ogórek, oregano.',
    1590,
    array['gluten', 'mleko']::text[],
    array['wege']::text[],
    30,
    true,
    2
  ),
  (
    (select id from public.categories where slug = 'kanapki'),
    'Kanapka z tuńczykiem i ogórkiem',
    'kanapka-tunczyk',
    'Chleb pszenny, tuńczyk, majonez, ogórek, sałata.',
    1490,
    array['gluten', 'ryby', 'jaja']::text[],
    '{}'::text[],
    30,
    true,
    3
  ),
  (
    (select id from public.categories where slug = 'kanapki'),
    'Kanapka hummus i warzywa',
    'kanapka-hummus',
    'Chleb razowy, hummus, papryka, ogórek, rukola.',
    1390,
    array['gluten', 'sezam']::text[],
    array['wege']::text[],
    30,
    true,
    4
  ),

  -- Sałatki (cap 15)
  (
    (select id from public.categories where slug = 'salatki'),
    'Sałatka z kurczakiem i pieczonym burakiem',
    'salatka-kurczak-burak',
    'Grillowany kurczak, pieczony burak, mix sałat, dressing jogurtowy.',
    1890,
    array['mleko']::text[],
    '{}'::text[],
    15,
    true,
    1
  ),
  (
    (select id from public.categories where slug = 'salatki'),
    'Sałatka grecka z fetą',
    'salatka-grecka',
    'Pomidor, ogórek, papryka, oliwki, cebula, feta, oliwa.',
    1690,
    array['mleko']::text[],
    array['wege']::text[],
    15,
    true,
    2
  ),
  (
    (select id from public.categories where slug = 'salatki'),
    'Sałatka cesarska z kurczakiem',
    'salatka-cesarska',
    'Sałata rzymska, kurczak, grzanki, parmezan, sos cesarski.',
    1790,
    array['gluten', 'jaja', 'mleko']::text[],
    '{}'::text[],
    15,
    true,
    3
  ),
  (
    (select id from public.categories where slug = 'salatki'),
    'Sałatka z pieczonym batatem i fetą',
    'salatka-batat-feta',
    'Pieczony batat, feta, rukola, pestki dyni, oliwa.',
    1690,
    array['mleko']::text[],
    array['wege']::text[],
    15,
    true,
    4
  ),

  -- Deserki w kubeczkach (cap 20)
  (
    (select id from public.categories where slug = 'deserki'),
    'Tiramisu w kubeczku',
    'tiramisu-kubeczek',
    'Krem mascarpone, nasączony biszkopt, kakao.',
    1190,
    array['gluten', 'mleko', 'jaja']::text[],
    '{}'::text[],
    20,
    true,
    1
  ),
  (
    (select id from public.categories where slug = 'deserki'),
    'Sernik w kubeczku z owocami',
    'sernik-kubeczek',
    'Krem serowy na kruszonce, sezonowe owoce.',
    1090,
    array['gluten', 'mleko', 'jaja']::text[],
    '{}'::text[],
    20,
    true,
    2
  ),
  (
    (select id from public.categories where slug = 'deserki'),
    'Jogurt z granolą i miodem',
    'jogurt-granola',
    'Jogurt naturalny, granola owsiana, miód.',
    990,
    array['gluten', 'mleko']::text[],
    '{}'::text[],
    20,
    true,
    3
  ),
  (
    (select id from public.categories where slug = 'deserki'),
    'Pudding chia z malinami',
    'pudding-chia',
    'Nasiona chia na mleku, maliny, wiórki kokosowe.',
    1090,
    array['mleko']::text[],
    array['wege']::text[],
    20,
    true,
    4
  ),

  -- Ciasta deserowe (cap 12)
  (
    (select id from public.categories where slug = 'ciasta'),
    'Sernik na zimno z malinami',
    'sernik-na-zimno-maliny',
    'Krem serowy na herbatnikach, maliny, galaretka.',
    1890,
    array['gluten', 'mleko', 'jaja']::text[],
    '{}'::text[],
    12,
    true,
    1
  ),
  (
    (select id from public.categories where slug = 'ciasta'),
    'Szarlotka na kruchym cieście',
    'szarlotka',
    'Kruche ciasto, jabłka, cynamon, kruszonka.',
    1690,
    array['gluten', 'jaja']::text[],
    array['wege']::text[],
    12,
    true,
    2
  ),
  (
    (select id from public.categories where slug = 'ciasta'),
    'Brownie czekoladowe',
    'brownie',
    'Ciasto czekoladowe, kawałki czekolady, orzechy włoskie.',
    1490,
    array['gluten', 'jaja', 'mleko', 'orzechy']::text[],
    '{}'::text[],
    12,
    true,
    3
  ),
  (
    (select id from public.categories where slug = 'ciasta'),
    'Makowiec',
    'makowiec',
    'Ciasto drożdżowe, masa makowa, lukier.',
    1590,
    array['gluten', 'mleko', 'jaja']::text[],
    '{}'::text[],
    12,
    true,
    4
  ),

  -- Keto (cap 10)
  (
    (select id from public.categories where slug = 'keto'),
    'Chlebek keto z pestkami',
    'chlebek-keto',
    'Chleb z mąki migdałowej, pestki słonecznika i dyni.',
    1890,
    array['orzechy', 'jaja']::text[],
    array['keto']::text[],
    10,
    true,
    1
  ),
  (
    (select id from public.categories where slug = 'keto'),
    'Kanapka keto z jajkiem i awokado',
    'kanapka-keto-jajko',
    'Chlebek keto, jajko, awokado, masło.',
    1990,
    array['orzechy', 'jaja', 'mleko']::text[],
    array['keto']::text[],
    10,
    true,
    2
  ),
  (
    (select id from public.categories where slug = 'keto'),
    'Muffinka keto czekoladowa',
    'muffinka-keto',
    'Muffinka z mąki migdałowej i kakao, bez cukru.',
    1290,
    array['orzechy', 'jaja']::text[],
    array['keto']::text[],
    10,
    true,
    3
  ),
  (
    (select id from public.categories where slug = 'keto'),
    'Sałatka keto z łososiem',
    'salatka-keto-losos',
    'Łosoś, sałata, ogórek, oliwa, pestki.',
    2190,
    array['ryby']::text[],
    array['keto']::text[],
    10,
    true,
    4
  ),

  -- Dania gastro (cap 15)
  (
    (select id from public.categories where slug = 'gastro'),
    'Pierogi ruskie 10 szt.',
    'pierogi-ruskie',
    'Ciasto, ziemniaki, twaróg, cebulka, śmietana.',
    2290,
    array['gluten', 'mleko', 'jaja']::text[],
    array['wege']::text[],
    15,
    true,
    1
  ),
  (
    (select id from public.categories where slug = 'gastro'),
    'Gołąbki w sosie pomidorowym',
    'golabki',
    'Kapusta, mięso mielone, ryż, sos pomidorowy.',
    2390,
    array['seler']::text[],
    '{}'::text[],
    15,
    true,
    2
  ),
  (
    (select id from public.categories where slug = 'gastro'),
    'Kotlet schabowy z ziemniakami',
    'schabowy',
    'Kotlet panierowany, ziemniaki, surówka z kapusty.',
    2400,
    array['gluten', 'jaja']::text[],
    '{}'::text[],
    15,
    true,
    3
  ),
  (
    (select id from public.categories where slug = 'gastro'),
    'Żurek z kiełbasą w chlebie',
    'zurek-w-chlebie',
    'Żurek na zakwasie, kiełbasa, jajko, podawany w chlebie.',
    2190,
    array['gluten', 'mleko', 'jaja', 'seler']::text[],
    '{}'::text[],
    15,
    true,
    4
  )
on conflict (slug) do update
set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  price_grosze = excluded.price_grosze,
  allergens = excluded.allergens,
  tags = excluded.tags,
  daily_cap_default = excluded.daily_cap_default,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

-- Adresy sądu i urzędu są placeholderami do potwierdzenia.
insert into public.pickup_points (
  name,
  slug,
  address,
  description,
  pickup_from,
  pickup_to,
  weekdays,
  is_active,
  sort_order
)
values
  (
    'Sąd Rejonowy w Mikołowie',
    'sad-rejonowy',
    'ul. ks. Kard. Wyszyńskiego 12, Mikołów',
    'portiernia, wejście główne',
    '08:00',
    '09:00',
    '{1,2,3,4,5}',
    true,
    1
  ),
  (
    'Urząd Miasta Mikołów',
    'urzad-miasta',
    'Rynek 16, Mikołów',
    'biuro podawcze, parter',
    '08:15',
    '09:15',
    '{1,2,3,4,5}',
    true,
    2
  ),
  (
    'Piekarnia Adjano',
    'piekarnia',
    'ul. Katowicka 120, Mikołów',
    'odbiór w sklepie',
    '07:00',
    '17:00',
    '{1,2,3,4,5,6}',
    true,
    3
  )
on conflict (slug) do update
set
  name = excluded.name,
  address = excluded.address,
  description = excluded.description,
  pickup_from = excluded.pickup_from,
  pickup_to = excluded.pickup_to,
  weekdays = excluded.weekdays,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;
