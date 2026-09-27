# Przebudowa wyglądu Adjano Deli — kolejność promptów

Każdy prompt to jedno zadanie dla Cursora (Agent). Jeden prompt = jeden nowy czat, jeden commit.

## Stan

Prompty 01–06 są wykonane (commity od „rebuild the landing as a paper bakery page” do „restyle transactional emails”). Teraz kolej na 08 i 09: marka Adjano Deli z księgi znaku.

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
