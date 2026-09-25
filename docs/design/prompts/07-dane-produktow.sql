-- 07 · Porządek w nazwach i opisach produktów (PROPOZYCJA — przejrzyj z Justyną przed uruchomieniem)
-- Uruchom w Supabase → SQL Editor. Wszystko w jednej transakcji.
-- Zmienia tylko: nazwy produktów, literówki w opisach, slugi dwóch kategorii.
-- NIE zmienia alergenów, cen, stanów ani zdjęć.
-- Stare zamówienia zachowują nazwy z chwili zakupu (order_items.product_name), więc nic się w nich nie zmieni.

begin;

-- ——— Kategorie: czytelne adresy (/sklep/chleby zamiast /sklep/ds) ———
update public.categories set slug = 'chleby'    where id = (select id from public.categories where slug = 'ds');
update public.categories set slug = 'slodkosci' where id = (select id from public.categories where slug = '04');

-- ——— Kanapki ———
update public.products set name = 'Kanapka firmowa z mozzarellą (trójkąt)'  where id = 'f9662b88-46b7-4122-a430-87a1babad02e';
update public.products set name = 'Bajgiel grecki'                          where id = 'ecfc0d3a-8ef4-4e2d-bda6-1dbe98ea6644';
update public.products set name = 'Kanapka firmowa ze schabem (trójkąt)'    where id = 'b8571d4b-d291-41a4-a278-d0275ff093a2';
update public.products set name = 'Croissant wytrawno-słodki'               where id = '2dbf7089-b933-4be2-ba11-1063e310b980';
update public.products set name = 'Bajgiel drwala'                          where id = 'caf33af9-a3b6-43be-93b2-7108e5016421';
update public.products set name = 'Kanapka z pastą jajeczną'                where id = '3035b483-eff0-4040-a2bc-bba18cdce5fb';
update public.products set name = 'Kanapka z szynką i serem (bułka pszenna)'   where id = '752db860-d52b-4818-9cbe-538f6737a79b';
update public.products set name = 'Kanapka z szynką i serem (bułka ziarnista)' where id = 'c4eafb9f-5d34-47f8-ad48-a3b52f07df28';
update public.products set name = 'Kanapka z jajkiem'                       where id = '0593fc4c-8240-4d00-9527-61beb42e2b5d';
update public.products set name = 'Kanapka z pastą z tuńczyka'              where id = 'a5e3e973-8e81-41d7-8ff3-e7e5c43e87b2';

-- ——— Sałatki ———
update public.products set name = 'Sałatka warzywna'           where id = '6fbb4e88-fa26-42ae-9b0c-4b83ac0d11a6';
update public.products set name = 'Sałatka z halloumi'         where id = 'fe6e8148-ef74-4b92-9316-770c5ddb02fb';
update public.products set name = 'Sałatka z kurczakiem'       where id = 'b67812e3-76ba-4e8d-86a9-8147d698122e';
update public.products set name = 'Sałatka grecka z fetą'      where id = 'bc6c009c-65ad-40d6-8ee0-aa9c8dfd4584';
update public.products set name = 'Sałatka z tuńczykiem'       where id = '7ba096e1-03ee-4f5f-ab63-839cd05d68df';
update public.products set name = 'Sałatka z burakiem'         where id = '47424fed-2f37-4966-ad59-e0ea5ec42822';

-- ——— Deserki w kubeczkach (słowo „kubek” jest już w nazwie kategorii) ———
update public.products set name = 'Truskawki z granolą'        where id = '6b3029ea-9881-4558-81ff-3a3f32cf4365';
update public.products set name = 'Tiramisu'                   where id = 'ff1ccb23-5707-43c6-aa59-d7ebb1928096';
update public.products set name = 'Jogurt z chia i mango'      where id = 'cf54efd3-d152-499f-a71d-833d1e2b8ad8';
update public.products set name = 'Tęczowa galaretka'          where id = '55e6e434-f8a1-4313-ba60-b9b3964f0cc0';
update public.products set name = 'Wiśnie z granolą'           where id = '659d7d9e-10c1-43b9-a81b-d59b7eefeccf';

-- ——— Drobne słodkości ———
update public.products set name = 'Babka truflowa'                 where id = 'd913edcc-0e66-4a4e-8351-ab25888e3456';
update public.products set name = 'Babka marchewkowa'              where id = '2873dd96-a7f3-4cc7-92d0-3bf6564dede3';
update public.products set name = 'Croissant z jabłkami'           where id = '2a5f801f-ee8d-4149-b81e-4676adee2910';
update public.products set name = 'Croissant z czekoladą'          where id = '1d2a90d6-baac-4857-8c46-be1d7e189650';
update public.products set name = 'Babka cytrynowa'                where id = '93bf3186-c66b-492e-bca7-a65fc9f2f1c4';
update public.products set name = 'Pączek z marmoladą'             where id = '4df6517e-7635-42ec-a23d-2207a3e45f00';
update public.products set name = 'Pączusie serowe z cynamonem'    where id = '52a289e7-80e1-486d-8bff-1e4dd9bfb7a7';
update public.products set name = 'Pączusie serowe z malinami'     where id = '6cbc2154-093d-449a-b156-6fd3f2c825fb';
update public.products set name = 'Krążek jogurtowy'               where id = '4f9d47fe-61f2-43f6-a749-8b9bda3bb8f1';

-- ——— Keto & Fit ———
update public.products set name = 'Owsianka'                          where id = '40dd35d4-0bec-4884-bb84-c8a348cbe2b1';
update public.products set name = 'Keto sernik czekoladowy z malinami' where id = 'be7d8595-1c19-4a0f-8e11-b239396893bf';
update public.products set name = 'Keto brownie tiramisu'             where id = 'ccb7b657-40b5-4e64-9dac-fa0333cc6db4'; -- było „brauni”; zostaw „brauni”, jeśli to celowa nazwa
update public.products set name = 'Keto murzynek'                     where id = 'dadf0570-0f00-4791-83a9-76639c170052'; -- do decyzji: część piekarni zmieniła nazwę na „ciasto czekoladowe”
update public.products set name = 'Keto ciasto orzechowe'             where id = '226b9ecb-ccb4-4d38-a03e-fd4478dcc648';

update public.products
  set description = replace(description, 'serem mascarpone', 'ser mascarpone')
  where id in ('be7d8595-1c19-4a0f-8e11-b239396893bf', 'ccb7b657-40b5-4e64-9dac-fa0333cc6db4');

-- ——— Chleby ———
update public.products set name = 'Chleb pszenno-żytni'   where id = '37dfd17f-6730-4446-9ec9-6f3739a2676d'; -- było „chleb zwykły”; opis mówi „pszenno-żytni”
update public.products set name = 'Chleb żytni'           where id = '39b9e301-8e24-4d06-b860-49cb3cedde8a'; -- było „chleb prawdziwe żytni”
update public.products set name = 'Chleb graham'          where id = '1d390075-4832-4897-abaa-a827cabc617a';
update public.products set name = 'Chleb słonecznikowy'   where id = '675bf97e-0bbe-435d-a4c0-48a4ccc78f15';

update public.products
  set description = replace(description, 'własna recepturę', 'własną recepturę')
  where id = '37dfd17f-6730-4446-9ec9-6f3739a2676d';

update public.products
  set description = replace(description, ' maki ', ' mąki ')
  where id = '1d390075-4832-4897-abaa-a827cabc617a';

-- „0,5kg” → „0,5 kg” we wszystkich opisach
update public.products
  set description = regexp_replace(description, '(\d),(\d)kg', '\1,\2 kg', 'g')
  where description ~ '\d,\dkg';

-- ——— Bułki ———
update public.products set name = 'Rogal mleczny'             where id = '4f42f5cf-761a-41a0-8e65-b430ac37e3ca';
update public.products set name = 'Bułka z ziarnami'          where id = 'eb0ae63e-2752-44bb-8d6a-69230788f34e';
update public.products set name = 'Bułka mleczna z sezamem'   where id = 'e8479571-15ca-4eab-82b2-ec7f915e578c';
update public.products set name = 'Bułka pszenna'             where id = '24507861-1eec-451c-b539-3ee9e9b1b614'; -- było „bułka zwykła przenna”
update public.products set name = 'Grahamka'                  where id = '9770579f-9d9d-420a-bdf2-285c1fb88406';
update public.products set name = 'Bułka mleczna z makiem'    where id = 'a3efb5f8-637b-42b8-9074-88d3aaad8dfc';

commit;
