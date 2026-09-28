# Dzień dostawy — 28 września 2026

Przejście dnia tak, jak robi je Justyna i kierowca, zanim doszedł plan na „Dziś” i przycisk „Jestem na miejscu”. Napisy przycisków są z kodu ekranów. Dane w bazie tego wieczoru: 28 września, Piekarnia Adjano — 1 zamówienie `paid` i 2 `picked_up`; 29 września, Sąd Rejonowy w Mikołowie 12 — 2 zamówienia `paid`. Nie ma osobnego zestawu „dwa punkty po 3 zamówienia”. Ścieżka jest ta sama przy dowolnej liczbie paczek. Na telefonie (390 px) panel ma menu z linkami Dziś, Produkcja, Paczki, Wydawanie. Na komputerze te same linki są w bocznym menu.

## 1. Wieczór — godzina graniczna

Ekranu „zamknij dzień” nie ma. Godzina jest w `settings.cutoff_time` (domyślnie 20:00, Europe/Warsaw). `available_pickup_dates` przed tą godziną puszcza odbiór od jutra, po niej od pojutrza. Istniejące zamówienia `paid` zostają `paid`. Nic się nie przepisuje i żaden mail nie wychodzi.

Cron `/api/cron/expire` woła `expire_pending_orders` i wygasza tylko `pending_payment` po `expires_at` (około 30 minut bez płatności). Nie rusza opłaconych.

Jeśli krok się pominie: nie ma czego pominąć. Po 20:00 na ten dzień i tak nie da się już złożyć zamówienia z leadem 1 dnia.

## 2. Rano — start produkcji

Ekran: `/admin` („Dziś”). Przycisk w „Szybkich akcjach”: **„Start produkcji dnia”**. Gdy nie ma `paid` na wybrany dzień, jest wyszarzony. Okno: tytuł „Start produkcji”, tekst „Przenieść N opłaconych zamówień do produkcji?”, przyciski „Anuluj” i **„Start”**.

Baza: każde `paid` tego dnia → `in_production` przez `set_order_status`, notatka „Start produkcji dnia”, wiersz w `order_events`. Maila nie ma.

Jeśli krok się pominie: zamówienia zostają `paid`. To jest pułapka z punktu 5.

## 3. Produkcja — lista do pieczenia

Ekran: `/admin/produkcja`. Przycisk **„Drukuj”** prowadzi do `/admin/produkcja/drukuj`. Lista bierze `production_summary`: pozycje ze statusów `paid`, `in_production`, `delivered`, `picked_up`. Samo otwarcie listy nic nie zmienia w bazie i nie wysyła maila.

Jeśli krok się pominie: piekarnia nie ma zestawienia, zamówienia zostają jak były.

## 4. Paczki — etykiety

Ekran: `/admin/paczki`. Przy punkcie przycisk **„Drukuj etykiety”** → `/admin/paczki/drukuj` (etykieta 7,5 × 6 cm, „Drukuj na etykieciarce”). Druk nic nie zmienia w bazie i nie wysyła maila.

Jeśli krok się pominie: paczki da się wieźć bez naklejek. Status zostaje.

## 5. W punkcie — „dostawa dojechała”

Ekran: `/admin/paczki`, przy punkcie, obok druku, nie na górze. Przycisk **„Dowiezione do tego punktu”**. Liczy wyłącznie `in_production` tego punktu i dnia. Zero takich paczek → przycisk wyszarzony. Okno: „Dowiezione”, „Oznaczyć N paczek jako dowiezione do {punkt}?”, przyciski „Anuluj” i **„Dowiezione”**.

Baza: `in_production` → `delivered`, notatka „Dowiezione do punktu”. Potem `sendOrderDelivered`: temat „Twoja paczka czeka — {punkt}”. Drugi raz ten mail nie wyjdzie, jeśli w `email_log` jest już `sent` (chyba że `force` z karty zamówienia w panelu).

**Pułapka.** Jeśli rano nikt nie kliknie „Start produkcji dnia”, zamówienia zostają `paid`. Przycisk w Paczkach ich nie liczy, więc jest wyszarzony. Justyna stoi w punkcie i nie ma jak dać znać. `paid` → `delivered` w jednym kroku i tak jest zabronione przez `set_order_status`.

Jeśli krok się pominie: status zostaje `in_production` (albo `paid`), mail „paczka czeka” nie wychodzi, a na Wydawaniu lista „Do wydania” jest pusta, bo bierze tylko `delivered`. Zostaje „Mimo to wydaj”, które samo przeskakuje statusy.

## 6. Wydawanie

Ekran: `/admin/wydawanie`. Dzień domyślnie dziś. Punkt: ostatnio wybrany w tym telefonie (`localStorage`, klucz `adjanodeli-pickup-point`), nie ten, przy którym kliknięto dojazd. Pole kodu jest pod wyborem punktu, bez `autocapitalize="characters"`. Lista „Do wydania w tym punkcie” i przy paczce przycisk **„Wydano”**. Po kodzie `delivered` ten sam **„Wydano”**.

Baza: `delivered` → `picked_up`, `picked_up_at`, notatka „Wydano w punkcie”. Maila nie ma. Potem na 1,5 s pełny zielony ekran „Wydano ✓ {imię}”, potem pole kodu znowu dostaje kursor.

Jeśli krok się pominie: paczka zostaje `delivered`. Klient ma mail, że czeka, w programie widać ją jako niewydaną.

## 7. Po oknie odbioru

Nic. Żaden cron nie rusza `delivered` po `pickup_to`. Nieodebrana paczka zostaje `delivered` do ręcznego wydania albo anulowania. W statystykach jest tylko odsetek nieodebranych, bez skutku dla statusu.

**Otwarte pytanie do Miłosza:** co z paczką, której nikt nie odebrał do końca okna (zostaje na drugi dzień, wraca do piekarni, ktoś dzwoni)? Program dziś nie robi nic. Reguły nie dopisuję.
