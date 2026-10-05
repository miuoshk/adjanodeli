# Przebudowa wyglądu Adjano Deli — kolejność promptów

Każdy prompt to jedno zadanie dla Cursora (Agent). Jeden prompt = jeden nowy czat, jeden commit.

## Stan

Prompty 01–06, 08–09 i rundy 1–3 (10–20) są wykonane. Teraz runda 4 z 5.10: 21 od razu, 22 i 23 po odpowiedziach Justyny. Opis niżej.

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
4. **Miłosz:** przegląd diffu, `npm test && npm run lint && npm run build`, kroki z sekcji „Odbiór”, commit z numerem promptu, push (Vercel wdraża sam). Migracje wgrywa Cursor przez MCP Supabase; `npx supabase db push` nie używamy, dopóki historia migracji nie zostanie naprawiona (`supabase migration repair`).
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

## Runda 3 poprawek — uwagi Justyny z 1.10

| # | Plik | Uwaga Justyny | Co robi |
|---|------|---------------|---------|
| — | ręcznie, 5 minut | „nie widzę jutra, nie mogę wydrukować planu” | Sprawdzenie wdrożenia i migracji (lista niżej). Wynik wklej Cursorowi na start 18 |
| **18** | `18-jutro-i-druk-produkcji.md` | „nie widzę zamówienia na jutro, planu produkcji nie mogę wydrukować” | Diagnoza z raportem, potem poprawka z testem |
| **19** | `19-poziomy-dostepu.md` | „podgląd, a nic do zmiany, i żeby wydawała” | Każda sekcja: Brak / Podgląd / Pełny. Zestaw „Podgląd i wydawanie” |
| **20** | `20-kod-punktu-odbioru.md` | „bez kodu nie puszczać dalej, bez kodu wpisz ADJANO” | Kod punktu wymagany przed płatnością, piekarnia jako punkt z kodem ADJANO, zmiana punktu w zamówieniu z panelu |

### Zanim odpalisz 18 (ręcznie, 5 minut)

- [ ] **Vercel → Deployments:** ostatnie wdrożenie produkcyjne to commit „let a product require a choice, such as a sauce…” ze statusem Ready.
- [x] **Migracje (sprawdzone 1.10):** 0020–0024 są na bazie, wgrane przez MCP Supabase pod numerami z datą. `npx supabase db push` **nie uruchamiać**, bo spróbuje wgrać je drugi raz.
- [ ] **Na produkcji:** otwórz `/admin/produkcja?dzien=` z jutrzejszą datą i obok `/admin/produkcja/drukuj?dzien=` z tą samą. Zapisz, co widać (pusta strona, błąd, brak zamówień).
- [ ] **Vercel → Logs:** błędy z tych dwóch adresów z ostatniej godziny.
- [ ] **Zamówienie tej klientki w panelu:** status (opłacone czy „Czeka na płatność”), dzień i punkt.

### Przed 20: punkt w piekarni

Justyna w **Punkty odbioru** zakłada (albo poprawia) punkt „Piekarnia Adjano” z adresem ul. Katowicka 120, godzinami odbioru i dniami, z kodem `ADJANO`. Bez tego klienci bez kodu nie będą mieli gdzie odebrać.

## Runda 4 — uwagi i prośby Justyny z 5.10

| # | Plik | Co mówi Justyna | Co robi |
|---|------|-----------------|---------|
| **21** | `21-panel-na-telefonie.md` | „na telefonie nie widzimy zakładki Panel” | Panel w menu na telefonie, karta panelu na koncie, link logowania dla pracowników, osobna ikona panelu na ekranie telefonu. Przy okazji uzupełnia historię migracji o 0026 i 0027 |
| **22** | `22-rabat-za-ilosc.md` | „od 20 sztuk −10%, od 40 −20%” | Progi w Ustawieniach, liczenie w `create_order`, podpowiedź w koszyku, wybór korzystniejszego rabatu zamiast łączenia |
| **23** | `23-przypomnienie-o-18.md` | „przypomnienie o 18:00 każdemu zarejestrowanemu” | Przypomnienie tylko za zgodą (wymóg prawa), zgoda po płatności, na koncie i w pasku, wysyłka o 18:00, wypisanie jednym kliknięciem |

Przed 22 wpisz odpowiedzi Justyny w sekcję „Ustalenia” na górze pliku: progi, wykluczone kategorie, łączenie z voucherem.

21 to szybka poprawka i może iść od razu. 22 i 23 dopiero po odpowiedziach Justyny.

## Historia migracji (stan z 1.10)

Od `0020` migracje wgrywa Cursor przez MCP Supabase, więc na bazie mają numery z datą. Schemat jest zgodny z plikami, rozjechała się tylko historia. `npx supabase db push` **nie uruchamiać**, dopóki historia nie zostanie wyrównana.

| Plik | Wpis na bazie |
|---|---|
| `0001`–`0019` | te same numery |
| `0020_order_minimum_10pln` | `20260928000912` |
| `0021_email_log` | `20260928211558` |
| `0022_label_customer_info` | `20260930205821` |
| `0023_staff_permissions` | `20260930211619` |
| `0024_product_options` | `20260930213645`, `20260930213736`, `20260930213747` |
| `0025_production_summary_jsonb` | `20261001214844` |
| `0026_staff_access_levels` | `20261001220215` |
| `0027_require_point_code` | `20261001221315`, `20261001221347`, `20261001221422` |

Wyrównanie (tylko zapis w historii, tabele i funkcje zostają bez zmian), po zalogowaniu CLI na konto z projektem (`npx supabase logout`, `npx supabase login`):

```
npx supabase migration repair --status reverted 20260928000912 20260928211558 20260930205821 20260930211619 20260930213645 20260930213736 20260930213747 20261001214844 20261001220215 20261001221315 20261001221347 20261001221422
npx supabase migration repair --status applied 0020 0021 0022 0023 0024 0025 0026 0027
npx supabase migration list
```

Nowe migracje (od `0028`) dopisuj do tej tabeli, dopóki historia nie jest wyrównana.

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
