# 15 · Dzień w Zamówieniach i dane klienta na etykiecie

> Uwagi Justyny: „nie mogę zobaczyć zamówień tylko na jutro, najwcześniej da się wybrać piątek” oraz „mail zniknął z etykiety”. Zakres: filtr dnia w panelu i ustawienie danych klienta na etykiecie. Bez nowych bibliotek.

## 0. Zanim zaczniesz

1. `git status`: poza nieśledzonymi `.cursor/`, `Claude outputs/`, `public/img/` dozwolone są tylko nowe i zmienione pliki w `docs/design/prompts/`. Wejdą do commita tego promptu. Cokolwiek innego: zatrzymaj się i zapytaj.
2. Przeczytaj `docs/SPEC.md` §9 i `lib/admin/queries.ts` (`getAdminFilterOptions`, `getNearestOrderDay`).

## 1. Przyczyna błędu z dniem (zapisz ją w opisie commita)

`getAdminFilterOptions` bierze listę dni z `available_pickup_dates()`. To funkcja dla klientów: zwraca dni, na które **jeszcze można zamówić**. Po godzinie granicznej jutra już tam nie ma, więc panel nie pozwala wybrać jutra, choć zamówienia na jutro są i trzeba je zobaczyć.

## 2. Filtr dnia w Zamówieniach

- `getAdminFilterOptions`: lista dni = dziś, jutro i wszystkie `pickup_date` zamówień w statusach `paid`, `in_production`, `delivered`, `picked_up` od 14 dni wstecz do 30 dni naprzód. Bez duplikatów, rosnąco. Przy każdym dniu liczba zamówień, np. „czwartek, 1 października (12)”.
- Na górze `/admin/zamowienia` te same przyciski co w Produkcji i Paczkach: „Dziś”, „Jutro”, „Wybierz datę” (`AdminDayPicker`). Lista w filtrze zostaje jako dodatkowy wybór.
- Domyślny dzień bez parametru: `getNearestOrderDay()`, jak w innych ekranach.
- Przejrzyj pozostałe użycia `available_pickup_dates` po stronie panelu (`lib/admin/owner-queries.ts`). Zostaw je tylko tam, gdzie chodzi o dni do zamawiania (np. limity na przyszłe dni). Tam, gdzie chodzi o oglądanie zamówień, zamień jak wyżej. W opisie wypisz, co zmieniłeś i co zostawiłeś.

## 3. Dane klienta na etykiecie — ustawienie

Migracja `supabase/migrations/0022_label_customer_info.sql` (sprawdź, czy numer jest wolny): w `settings` kolumna `label_customer_info text not null default 'masked_email' check (label_customer_info in ('masked', 'masked_email', 'full'))`. Potem `npx supabase db push` i `npm run db:types`.

Ustawienia (owner), karta „Etykiety”, trzy opcje z podglądem jednej etykiety na żywo:

- **Skrócone imię i nazwisko** — `Ju**** Ko******` (tak jak dziś);
- **Skrócone imię i nazwisko + skrócony e-mail** — dodatkowo `ju•••@gmail.com` (domyślnie);
- **Pełne dane** — pełne imię, nazwisko i e-mail.

Pod opcjami jedno zdanie: „Paczki stoją w punktach, gdzie widzą je inni. Pełne dane wybierz tylko, jeśli naprawdę ich potrzebujesz.”

`lib/labels/`: nowa funkcja `maskEmail` (pierwsze 2 znaki części przed @, potem `•••`, potem `@domena`; przy części krótszej niż 3 znaki: pierwszy znak + `•••`), z testami. Etykieta w obu formatach (etykieciarka i A4) pokazuje dane według ustawienia. E-mail jako osobna linijka pod nazwiskiem, rozmiar jak linijka punktu. Nic nie może wyjść poza etykietę (sprawdź `fit-label.ts`).

## 4. Pomoc i SPEC

- `/admin/pomoc`: w sekcji o etykietach jedno zdanie o tym ustawieniu i gdzie je zmienić.
- SPEC §3 (settings) i §9: nowe pole i zachowanie filtra dnia.

## 5. Odbiór

1. `npm test`, `npm run lint`, `npm run build`.
2. Zamówienie testowe na jutro, godzina po terminie zamówień: `/admin/zamowienia` → „Jutro” pokazuje je, w liście dni jutro jest z liczbą zamówień.
3. Trzy ustawienia etykiety: podgląd w Ustawieniach i wydruk (etykieciarka i A4) się zgadzają. Długi e-mail się mieści.

Na koniec: zmienione pliki i jedno zdanie, jak przetestować.
