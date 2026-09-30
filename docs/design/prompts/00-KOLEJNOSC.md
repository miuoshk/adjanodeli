# Przebudowa wyglądu Adjano Deli — kolejność promptów

Każdy prompt to jedno zadanie dla Cursora (Agent). Jeden prompt = jeden nowy czat, jeden commit.

## Stan

Prompty 01–06, 08–09 i runda 1 (10–14) są wykonane. Teraz runda 2 z uwag Justyny: prompty 15–17, opis niżej. Najpierw ręcznie konto pracownika, potem 15 → 16 → 17.

## Kolejność

| # | Plik | Co robi | Zależy od |
|---|------|---------|-----------|
| 07 | `07-dane-produktow.md` + `.sql` | Nazwy i literówki w produktach, adresy kategorii. **Nie dla Cursora**: przejrzyj z Justyną i uruchom w Supabase SQL Editor | — |
| 01 | `01-landing.md` | Landing v4: fonty, tokeny, klasy `adj-*`, header z paskiem, hero, półka, jak to działa, o nas, torba, stopka | — |
| 02 | `02-landing-polecane-i-stali-klienci.md` | Sekcja „Polecamy” (flaga w panelu), blok „Dla stałych klientów”, półka bez cen | 01 |
| 03 | `03-system-i-sklep.md` | Wspólny system (`components/ui`, `components/brand`), header i tło na całym sklepie, `/sklep`, kategoria, karta produktu | 01, 02 |
| 04 | `04-koszyk-i-zamowienie.md` | Koszyk w dwóch kolumnach, punkty jako karty, bilet z kodem odbioru, stany zamówienia | 03 |
| 05 | `05-konto-logowanie-i-reszta.md` | Logowanie, konto z kartą pieczątek, zamówienia, stałe zamówienia, strony informacyjne, 404 | 04 |
| 06 | `06-maile.md` | E-maile w tym samym stylu | 05 |
| **08** | `08-marka-logo-kolory-ikony.md` | Karmin zamiast czerwieni, nowe logo w nagłówku, stopka z przeplatanką, favicon i ikony ze znakiem A, manifest, obrazek do udostępniania, tytuły stron, nazwa „Adjano Deli” | 06 |
| **09** | `09-404-puste-stany-maile-panel.md` | Nowa strona 404 i błędu, koniec z Janoszem, znak A w pustym koszyku i na karcie pieczątek, logo w mailach, w panelu i na etykietach paczek | 08 |

## Jak uruchamiać

1. Nowy czat w Cursorze, tryb Agent.
2. Napisz: `Wykonaj docs/design/prompts/08-marka-logo-kolory-ikony.md`. Po commicie nowy czat i `…/09-404-puste-stany-maile-panel.md`.
3. Po każdym prompcie:
   - przejrzyj diff (czy nie ruszył czegoś spoza zakresu),
   - `npm test && npm run lint && npm run build`,
   - kliknij ścieżki z sekcji „Odbiór” na końcu promptu, na telefonie (390 px) i desktopie,
   - commit z numerem promptu w opisie, np. `feat(brand): 08 logo, karmin i ikony`.
4. Jeśli Cursor zatrzyma się na sprzeczności ze SPEC, to dobrze. Każdy prompt ma krok, który aktualizuje SPEC; pokaż mu go palcem.

## Runda 1 poprawek — uwagi Justyny z 28.09

| # | Plik | Uwaga Justyny | Co robi |
|---|------|---------------|---------|
| — | ręcznie, 10 minut | „klient nie dostał maila” | Sprawdzenie konfiguracji, zanim ruszysz kod (lista niżej) |
| **10** | `10-maile-i-platnosci.md` | „klient nie dostał potwierdzenia” | Audyt drogi płatność → mail, dziennik maili, „Wyślij ponownie”, alarm przy płatności za wygasłe zamówienie, stan poczty w Ustawieniach |
| **11** | `11-konto-moje-zamowienia.md` | „klient nie widzi zamówienia na koncie” | Zamówienia na `/konto`, „Zalogowana jako…”, link w menu, ekran „Potwierdzamy płatność…” |
| **12** | `12-dzien-dostawy.md` | „jak dać znać, że dojechałam?” | Audyt dnia, „Dziś” jako plan dnia, „Jestem na miejscu — powiadom klientów”, lepszy mail „Twoja paczka czeka”, wydawanie na telefonie |
| **13** | `13-etykiety-a4-i-etykieciarka.md` | „za mała czcionka, A4 i etykieciarka” | Dwa formaty druku, większy tekst, bez pełnego e-maila na etykiecie |
| **14** | `14-instrukcja-dla-justyny.md` | „instrukcja zamówień i odbiorów” | Strona „Pomoc” w panelu do druku i ściąga na trasę dla kierowcy |

Kolejność ma znaczenie: 12 korzysta z dziennika maili z 10, 14 opisuje ekrany po 10–13.

### Zanim odpalisz 10 (ręcznie, 10 minut)

Połowa problemu z mailami może być w konfiguracji, a nie w kodzie:

- [ ] **Vercel → Settings → Environment Variables (Production):** są `RESEND_API_KEY`, `EMAIL_FROM` (adres w `adjanodeli.pl`), `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL=https://adjanodeli.pl`. Po zmianie zmiennych: Redeploy.
- [ ] **Resend → Domains:** `adjanodeli.pl` = Verified. Bez tego Resend wysyła tylko na Twój własny adres.
- [ ] **Resend → Emails:** czy przy zamówieniu klienta w ogóle była próba wysyłki.
- [ ] **Stripe → Developers → Webhooks:** endpoint `https://adjanodeli.pl/api/stripe/webhook` (albo produkcyjny adres Vercela), zdarzenia `checkout.session.completed` i `checkout.session.expired`, ostatnie dostarczenia 200. Sekret z tego endpointu = `STRIPE_WEBHOOK_SECRET` na Vercelu.
- [ ] **Vercel → Logs:** szukaj `[EMAIL]` i `[WEBHOOK]` z godziny zamówienia klienta.

Wynik wpisz Cursorowi na początku czatu z promptem 10 („Resend: domena niezweryfikowana” albo „wszystko ustawione”).

### Jak pracujemy z uwagami (za każdym razem)

1. **Justyna zgłasza:** co robiła, na którym ekranie, telefon czy komputer, godzina, numer zamówienia, zrzut ekranu (ten sam format jest w „Pomocy”, sekcja „Gdy coś nie działa”).
2. **Miłosz z Claude'em** zamienia uwagi w prompty: jeden temat = jeden prompt, z audytem przed zmianami.
3. **Cursor** (nowy czat na prompt): audyt → raport w `docs/audyt/` → zmiany → testy → lista zmienionych plików.
4. **Miłosz:** przegląd diffu, `npm test && npm run lint && npm run build`, kroki z sekcji „Odbiór”, commit z numerem promptu, push (Vercel wdraża sam), migracje `npx supabase db push`.
5. **Justyna testuje** na produkcji według krótkiej listy od Miłosza (3–5 kroków z „Odbioru”) i daje znać: działa albo zrzut ekranu.
6. Zamykamy temat w `docs/CHANGELOG.md`.

## Runda 2 poprawek — uwagi Justyny z 30.09

| # | Plik | Uwaga Justyny | Co robi |
|---|------|---------------|---------|
| — | ręcznie, 5 minut | „chcę dodać pracownika, na dziś” | Konto pracownika przez Supabase, bez czekania na 16 (instrukcja niżej) |
| **15** | `15-dzien-w-zamowieniach-i-dane-na-etykiecie.md` | „nie widzę zamówień na jutro” i „mail zniknął z etykiety” | Filtr dnia w Zamówieniach bierze dni z zamówieniami, nie dni do zamawiania; w Ustawieniach wybór, co drukować o kliencie |
| **16** | `16-zespol-i-uprawnienia.md` | „pracownik ma widzieć Zamówienia, Produkcję, Paczki, Wydawanie” | Ekran „Zespół”: dodawanie pracowników, zestawy uprawnień, hasło tymczasowe, wyłączanie dostępu, współwłaściciel |
| **17** | `17-opcje-produktu.md` | „wybór sosu, bez sosu nie przejdzie dalej” | Grupy opcji przy produkcie, okno wyboru w sklepie, opcje w koszyku, mailach, produkcji i na etykietach |

### Pracownik na dziś (przed promptem 16)

Rola `staff` już istnieje i daje dokładnie to, o co prosi Justyna: Dziś, Zamówienia, Produkcja, Paczki, Wydawanie, Zamówienia specjalne i Pomoc. Anulować, zwracać ani zmieniać produktów i ustawień nie może.

1. Supabase → Authentication → Users → „Add user” → „Create new user”: e-mail pracownika, hasło (min. 10 znaków), zaznacz „Auto Confirm User”. Jeśli Supabase odpowie, że adres już istnieje, to znaczy, że pracownik ma konto klienta w sklepie. Najprościej użyj innego adresu (np. służbowego). Konto klienta przejmie ekran „Zespół” z promptu 16.
2. Supabase → SQL Editor:

   ```sql
   update public.profiles
   set role = 'staff', full_name = 'Imię Nazwisko'
   where lower(email) = lower('adres@pracownika.pl');
   ```

   Powinno zwrócić „1 row affected”. Jeśli 0, sprawdź pisownię adresu.
3. Pracownik loguje się na `https://adjanodeli.pl/admin/logowanie`: login = e-mail albo część przed @, hasło z kroku 1. Hasło przekaż osobiście albo telefonicznie.

Po prompcie 16 ten pracownik pojawi się na ekranie „Zespół” z pełnym zestawem uprawnień i Justyna sama może go ograniczyć.

## Po wdrożeniu 08–09 (ręcznie, poza kodem)

- **Stripe → Settings → Branding:** ikona `public/brand/icons/icon-512.png`, logo `adjano-deli-karmin.png` z folderu księgi, kolor marki `#A6231F`, kolor akcentu `#4B4A2F`. W **Payment methods** sprawdź, czy Apple Pay i Google Pay są włączone.
- **Supabase → Authentication → Email templates:** jeśli mail z kodem logowania wysyła Supabase, podmień w nim logo na `…/brand/email/adjano-deli-karmin@2x.png` i kolor przycisku na `#A6231F`.
- **Instagram, Facebook, wizytówka Google:** awatar = znak A w karminie (`znak/ikona-512.png` z folderu księgi).
- **Udostępnianie linku:** po wdrożeniu wklej adres strony do debugera Facebooka (Sharing Debugger), żeby odświeżył podgląd z nowym obrazkiem.

## Materiały

- **Księga znaku Adjano Deli** (PDF) i wszystkie pliki marki: folder „Adjano Deli — księga znaku” na pulpicie Miłosza (AdjanoDeli). Pliki potrzebne stronie są już w `public/brand/logo`, `public/brand/icons`, `public/brand/email` i `docs/design/marka/app`.
- Wzorzec landingu: `docs/design/landing-v2/reference.html`, `reference.css`, `desktop.jpg`, `mobile.jpg`.
- Podglądy do 08 i 09: `docs/design/marka/podglad/` (strona 404, ikony, pliki logo).
- Projekt na canvasie — link w rozmowie z Claude.
- Zdjęcia z pieca: `public/brand/landing/piec-*.jpg`.
- **Pieczątki (okrągłego znaku z napisem w obręczy) nie używamy na stronie.** Jest na torby, pudełka i stempel.
