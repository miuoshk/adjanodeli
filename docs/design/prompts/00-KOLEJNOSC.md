# Przebudowa wyglądu AdjanoDeli — kolejność promptów

Każdy prompt to jedno zadanie dla Cursora (Agent). Jeden prompt = jeden nowy czat, jeden commit.

## Zanim zaczniesz

- W `app/(shop)/page.tsx` jest niezacommitowany eksperyment z khaki hero. Zrób commit albo `git stash` — prompt 01 zastępuje ten plik.
- Środowisko musi mieć `.env.local` z Supabase (prompt 01 pobiera dwa zdjęcia `curl`-em, prompt 02 robi migrację).

## Kolejność

| # | Plik | Co robi | Zależy od |
|---|------|---------|-----------|
| 07 | `07-dane-produktow.md` + `.sql` | Nazwy i literówki w produktach, adresy kategorii. **Nie dla Cursora** — przejrzyj z Justyną i uruchom w Supabase SQL Editor | — (najlepiej na start) |
| 01 | `01-landing.md` | Landing v4: fonty, tokeny, klasy `adj-*`, header z paskiem, hero, półka, jak to działa, o nas, torba, stopka | — |
| 02 | `02-landing-polecane-i-stali-klienci.md` | Sekcja „Polecamy” (flaga w panelu), blok „Dla stałych klientów”, półka bez cen | 01 |
| 03 | `03-system-i-sklep.md` | Wspólny system (`components/ui`, `components/brand`), header i tło na całym sklepie, `/sklep`, kategoria, karta produktu | 01, 02 |
| 04 | `04-koszyk-i-zamowienie.md` | Koszyk w dwóch kolumnach, punkty jako karty, bilet z kodem odbioru, stany zamówienia | 03 |
| 05 | `05-konto-logowanie-i-reszta.md` | Logowanie, konto z kartą pieczątek, zamówienia, stałe zamówienia, strony informacyjne, 404 | 04 |
| 06 | `06-maile.md` | E-maile w tym samym stylu | 05 |

## Jak uruchamiać

1. Nowy czat w Cursorze, tryb Agent.
2. Napisz: `Wykonaj docs/design/prompts/01-landing.md` (i tak dalej dla kolejnych numerów).
3. Po każdym prompcie:
   - przejrzyj diff (czy nie ruszył czegoś spoza zakresu),
   - `npm test && npm run lint && npm run build`,
   - kliknij ścieżkę z sekcji „Odbiór” na końcu promptu, na telefonie (390 px) i desktopie,
   - commit z numerem promptu w opisie, np. `feat(ui): 03 system i sklep`.
4. Jeśli Cursor zatrzyma się na sprzeczności ze SPEC — to dobrze. Każdy prompt ma krok, który aktualizuje SPEC; pokaż mu go palcem.

## Materiały

- Wzorzec landingu: `docs/design/landing-v2/reference.html`, `reference.css`, `desktop.jpg`, `mobile.jpg`.
- Projekt na canvasie (desktop + telefon) — link w rozmowie z Claude.
- Zdjęcia z pieca: `public/brand/landing/piec-*.jpg`. Zdjęcia z czarnym tłem w tym folderze (`hero-chleb-zytni.jpg`, `menu-martwa-natura.jpg`) nie są używane i można je usunąć.
