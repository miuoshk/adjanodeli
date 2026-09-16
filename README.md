# AdjanoDeli

Zamówienia z odbiorem w punkcie dla Piekarni-Cukierni Adjano (Mikołów).

## Ścieżki sklepu

- `/` — wizytówka: jak to działa, kategorie, o nas
- `/sklep` — sklep, kafelki kategorii, wybór dnia (`?dzien=YYYY-MM-DD`)
- `/sklep/[kategoria]` — produkty jednej kategorii
- `/koszyk` — koszyk, punkt, dzień, płatność
- `/punkt/[kod]` — link zapraszający do zamkniętego punktu odbioru
- `/konto` — profil, pieczątki, punkty odbioru
- `/logowanie` — kod z e-maila (sklep)
- `/admin/logowanie` — login i hasło (panel)

Dawne linki do menu (`/` z `?dzien=`) idą na `/sklep`. Logo prowadzi na wizytówkę.

## Jak wydać kod punktu

1. Wejdź w **Punkty odbioru** i otwórz punkt (np. sąd albo urząd).
2. Włącz **Punkt zamknięty (na kod)**.
3. Kliknij **Wygeneruj**, zapisz.
4. **Kopiuj link zapraszający** i wyślij do ludzi z tej instytucji.  
   Albo podaj sam kod — w koszyku jest pole „Wpisz kod od pracodawcy”.
5. Opcjonalnie wpisz domeny e-mail (np. `mikolow.sr.gov.pl`) — po zalogowaniu z takiego maila punkt odblokuje się sam.

Zmiana kodu nie zabiera dostępu osobom, które już weszły. Możesz cofnąć jedną osobę albo wszystkich z kodu.

## Jak ustawić minimum

Chodzi o maksymalną liczbę sztuk jednego produktu w zwykłym zamówieniu.

1. **Ustawienia** → **Max sztuk jednego produktu** (domyślnie 15).
2. Zapisz.

Powyżej tej liczby sklep kieruje na formularz zamówienia specjalnego.

Limit na dzień (ile w ogóle pieczemy) ustawiasz przy produkcie albo w **Limitach**.

## Jak dodać alergen

1. **Słowniki** → zakładka **Alergeny**.
2. Wpisz nazwę, kolejność, **Dodaj**.
3. Potem przy produkcie odhaczasz alergeny z tej listy.

Tagi (keto, wege itd.) dodajesz w tej samej stronie, w zakładce **Tagi**.

## Jak ustawić lead_days (najwcześniejszy odbiór)

To liczba dni między zamówieniem a odbiorem. **1** = na jutro, **2** = na pojutrze.

- Dla całej kategorii: **Kategorie** → edycja → **Najwcześniejszy odbiór**.
- Dla jednego produktu: **Produkty** → edycja → to samo pole. Puste = bierz z kategorii.

Przykład: torty z „2” nie da się zamówić na jutro — dopiero na pojutrze.

## Panel

Kolejność w menu: Dziś, Zamówienia, Produkcja, Paczki, Wydawanie, potem katalog (kategorie, produkty, limity, promocje i kody, punkty, słowniki, zamówienia specjalne, statystyki, ustawienia). Katalog i ustawienia — tylko właścicielka. Pracownik widzi dzień, paczki i wydawanie.

## Uruchomienie

```bash
npm install
npx supabase db push
npm run db:types
npm run dev
```

Testy: `npm test`. Build: `npm run build`.
