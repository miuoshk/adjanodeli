# 18 · Diagnoza: zamówienia na jutro i druk planu produkcji

> Uwaga Justyny z 1.10: „nie widzę zamówienia na jutro, planu produkcji nie mogę wydrukować”. To się dzieje po wdrożeniu 15–17, więc najpierw ustalamy przyczynę, potem poprawiamy. Zakres: ekrany Dziś, Zamówienia, Produkcja i wydruk produkcji. Bez nowych bibliotek.

## 0. Zanim zaczniesz

1. `git status`: poza nieśledzonymi `.cursor/`, `Claude outputs/`, `public/img/` dozwolone są tylko nowe i zmienione pliki w `docs/design/prompts/`. Wejdą do commita tego promptu. Cokolwiek innego: zatrzymaj się i zapytaj.
2. Na początku czatu Miłosz wklei wynik ręcznego sprawdzenia (lista w `00-KOLEJNOSC.md`, runda 3). Przeczytaj go, zanim zaczniesz szukać w kodzie.
3. Najpierw diagnoza (kroki 1–3), potem poprawki. Nie zmieniaj kodu w trakcie diagnozy.

## 1. Zgodność bazy i kodu

Stan, który już znamy (Miłosz sprawdził 1.10): migracje 0020–0024 **są** na bazie, ale wgrane przez MCP Supabase pod numerami z datą (`20260928000912 order_minimum_10pln`, `20260928211558 email_log`, `20260930205821 label_customer_info`, `20260930211619 staff_permissions`, `20260930213645 product_options_schema`, `20260930213736 product_options_order`, `20260930213747 product_options_summary`). Dlatego `npx supabase migration list` pokaże 0020–0024 jako niewgrane. **Nie uruchamiaj `npx supabase db push`**: próbowałby wgrać je drugi raz.

- Przez MCP Supabase (tylko odczyt) pobierz z bazy definicje `production_summary`, `create_order`, `has_staff_permission` i `is_staff` (`pg_get_functiondef`) i porównaj je z plikami `0023_staff_permissions.sql` i `0024_product_options.sql`. Każdą różnicę wypisz.
- Porównaj wywołania tych funkcji w kodzie z definicjami z bazy: parametry i zwracane kolumny, które czyta `getProductionData`.
- `lib/supabase/database.types.ts`: czy zgadza się z bazą (np. `production_summary` zwraca `by_option`). Jeśli `npm run db:types` nie działa (CLI nie jest zalogowane), wygeneruj typy przez MCP (`generate_typescript_types`).
- Przez MCP (tylko odczyt): ile zamówień jest na dziś, jutro i pojutrze w każdym statusie. Bez danych osobowych w odpowiedzi.

## 2. Odtworzenie na danych testowych

Lokalnie przygotuj: dwa punkty (jeden `restricted`), zamówienia opłacone na jutro (część z produktem z opcją sosu, część bez), jedno zamówienie `pending_payment` na jutro i jedno na pojutrze. Sprawdź jako owner i jako pracownik z uprawnieniem do produkcji:

- „Dziś” → „Jutro”;
- `/admin/zamowienia` → „Jutro” i lista dni;
- `/admin/produkcja?dzien=<jutro>` i `/admin/produkcja/drukuj?dzien=<jutro>` (podgląd druku w Chrome i w Safari na iPhonie lub w symulatorze);
- `/admin/paczki?dzien=<jutro>`.

Zapisz każdy błąd z terminala i z konsoli przeglądarki. Sprawdź też:

- czy „jutro” liczy się w strefie Europe/Warsaw (`warsawDateIso`) także po północy UTC;
- czy zamówienie bez płatności (`pending_payment`) i wygasłe nie znikają z widoku bez śladu. Panel powinien przy wybranym dniu pokazać krótką informację „Niezapłacone: N”, żeby było jasne, czemu ich nie ma w produkcji;
- wydruk produkcji: czy strona się renderuje przy rozbiciu na opcje (puste rozbicie, `null`), czy styl druku czegoś nie chowa, czy przycisk druku działa w Safari, czy długa tabela dzieli się na strony bez ucinania wierszy.

## 3. Raport — `docs/audyt/2026-10-jutro-i-druk-produkcji.md`

Przyczyna każdego z dwóch objawów w 2–3 zdaniach, ze wskazaniem pliku i linijki albo ustawienia. Jeśli przyczyna jest poza kodem (migracje, wdrożenie, zmienne), napisz to wprost i co dokładnie Miłosz ma zrobić.

## 4. Poprawki

Popraw to, co znalazłeś w krokach 1–3, i nic więcej. Do każdej poprawki test, który by ją złapał wcześniej (np. `lib/admin/order-days.test.ts`, test `getProductionData` dla zamówień z opcjami i bez).

## 5. Odbiór

1. `npm test`, `npm run lint`, `npm run build`.
2. Na danych z kroku 2: „Jutro” w Dziś, Zamówieniach, Produkcji i Paczkach pokazuje te same zamówienia.
3. Wydruk produkcji na jutro w Chrome i Safari: cała tabela, rozbicie sosów, nic nie ucięte.
4. Pracownik z uprawnieniem do produkcji drukuje plan; pracownik bez niego dostaje „Nie masz dostępu”.

Na koniec: przyczyna w dwóch zdaniach, zmienione pliki i jedno zdanie, co Miłosz ma sprawdzić na produkcji.
