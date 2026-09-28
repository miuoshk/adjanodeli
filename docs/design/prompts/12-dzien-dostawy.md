# 12 · Dzień dostawy: od produkcji do wydania, powiadomienie „jesteśmy”

> Uwaga Justyny: „jak jutro mam wysłać wiadomość, jak podjadę z dostawą? Jak zaznaczyć w programie, że dostawa dojechała?”. Funkcja już jest (Paczki → „Dowiezione do tego punktu” wysyła mail „Twoja paczka czeka”), ale jej nie widać i łatwo ją zablokować. Zakres: przejście całego dnia i uproszczenie ekranów. Uruchamiasz po 10 i 11. Bez nowych bibliotek.

## 0. Zanim zaczniesz

1. `git status`: prompty 10 i 11 są zacommitowane, poza nieśledzonymi `.cursor/`, `Claude outputs/`, `public/img/` czysto.
2. Przeczytaj `docs/SPEC.md` §5 (przejścia: `paid → in_production → delivered → picked_up`, `paid → delivered` zabronione) i §6.

## 1. Audyt dnia — `docs/audyt/2026-09-dzien-dostawy.md`

Na danych testowych (dwa punkty, po 3 zamówienia) przejdź dzień tak, jak przejdzie go Justyna i kierowca, na telefonie 390 px i na komputerze. Dla każdego kroku zapisz: ekran, dokładny napis przycisku, co zmienia się w bazie, jaki mail wychodzi i co się stanie, jeśli krok się pominie.

1. Wieczór: zamknięcie zamówień o godzinie granicznej.
2. Rano: „Dziś” → start produkcji (`StartProductionButton`).
3. Produkcja: lista do pieczenia.
4. Paczki: etykiety, pakowanie.
5. W punkcie: „Dowiezione do tego punktu” (`MarkPointDeliveredButton`, `markPointDelivered`).
6. Wydawanie: kod odbioru → wydane (`handover-screen.tsx`).
7. Po oknie odbioru: co dzieje się z nieodebranymi paczkami (sprawdź, czy cokolwiek; jeśli nic, zapisz to jako otwarte pytanie do Miłosza, nie wymyślaj reguły).

Zapisz wprost znaną pułapkę: jeśli rano nikt nie kliknie startu produkcji, zamówienia zostają `paid`, a przycisk w Paczkach liczy tylko `in_production`, więc jest wyszarzony.

## 2. „Dziś” jako plan dnia

`app/admin/(panel)/page.tsx`: nad obecną treścią cztery kroki w kolejności, każdy z liczbą i linkiem do swojego ekranu:

1. **Produkcja** — „Rozpocznij produkcję” albo „Rozpoczęta: N zamówień”.
2. **Etykiety** — linki „Etykieciarka” i „A4” (prompt 13 doda formaty; do tego czasu jeden link).
3. **Dostawy** — lista punktów: „w drodze” albo „na miejscu, powiadomiono N z M”.
4. **Wydawanie** — per punkt „wydane X z Y”.

Krok zrobiony: znak ✓ w karminie i przygaszony opis. Na telefonie jedna kolumna, przyciski min. 48 px.

## 3. Paczki: „Jestem na miejscu”

`components/admin/mark-point-delivered-button.tsx` i `app/admin/(panel)/paczki/page.tsx`:

- Napis przycisku: **„Jestem na miejscu — powiadom klientów”**. Na telefonie na całą szerokość, min. 56 px, na górze sekcji punktu.
- Okno potwierdzenia: „Klienci z punktu {punkt} ({N}) dostaną maila, że paczki czekają do {pickup_to}.”
- Przycisk liczy zamówienia `paid` i `in_production` tego punktu i dnia. Zamówienia `paid` przechodzą najpierw na `in_production`, potem na `delivered`, każde przez `set_order_status` (dwa zdarzenia w `order_events`, SPEC nie jest łamany). W oknie dopisz wtedy: „{X} z nich nie miało rozpoczętej produkcji, oznaczę je przy okazji.”
- Po sukcesie w sekcji punktu zostaje podsumowanie: „Powiadomiono N z M” z datą i godziną, a przy błędach lista kodów z przyciskiem „Wyślij ponownie” (używa `force` z promptu 10).
- Drugie kliknięcie tego samego dnia nie wysyła maili ponownie (dziennik z promptu 10), tylko pokazuje podsumowanie.

Nazwę akcji `markPointDelivered` zostaw. Zmień tylko jej zakres statusów i zwracane podsumowanie.

## 4. Mail „Twoja paczka czeka”

`lib/email/templates/order-delivered.tsx` i `lib/email/send-order-delivered.ts`:

- temat: `Twoja paczka czeka — {punkt}, do {pickup_to}`;
- na górze duży kod odbioru, pod nim punkt, adres punktu i „do {pickup_to}”;
- jedno zdanie: „Pokaż ten kod przy odbiorze.”;
- link do zamówienia i telefon z ustawień.

Popraw SPEC §11 (temat).

## 5. Wydawanie

`components/admin/handover-screen.tsx`:

- dzień i punkt ustawione na dziś i na punkt, który był ostatnio oznaczony „na miejscu” (zapamiętaj w `localStorage`, z `try/catch`);
- pole kodu na górze, duże, z klawiaturą tekstową wielkich liter na telefonie (`autocapitalize="characters"`);
- nad listą licznik „Wydane X z Y”;
- po wydaniu wyraźne potwierdzenie przy paczce i przejście kursora z powrotem do pola kodu.

## 6. Odbiór

1. `npm test`, `npm run lint`, `npm run build`.
2. Dzień testowy z dwoma punktami, bez klikania startu produkcji: w Paczkach „Jestem na miejscu” działa, okno mówi o paczkach bez produkcji, maile przychodzą, „Dziś” pokazuje kroki.
3. Drugie kliknięcie w tym samym punkcie nie wysyła maili.
4. Wydawanie na 390 px: kod → wydane → licznik rośnie.
5. Mail „Twoja paczka czeka” w Gmailu i Apple Mail.

Na koniec: zmienione pliki, raport z kroku 1 z otwartymi pytaniami i jedno zdanie, jak przetestować.
