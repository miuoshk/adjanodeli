# 20 · Kod punktu odbioru wymagany przed płatnością

> Uwaga Justyny: „zablokować przejście dalej: wpisz kod odbioru, jeśli masz, a jeśli nie, wpisz ADJANO i wtedy odbiór osobisty w siedzibie. Kobieta zamówiła i nie wpisała kodu”. Dziś pole kodu w koszyku jest opcjonalne i stoi pod listą punktów, więc da się wybrać punkt bez kodu. Zakres: wybór punktu w koszyku, zasada w `create_order`, zmiana punktu w panelu. Bez nowych bibliotek.

## 0. Zanim zaczniesz

1. `git status`: prompt 19 zacommitowany, poza nieśledzonymi `.cursor/`, `Claude outputs/`, `public/img/` czysto.
2. Przeczytaj `docs/SPEC.md` (punkty `restricted`, `pickup_point_access`, `unlock_pickup_point`), `components/shop/cart-view.tsx` (wybór punktu i `UnlockPointForm`), `components/shop/unlock-point-form.tsx`, `components/shop/account-pickup-points.tsx`, `lib/pickup/`, `app/(shop)/punkt/[kod]/page.tsx` i ostatnią definicję `create_order`.

## 1. Zasada

Klient może zamówić tylko do punktu, do którego ma dostęp. Dostęp daje: wpisany kod, link z kodem QR (`/punkt/[kod]`), domena e-maila albo właścicielka. Dotyczy to też punktów `public`.

Odbiór w piekarni to zwykły punkt z kodem `ADJANO`. Nie robimy wyjątku w kodzie. Jeśli takiego punktu nie ma, właścicielka zakłada go w **Punkty odbioru** (nazwa, adres ul. Katowicka 120, godziny odbioru, dni) i wpisuje kod `ADJANO`. Napisz to w podsumowaniu dla Miłosza.

## 2. Ustawienie

Migracja `supabase/migrations/0027_require_point_code.sql` (sprawdź numer):

- `settings.require_point_code boolean not null default true`;
- dostęp dla obecnych klientów: każdy, kto ma opłacone zamówienie w danym punkcie, dostaje do niego wpis w `pickup_point_access` (`granted_via = 'admin'`), żeby stali klienci nie musieli wpisywać kodu jeszcze raz.

`create_order`: gdy `require_point_code = true`, brak wpisu w `pickup_point_access` dla wybranego punktu kończy się `POINT_FORBIDDEN`, także dla punktu `public`. Gdy `false`, działa jak dziś.

Migrację wgraj tak jak poprzednie, przez MCP Supabase (`apply_migration`). **Nie używaj `npx supabase db push`**: historia migracji na bazie ma inne numery niż pliki. Potem typy: `npm run db:types`, a jeśli CLI nie jest zalogowane, przez MCP (`generate_typescript_types`).

Ustawienia (owner): przełącznik „Klient musi wpisać kod punktu odbioru” z jednym zdaniem wyjaśnienia. **Punkty odbioru**: przy punkcie bez kodu, gdy ustawienie jest włączone, ostrzeżenie „Bez kodu nikt nie wybierze tego punktu.”

## 3. Koszyk

Sekcja „Punkt odbioru” na górze kroków, przed dniem i płatnością.

**Klient bez dostępu do żadnego punktu:**

- jedno duże pole „Kod punktu odbioru” i przycisk „Dalej”;
- pod polem: „Kod dostajesz w pracy, np. z plakatu z kodem QR. Nie masz kodu? Wpisz **ADJANO** i odbierz zamówienie w piekarni przy ul. Katowickiej 120.”;
- dzień, płatność i przycisk płatności są nieaktywne, a przycisk mówi, czego brakuje: „Wpisz kod punktu odbioru”;
- kod jest normalizowany (wielkie litery, bez spacji), więc „adjano” i „ Adjano ” działają;
- zły kod: komunikat jak dziś, limit prób bez zmian.

**Klient z dostępem do jednego punktu:** punkt wybrany od razu, kafelek z nazwą, adresem i godzinami, link „Mam inny kod”.

**Kilka punktów:** wybór spośród nich i ten sam link.

Klient niezalogowany: najpierw logowanie (jak dziś przy kodzie), potem powrót do koszyka z wpisanym kodem.

## 4. Zmiana punktu w panelu

Na wypadek takiego zamówienia jak dziś: w szczegółach zamówienia (owner i pracownik z pełnym dostępem do Zamówień, prompt 19) przycisk „Zmień punkt odbioru”, dostępny w statusach `paid` i `in_production`.

- Wybór z aktywnych punktów, które obsługują dzień zamówienia.
- Zapis przez nową funkcję SQL `change_order_pickup_point(p_order_id, p_point_id, p_note)`: sprawdza status i dzień, zmienia punkt, dodaje dostęp klientowi do nowego punktu, wpis w `order_events`.
- Pole „Powiadom klienta” (domyślnie włączone) wysyła krótki mail „Zmieniliśmy punkt odbioru” z nowym punktem, godzinami i kodem odbioru. Wpis w `email_log` (`kind = 'pickup_point_changed'`, dopisz do checka).

## 5. Pozostałe miejsca

- `/konto`, sekcja punktów: to samo pole kodu i ta sama podpowiedź z ADJANO.
- Strona główna i „Jak to działa”: jeśli opisują wybór punktu, dopisz jedno zdanie o kodzie i ADJANO. Bez innych zmian w tekstach.
- `/admin/pomoc`: zasada kodu, punkt z kodem ADJANO, zmiana punktu w zamówieniu.
- SPEC: zasada z kroku 1, ustawienie, `create_order`, `change_order_pickup_point`.

## 6. Odbiór

1. `npm test`, `npm run lint`, `npm run build`. Test SQL: `create_order` do punktu `public` bez dostępu przy włączonym ustawieniu zwraca `POINT_FORBIDDEN`; z dostępem przechodzi; przy wyłączonym przechodzi.
2. Nowe konto klienta: koszyk nie pozwala zapłacić bez kodu. „adjano” wybiera piekarnię. Kod firmy wybiera punkt firmy.
3. Klient, który już zamawiał w punkcie, nie musi wpisywać kodu.
4. Link `/punkt/[kod]` z plakatu nadal odblokowuje punkt.
5. Panel: zmiana punktu w zamówieniu `paid`, mail do klienta, wpis w historii, etykieta i lista paczek pokazują nowy punkt.
6. Wszystko na telefonie 390 px.

Na koniec: zmienione pliki, czy punkt z kodem ADJANO istnieje w danych testowych i co Miłosz ma ustawić na produkcji.
