# 17 · Opcje produktu, np. wybór sosu

> Uwaga Justyny: „nowy produkt: wybór sosu, nie można przejść dalej bez wybrania sosu”. Zakres: grupy opcji przy produkcie (wymagane albo nie, z dopłatą albo bez), wybór w sklepie i ta informacja wszędzie tam, gdzie widać pozycje zamówienia. Uruchamiasz po 15 i 16. Bez nowych bibliotek.

To największa zmiana w tej rundzie. Dotyka koszyka, `create_order`, maili, produkcji i etykiet. Najpierw audyt, potem zmiany, w kolejności kroków.

## 0. Zanim zaczniesz

1. `git status`: prompty 15 i 16 zacommitowane, poza nieśledzonymi `.cursor/`, `Claude outputs/`, `public/img/` czysto.
2. Przeczytaj `docs/SPEC.md` §3 (products, order_items), §4 (`create_order`), §14 (stałe zamówienia).
3. Znajdź **ostatnią** definicję `create or replace function public.create_order` w `supabase/migrations/` i pracuj na niej. Nie gub niczego z obecnej logiki: limity (`daily_stock`), czas przygotowania, rabaty, vouchery, faktura, minimum zamówienia, widoczność punktów.

## 1. Audyt — `docs/audyt/2026-10-opcje-produktu.md`

Wypisz każde miejsce, które czyta albo pokazuje pozycje zamówienia lub koszyka, z plikiem i funkcją. Co najmniej:

- koszyk (`lib/store/cart.ts`, kluczem jest dziś `productId`), karta produktu i przycisk dodawania, widok koszyka;
- `lib/orders/place-order.ts` (schemat `items`) i `create_order` (`p_items`);
- `order_items` i miejsca, które je czytają: strona zamówienia klienta, „Moje zamówienia”, `/konto`, mail `order-paid`, panel zamówienia, eksport CSV (`app/api/admin/orders/export`), produkcja (`production_summary`), paczki i etykiety, statystyki;
- stałe zamówienia: `standing_orders.items`, `lib/standing-orders/fill-cart.ts`, `send-reminders.ts`, `/zamow-jak-zwykle`.

Przy każdym miejscu jedno zdanie, co trzeba zmienić.

## 2. Model danych

Migracja `supabase/migrations/0024_product_options.sql` (sprawdź, czy numer jest wolny):

- `product_option_groups`: `id uuid pk`, `product_id uuid not null references products on delete cascade`, `name text not null` (np. „Sos”), `is_required boolean not null default true`, `max_choices int not null default 1 check (max_choices >= 1)`, `sort_order int not null default 0`;
- `product_options`: `id uuid pk`, `group_id uuid not null references product_option_groups on delete cascade`, `name text not null`, `price_delta_grosze int not null default 0 check (price_delta_grosze >= 0)`, `is_active boolean not null default true`, `sort_order int not null default 0`;
- `order_items.options jsonb not null default '[]'`: zdjęcie stanu w chwili zamówienia `[{ "group_id", "group_name", "option_id", "option_name", "price_delta_grosze" }]`. `unit_price_grosze` zawiera już dopłaty;
- RLS: odczyt aktywnych opcji dla wszystkich (jak produkty), zapis tylko owner.

`create_order`:

- `p_items` przyjmuje `[{ product_id, qty, option_ids: uuid[] }]` (brak `option_ids` = pusta lista, żeby stare wywołania działały);
- dla każdej pozycji sprawdza: każda opcja należy do grupy tego produktu i jest aktywna; każda wymagana grupa ma wybór; w grupie nie więcej niż `max_choices`. Błędy: `OPTIONS_REQUIRED:<product_id>:<nazwa grupy>`, `OPTIONS_INVALID:<product_id>`;
- cena jednostkowa = obecna cena efektywna produktu + suma dopłat;
- ten sam produkt z różnymi opcjami to osobne wiersze `order_items`;
- limity dzienne liczone per produkt, jak dziś (suma ilości ze wszystkich wariantów).

`production_summary`: dodatkowo rozbicie per kombinacja opcji dla produktów, które mają opcje.

Potem `npx supabase db push` i `npm run db:types`. Test SQL w `supabase/tests`: brak wymaganej opcji, opcja z innego produktu, za dużo wyborów, poprawne zamówienie z dopłatą.

## 3. Panel: opcje w formularzu produktu

`/admin/produkty/[id]` i `/admin/produkty/nowy`, sekcja „Opcje do wyboru”:

- „Dodaj grupę”: nazwa (np. „Sos”), „Wymagane” (domyślnie tak), „Ile można wybrać” (domyślnie 1);
- w grupie lista opcji: nazwa, dopłata w zł (domyślnie 0), aktywna; kolejność strzałkami góra / dół;
- opcji użytej w zamówieniach nie usuwasz, tylko wyłączasz (stare zamówienia mają zdjęcie stanu);
- podgląd: tak zobaczy to klient.

## 4. Sklep: wybór opcji

- Produkt z opcjami: „Dodaj do koszyka” otwiera okno (na telefonie od dołu ekranu) z grupami: jeden wybór = pola jednokrotnego wyboru, więcej = pola wielokrotnego wyboru z limitem. Wymagana grupa ma dopisek „wymagane”.
- Cena w przycisku liczy się na żywo z dopłatami.
- Dopóki wymagana grupa nie jest wybrana, przycisk jest nieaktywny i mówi, czego brakuje: „Wybierz: Sos”.
- Produkt bez opcji działa jak dziś, jednym kliknięciem.

Koszyk (`lib/store/cart.ts`):

- klucz pozycji = `productId` + posortowane `optionIds`; w pozycji `optionIds`, nazwy opcji do wyświetlenia i cena jednostkowa z dopłatami;
- zmiana ilości i usuwanie po kluczu pozycji;
- stare koszyki z pamięci przeglądarki (bez `optionIds`) wczytują się jako pusta lista opcji;
- jeśli produkt w koszyku wymaga opcji, a pozycja jej nie ma (np. opcje dodano później): pozycja z komunikatem „Wybierz sos” i przyciskiem „Wybierz”, płatność zablokowana do czasu poprawki;
- pod nazwą produktu mała linijka „Sos: czosnkowy”.

`place-order.ts`: nowy schemat pozycji i czytelne komunikaty dla nowych błędów.

## 5. Wszędzie, gdzie widać pozycje

Format: `2× Kanapka z szynką (sos czosnkowy)`, przy kilku grupach nazwy po przecinku.

- strona zamówienia klienta, „Moje zamówienia”, `/konto`;
- mail `order-paid`;
- panel: szczegóły zamówienia, lista, eksport CSV (nowa kolumna „Opcje”);
- **Produkcja**: wiersz produktu z sumą, a pod nim rozbicie „czosnkowy 3 · pomidorowy 2”, także w wydruku produkcji;
- **etykiety** w obu formatach (pilnuj mieszczenia się, `fit-label.ts`).

## 6. Stałe zamówienia

- `standing_orders.items`: pozycje z `option_ids`. Zapis stałego zamówienia z koszyka zapisuje też opcje.
- `fill-cart.ts` i przypomnienie: opcja wyłączona albo brak wymaganej grupy → pozycja pominięta z informacją „Kanapka z szynką: wybierz sos jeszcze raz”.

## 7. SPEC

§3 (nowe tabele, `order_items.options`), §4 (`create_order`, `production_summary`), §9 (okno wyboru), §14 (stałe zamówienia z opcjami).

## 8. Odbiór

1. `npm test`, `npm run lint`, `npm run build`, testy SQL.
2. W panelu produkt testowy z grupą „Sos” (wymagane, 1 wybór): czosnkowy 0 zł, pomidorowy +2 zł, trzecia opcja wyłączona.
3. W sklepie bez wyboru sosu nie da się dodać. Dodaj dwa razy z różnymi sosami: dwie pozycje w koszyku, cena z dopłatą się zgadza.
4. Wywołanie `create_order` bez opcji (np. z konsoli) zwraca `OPTIONS_REQUIRED`.
5. Płatność testowa: mail, zamówienie klienta, panel, CSV, Produkcja z rozbiciem, etykiety pokazują sos.
6. Stałe zamówienie z sosem, potem wyłącz ten sos: „Zamów jak zwykle” pomija pozycję z komunikatem.
7. Produkt bez opcji zachowuje się jak przed zmianą.
8. Wszystko na telefonie 390 px.

Na koniec: zmienione pliki, raport z kroku 1 i jedno zdanie, jak przetestować.
