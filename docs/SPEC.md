# AdjanoDeli — specyfikacja produktu

## 1. Czym jest produkt
Platforma zamówień z odbiorem w punkcie dla Piekarni-Cukierni Adjano (Mikołów, ul. Katowicka 120, tradycja od 1937 r.). Klienci (głównie pracownicy sądów i urzędów w Mikołowie) zamawiają dzień wcześniej do godziny cutoff (domyślnie 20:00) na wybrany dzień roboczy, płacą online, dostają kod odbioru, odbierają paczkę w wybranym punkcie odbioru w oknie godzinowym tego punktu. Właścicielka (owner) widzi zamówienia, zestawienie produkcyjne i zarządza asortymentem, limitami i punktami. Pracownik (staff) rozwozi paczki i wydaje je po kodzie.

Nazwa marki: AdjanoDeli. Brand nadrzędny: Adjano.

## 2. Role
- customer — zalogowany klient (e-mail OTP). Widzi menu, składa zamówienia, widzi swoje zamówienia.
- staff — pracownik. Widzi listę paczek, zmienia statusy dostawy, wydaje po kodzie. Nie edytuje produktów ani ustawień.
- owner — właścicielka. Wszystko, co staff, plus produkty, limity, punkty, ustawienia, anulowanie/zwroty, eksporty.
Rola przechowywana w profiles.role. Domyślnie customer. Zmiana roli tylko przez SQL (nie ma UI do nadawania ról w Fazie 1).
Panel /admin ma osobne logowanie loginem i hasłem (/admin/logowanie). Sklep zostaje na OTP. Login to e-mail konta staff/owner w Supabase albo część przed @. Hasło jest hasłem tego użytkownika w Auth. Po zalogowaniu sesja Supabase z profiles.role = staff albo owner.

## 3. Model danych (Postgres, schema public)
Wszystkie tabele: id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), updated_at timestamptz default now() (trigger set_updated_at). RLS enabled na każdej.

### profiles
- id uuid PK, references auth.users(id) on delete cascade
- email text not null
- full_name text
- phone text
- role text not null default 'customer' check (role in ('customer','staff','owner'))
- marketing_consent boolean default false
Tworzony triggerem handle_new_user po insercie do auth.users.

### settings (dokładnie jeden wiersz, id = 1)
- id int PK check (id = 1)
- bakery_name text default 'AdjanoDeli'
- cutoff_time time not null default '20:00'
- order_weekdays int[] not null default '{1,2,3,4,5}' (ISO: 1=pon … 7=niedz) — dni, w które są odbiory
- max_days_ahead int not null default 7
- closed_dates date[] not null default '{}' — święta, urlopy
- pending_order_ttl_minutes int not null default 30
- max_qty_per_item int not null default 15 — powyżej tego pokazujemy formularz zamówienia specjalnego
- owner_email text not null
- owner_phone text
- currency text not null default 'PLN'

### pickup_points
- name text not null (np. "Sąd Rejonowy w Mikołowie")
- slug text unique not null
- address text not null
- description text (np. "portiernia, wejście główne")
- pickup_from time not null (np. 08:00)
- pickup_to time not null (np. 09:00)
- weekdays int[] not null default '{1,2,3,4,5}'
- is_active boolean not null default true
- sort_order int not null default 0

### categories
- name text not null, slug text unique not null, sort_order int default 0, is_active boolean default true

### products
- category_id uuid references categories
- name text not null
- slug text unique not null
- description text
- price_grosze int not null check (price_grosze >= 0)
- image_path text (ścieżka w bucket "products")
- allergens text[] not null default '{}'
- tags text[] not null default '{}' (np. 'keto', 'wege')
- daily_cap_default int not null default 20 — domyślny dzienny limit
- weekdays int[] not null default '{1,2,3,4,5,6,7}' — dni tygodnia, w które produkt jest w sprzedaży
- is_new boolean default false
- is_active boolean not null default true
- sort_order int not null default 0

### product_day_overrides
- product_id uuid references products on delete cascade
- day date not null
- cap int (null = użyj daily_cap_default)
- is_available boolean not null default true
- unique (product_id, day)

### daily_stock (licznik rezerwacji; tworzony leniwie przez create_order)
- product_id uuid references products on delete cascade
- day date not null
- cap int not null
- reserved_qty int not null default 0 check (reserved_qty >= 0)
- unique (product_id, day)

### orders
- order_number bigint generated always as identity unique — numer dla ludzi (np. #1043)
- user_id uuid references profiles not null
- pickup_point_id uuid references pickup_points not null
- pickup_date date not null
- status text not null default 'pending_payment' check (status in ('pending_payment','paid','in_production','delivered','picked_up','expired','cancelled','refunded'))
- pickup_code text — 4 znaki z alfabetu ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (bez 0,O,1,I), unikalny w obrębie pickup_date; generowany przy tworzeniu, aktywny po opłaceniu
- customer_name text not null, customer_phone text, customer_email text not null (snapshot z profilu)
- note text (uwagi klienta, max 200 znaków)
- subtotal_grosze int not null
- discount_grosze int not null default 0
- total_grosze int not null
- stripe_checkout_session_id text unique
- stripe_payment_intent_id text
- expires_at timestamptz — dla pending_payment
- paid_at, delivered_at, picked_up_at, cancelled_at timestamptz
- invoice_requested boolean default false
- invoice_nip text
- invoice_company text
- invoice_address text
- unique (pickup_date, pickup_code)

### order_items
- order_id uuid references orders on delete cascade
- product_id uuid references products
- product_name text not null (snapshot)
- unit_price_grosze int not null (snapshot)
- qty int not null check (qty > 0)

### special_requests (zamówienia specjalne / duże)
- name text, phone text, email text, wanted_date date, description text not null, status text default 'new' check (status in ('new','contacted','closed'))

### order_events (log)
- order_id uuid references orders on delete cascade, from_status text, to_status text, actor uuid (profiles.id, null = system), note text

## 4. Funkcje SQL (single source of truth)
- warsaw_now() returns timestamptz — now() w strefie Europe/Warsaw (do użycia w innych funkcjach).
- available_pickup_dates() returns setof date — zwraca daty, na które można teraz zamawiać: zaczynając od jutra (jeśli teraz < cutoff) lub pojutrza (jeśli teraz >= cutoff), przez max_days_ahead dni, tylko dni z order_weekdays, z pominięciem closed_dates. Zwraca tylko daty, dla których istnieje co najmniej jeden aktywny pickup_point obsługujący ten dzień tygodnia.
- product_availability(p_day date) returns table(product_id uuid, cap int, reserved int, remaining int, is_available boolean) — dla każdego aktywnego produktu: cap = override.cap ?? daily_cap_default, reserved = daily_stock.reserved_qty ?? 0, is_available = false, gdy extract(isodow from p_day) nie należy do products.weekdays; w przeciwnym razie override.is_available ?? true.
- create_order(p_pickup_point_id uuid, p_pickup_date date, p_items jsonb, p_note text) returns uuid — SECURITY DEFINER, wykonywana jako zalogowany user (auth.uid()). W jednej transakcji: sprawdza, że pickup_date jest w available_pickup_dates() i punkt obsługuje ten dzień; dla każdego itemu robi upsert do daily_stock (cap z product_availability), blokuje wiersz (FOR UPDATE), sprawdza reserved_qty + qty <= cap oraz qty <= settings.max_qty_per_item, inkrementuje reserved_qty; liczy sumy ze snapshotem cen; generuje pickup_code unikalny dla pickup_date (pętla z retry); wstawia orders (expires_at = now() + pending_order_ttl_minutes) i order_items; loguje order_events. Przy braku limitu rzuca wyjątek z komunikatem 'OUT_OF_STOCK:<product_id>:<remaining>'. p_items to jsonb array [{product_id, qty}].
- release_order_stock(p_order_id uuid) — dekrementuje daily_stock o ilości z order_items (nie poniżej 0). Używana przy expired/cancelled.
- expire_pending_orders() — ustawia status expired dla pending_payment z expires_at < now(), wywołuje release_order_stock, loguje event. Uruchamiana przez pg_cron co 5 minut.
- set_order_status(p_order_id uuid, p_status text, p_note text) — dla staff/owner; sprawdza dozwolone przejścia (patrz sekcja 5), ustawia timestampy, loguje order_events. Przy cancelled wywołuje release_order_stock.
- production_summary(p_day date) returns table(product_id uuid, product_name text, total_qty int, by_point jsonb) — sumy per produkt z zamówień w statusach paid, in_production, delivered, picked_up na dany dzień; by_point = {pickup_point_name: qty}.

## 5. Statusy i dozwolone przejścia
pending_payment → paid (tylko webhook Stripe, przez service_role)
pending_payment → expired (tylko expire_pending_orders)
pending_payment → cancelled (owner)
paid → in_production (staff/owner)
paid → cancelled (owner) → refunded (owner, po zwrocie w Stripe)
paid → cancelled (klient, do cutoff dnia poprzedzającego pickup_date, gdy settings.customer_cancellation_enabled) → refunded (Stripe Refund API, albo owner ręcznie)
in_production → delivered (staff/owner)
delivered → picked_up (staff/owner, po kodzie)
in_production → cancelled (owner)
Wszystko inne: zabronione, set_order_status rzuca wyjątek.
Klient może anulować opłacone zamówienie (status paid) do cutoff dnia poprzedzającego pickup_date (czyli do momentu, w którym Justyna zaczyna wiedzieć, co produkować). Anulowanie: paid → cancelled → refunded automatycznie przez Stripe Refund API. settings.customer_cancellation_enabled boolean default true.

## 6. Reguły biznesowe
- Cutoff: settings.cutoff_time w Europe/Warsaw. Decyduje available_pickup_dates(), nigdy klient.
- Limit dzienny per produkt. Menu pokazuje remaining; przy remaining <= 5 pokazuje "zostało N"; przy 0 produkt widoczny jako "wyprzedane na ten dzień", nie do dodania.
- Ilość jednego produktu w zamówieniu <= settings.max_qty_per_item. Powyżej: link do formularza zamówienia specjalnego.
- Zamówienie pending_payment żyje pending_order_ttl_minutes (30). Sesja Stripe Checkout ma expires_at = 30 minut.
- Po opłaceniu: e-mail z kodem odbioru, QR, punktem, oknem godzinowym, listą pozycji. Po delivered: e-mail "Twoja paczka czeka w [punkt] do [pickup_to]".
- Klient może anulować opłacone zamówienie (status paid) do cutoff dnia poprzedzającego pickup_date (czyli do momentu, w którym Justyna zaczyna wiedzieć, co produkować). Anulowanie: paid → cancelled → refunded automatycznie przez Stripe Refund API. settings.customer_cancellation_enabled boolean default true. Jeśli pickup_date to poniedziałek, granica to niedziela o cutoff (nie piątek).
- Zwroty po anulowaniu klienta idą przez Stripe Refund API; gdy się nie uda — zamówienie zostaje cancelled, owner dostaje mail „Zwrot ręczny wymagany”. Owner może też zwrócić ręcznie i ustawić refunded.
- Klient może zaznaczyć w koszyku 'Chcę fakturę na firmę' i podać NIP, nazwę, adres. Dane trafiają do zamówienia; fakturę wystawia właścicielka poza systemem. NIP walidowany (10 cyfr + suma kontrolna).

## 7. Płatności (Stripe)
- Stripe Checkout, mode: payment, currency pln, payment_method_types: ['blik','p24','card'], locale 'pl'.
- line_items: jedna pozycja per order_item (name, unit_amount = unit_price_grosze, quantity). Jeśli discount_grosze > 0 (Faza 2): coupon amount_off tworzony ad hoc.
- metadata: { order_id }. client_reference_id = order_id. expires_at = now + 30 min.
- success_url: /zamowienie/{order_id}?status=success, cancel_url: /koszyk?cancelled=1.
- Webhook /api/stripe/webhook: checkout.session.completed → orders.status = paid, paid_at, stripe_payment_intent_id (idempotentnie: jeśli już paid, nic). checkout.session.expired → jeśli nadal pending_payment: expired + release. Weryfikacja podpisu obowiązkowa.

## 8. Autoryzacja i RLS
- Logowanie sklepu: Supabase Auth, e-mail OTP (6 cyfr), shouldCreateUser: true. Po pierwszym logowaniu, jeśli profiles.full_name jest null → przekierowanie na /konto/uzupelnij (imię, telefon).
- Logowanie panelu /admin: /admin/logowanie, login + hasło z konta staff/owner w Supabase Auth (funkcja admin_login_email). Nie używa OTP ani zmiennych ADMIN_*. Niezalogowany na /admin/* → /admin/logowanie.
- Helper is_staff() returns boolean — true dla role in ('staff','owner'); is_owner() — role = 'owner'.
- RLS:
  - profiles: select/update własny wiersz; staff select wszystkie.
  - settings, pickup_points (is_active), categories (is_active), products (is_active): select dla wszystkich (anon też — menu jest publiczne). Update/insert/delete: owner.
  - product_day_overrides, daily_stock: select wszyscy; write owner (daily_stock modyfikują wyłącznie funkcje SECURITY DEFINER).
  - orders, order_items, order_events: select własne (user_id = auth.uid()) lub staff; insert wyłącznie przez create_order; update wyłącznie przez set_order_status / webhook (service_role).
  - special_requests: insert anon i zalogowani; select/update staff.
- Ścieżki /admin/* (oprócz /admin/logowanie) chronione po stronie serwera helperem requireRole('staff' | 'owner') w layoucie i w każdej server action. Brak sesji → /admin/logowanie.

## 9. Routing (App Router)
Sklep, grupa (shop):
- / — menu (dzień docelowy wybierany u góry, domyślnie pierwsza dostępna data)
- /koszyk — koszyk + wybór punktu odbioru + dnia + uwagi → "Przejdź do płatności"
- /zamowienie/[id] — potwierdzenie/status zamówienia, kod odbioru, QR
- /moje-zamowienia — historia
- /logowanie — e-mail → kod
- /konto, /konto/uzupelnij — profil
- /zamowienie-specjalne — formularz dużych zamówień
- /regulamin, /polityka-prywatnosci
Admin:
- /admin/logowanie — login i hasło do panelu (nie OTP)
- /admin — dziś/jutro: liczby (zamówień, paczek per punkt, do produkcji), szybkie akcje
- /admin/zamowienia — lista z filtrami (dzień, punkt, status), podgląd, zmiana statusu
- /admin/produkcja — zestawienie produkcyjne na dzień + wersja do druku (/admin/produkcja/drukuj?day=)
- /admin/paczki — lista paczek per punkt na dzień, "Dowiezione" per punkt (bulk delivered), wersja do druku etykiet
- /admin/wydawanie — mobilny ekran: wpisz/zeskanuj kod → szczegóły → "Wydano"
- /admin/produkty, /admin/produkty/[id] — CRUD, zdjęcie, limit domyślny, alergeny
- /admin/limity — kalendarz: per dzień nadpisanie limitu/dostępności (blokada dzienna)
- /admin/punkty-odbioru — CRUD
- /admin/ustawienia — settings
- /admin/statystyki — zakres dat, kafelki, wykresy, top produkty, punkty, wyprzedania (owner)
- /admin/zamowienia-specjalne — lista special_requests
API:
- /api/stripe/webhook (POST)
- /api/cron/expire (GET, nagłówek Authorization: Bearer CRON_SECRET) — zapas na wypadek braku pg_cron

## 10. Design
- Paleta (CSS variables w app/globals.css):
  --adj-khaki: #4B4A2F (nawigacja, stopka, tła kart w adminie)
  --adj-khaki-light: #6B6A4A
  --adj-cream: #F1EADB (tło strony)
  --adj-cream-dark: #E6DCC6 (bordery, separatory)
  --adj-red: #C4161C (wyłącznie CTA i akcenty: przycisk "Zamawiam", badge "zostało 3", kod odbioru)
  --adj-red-dark: #9E1116 (hover)
  --adj-gold: #B8975A (cienkie linie, ozdobniki — jak złota linia na opakowaniu)
  --adj-ink: #2B2A1F (tekst)
- Fonty (next/font/google): nagłówki Cormorant Garamond (600/700), tekst Inter (400/500/600). Logotyp "Adjano" wyłącznie jako obraz (public/brand/adjano-logo.svg lub .png), nigdy jako tekst w foncie script.
- Rozmiar bazowy tekstu 16px, na mobile przyciski min. 48px wysokości. Użytkownicy to często osoby 45+, na telefonie, w pracy — czytelność ważniejsza niż efekt.
- Mobile-first. Menu to lista kart produktów z ceną, opisem, "zostało N", przyciskiem +/-.
- Ton tekstów: krótko, ciepło, konkretnie. Przykład dobry: "Zamów do 20:00, odbierz jutro w pracy." Przykład zły: "Odkryj wyjątkowe smaki tradycji w nowoczesnej odsłonie."
- Maskotka Janosz (public/brand/janosz.png) tylko w: ekranie po opłaceniu ("Janosz pakuje Twoje zamówienie"), pustym koszyku, 404.

## 11. E-maile (Resend, szablony w lib/email/templates/)
- order-paid: temat "Zamówienie #{order_number} — kod odbioru {code}". Treść: kod dużą czcionką, QR (data URL), punkt, adres, okno godzinowe, data, lista pozycji, suma, telefon do piekarni.
- order-delivered: temat "Twoja paczka czeka — {punkt}". Treść: kod, punkt, do której godziny.
- special-request-owner: do owner_email, nowe zamówienie specjalne.
Nadawca: EMAIL_FROM (np. "AdjanoDeli <zamowienia@adjanodeli.pl>").

## 12. Poza zakresem (nie implementować bez wyraźnego polecenia)
- Kasa fiskalna / paragony (właścicielka obsługuje po swojej stronie).
- Dostawa pod adres, kurierzy, mapy, geolokalizacja.
- Natywne aplikacje mobilne (PWA w Fazie 3).
- Płatność przy odbiorze.
- Wielojęzyczność.

## 13. Lojalność
Każdy opłacony produkt (1 szt. = 1 pieczątka) daje pieczątkę. Pieczątki wygasają 60 dni po zdobyciu (rolling). Progi liczone z aktywnych (niewygasłych, nieskonsumowanych) pieczątek:
- 10 pieczątek → voucher PCT10 (−10% na następne zamówienie),
- 20 pieczątek → voucher PCT50 (−50% na następne zamówienie, max 40,00 zł rabatu),
- 30 pieczątek → voucher ONE_GROSZ (najtańszy produkt w zamówieniu za 1 grosz), po czym wszystkie aktywne pieczątki są konsumowane (licznik startuje od zera).
Voucher jest ważny 30 dni od wydania, jeden voucher na zamówienie, nie łączy się. Rabat liczony od subtotal_grosze; total po rabacie musi wynosić ≥ 200 gr (minimum Stripe dla PLN) — jeśli nie, UI prosi o dodanie produktu. Pieczątki naliczane w mark_order_paid. Anulowanie/zwrot zamówienia usuwa pieczątki z tego zamówienia i, jeśli voucher został użyty, przywraca go (jeśli nie wygasł).
Tabele: loyalty_stamps (user_id, order_id, earned_at, expires_at, consumed_at null), loyalty_vouchers (user_id, type check in ('PCT10','PCT50','ONE_GROSZ'), issued_at, expires_at, used_order_id null, restored_from_order_id null). RLS: select własne; write tylko funkcje SECURITY DEFINER.
Funkcje: loyalty_status(p_user) → {active_stamps, next_threshold, vouchers[]}; grant_stamps_for_order(p_order_id) (wołana z mark_order_paid; po dodaniu sprawdza progi i wydaje voucher — próg wydaje voucher tylko raz: zapamiętaj w loyalty_vouchers, że dla danego "cyklu" próg 10/20 był już wydany, przez kolumnę cycle_started_at na stamps lub prościej: voucher PCT10 wydawany, gdy liczba aktywnych = dokładnie 10 po naliczeniu, PCT50 gdy przekracza 20 pierwszy raz — rozwiąż to deterministycznie i opisz w komentarzu); create_order dostaje nowy parametr p_voucher_id uuid default null — waliduje voucher (własny, ważny, nieużyty), liczy discount_grosze, oznacza used_order_id; release/cancel przywraca.
UI: /konto sekcja "Pieczątki": pasek 7/10, lista voucherów. W koszyku: "Masz voucher −10%" z przełącznikiem użycia. W menu (header) mały licznik pieczątek.
Stripe: przy discount_grosze > 0 utwórz coupon (amount_off = discount_grosze, currency pln, duration once, name "Voucher AdjanoDeli") i przekaż w discounts.

## 14. Stałe zamówienia
Tabela standing_orders: user_id, name (np. "Moje śniadanie"), pickup_point_id, weekdays int[], items jsonb [{product_id, qty}], note, is_active, remind boolean default true. RLS: własne. Max 3 na użytkownika.
Codziennie o 17:00 (Europe/Warsaw) cron wysyła e-mail "Zamówić jak zwykle na jutro?" do użytkowników, którzy mają aktywne standing_order obejmujące dzień tygodnia pierwszej dostępnej daty i NIE mają jeszcze opłaconego zamówienia na tę datę. Mail zawiera listę pozycji, sumę i przycisk "Zamawiam" → /zamow-jak-zwykle?s={id}&d={date} (wymaga logowania) → strona wypełnia koszyk (sprawdzając dostępność, pomijając niedostępne z informacją) i przekierowuje do /koszyk. Nie ma automatycznego obciążenia.
Cron: Vercel Cron (vercel.json) → GET /api/cron/standing-reminders, Authorization Bearer CRON_SECRET. Harmonogram w UTC: 15:00 (czas letni) — dodaj komentarz o zmianie na 16:00 zimą albo zaplanuj dwa wpisy i w kodzie sprawdzaj, czy w Warszawie jest ~17:00 (tolerancja 30 min), żeby nie wysłać dwa razy.
UI: /konto/stale-zamowienia — lista, tworzenie z aktualnego koszyka ("Zapisz jako stałe zamówienie" w koszyku po opłaceniu — na stronie zamówienia paid), edycja dni i punktu, włącz/wyłącz.
