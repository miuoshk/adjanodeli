# Audyt: jutro i druk planu produkcji (2026-10-01)

Justyna, 1 października: nie widzi zamówienia na jutro i nie może wydrukować planu produkcji. Sprawdzone na bazie i w logach z tego dnia. Zamówienia opłacone na 2 października w bazie są (dwa, status `paid`).

## Zgodność bazy i kodu

`npx supabase migration list` zwraca 401 (`LegacyDbConfigLoginRoleStatusError`). Nie uruchamiać `npx supabase db push`: SQL z lokalnych `0022`, `0023` i `0024` jest już na zdalnej bazie, pod innymi numerami (`label_customer_info`, `staff_permissions`, `product_options_schema` / `product_options_order` / `product_options_summary`). Ponowny push próbowałby je nałożyć drugi raz.

Sygnatury zgadzają się z kodem i z `lib/supabase/database.types.ts` (uzupełnione ręcznie przy opcjach, nie przez `npm run db:types`):

- `create_order(p_pickup_point_id uuid, p_pickup_date date, p_items jsonb, p_note text, p_discount jsonb, p_invoice jsonb) → uuid`
- `has_staff_permission(p text) → boolean`
- `production_summary(p_day date) → product_id, product_name, total_qty, by_point, by_option`

`getProductionData` woła `rpc("production_summary", { p_day: day })` i czyta te kolumny. `place-order.ts` wysyła `option_ids`.

## Nie widać zamówienia na jutro

Przyczyna jest w `production_summary`, nie w dacie „jutro”. Po opcjach produktu (migracja 0024, ok. 30 września) zestawienie liczy rozbicie sosów przez `max(oa.by_option)`, a `by_option` jest typu `jsonb`. W Postgresie nie ma `max(jsonb)` (błąd `42883`). Log z 1 października, 20:43 UTC: POST `/rest/v1/rpc/production_summary` z treścią długości 22 bajtów, czyli `{"p_day":"2026-10-02"}`, kończy się 404, a w logu Postgresa jest `function max(jsonb) does not exist`. Wywołanie anonimowe kończy się wcześniej na `FORBIDDEN`, bo `is_staff()` jest przed tym zapytaniem, więc błąd widać tylko u właścicielki i pracownika.

`getProductionData` w `lib/admin/queries.ts` ignorowało `summaryResult.error` i brało `data ?? []`. Tabela produkcji i wydruk dostawały puste wiersze i pisały „Brak zamówień na ten dzień”, choć osobne zapytanie o zamówienia nadal liczyło opłacone pozycje w nagłówku. Zamówienia na liście i na „Dziś → Jutro” idą z tabeli `orders`, nie z tej funkcji, więc same zamówienia w bazie nie zniknęły.

`warsawDateIso` liczy dzień w `Europe/Warsaw`. To nie był powód: wołanie dotyczyło właśnie 2 października.

## Nie można wydrukować planu

Ta sama funkcja karmi `/admin/produkcja/drukuj`. Strona się otwierała, ale tabela była pusta, więc drukowała komunikat o braku zamówień, a nie plan. CSS druku nie chowa tabeli: w `@media print` znika tylko `.no-print` (przycisk). Przycisk to `window.print()` po kliknięciu. `break-inside: avoid` jest na wierszach; przy pustej tabeli nie było czego ucinać. Po naprawie funkcji wiersze z opcjami i bez (puste `[]` albo `null`) składają się w `optionBreakdown` i nie znikają z planu.

Zamówienia `pending_payment` i `expired` celowo nie wchodzą do produkcji ani paczek. Bez dopisku znikały bez śladu. Przy wybranym dniu panel pokazuje „Niezapłacone: N”, gdy takie są.

## Co jest na bazie

Funkcja na zdalnej bazie została podmieniona migracją `production_summary_jsonb`: `max(oa.by_option::text)` zamiast `max(jsonb)`. Lokalny plik to `supabase/migrations/0025_production_summary_jsonb.sql`. Nie robić `db push` dla starszych plików.
