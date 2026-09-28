# 14 · Instrukcja dla Justyny: zamówienia i odbiory

> Uruchamiasz na końcu, po 10–13, żeby instrukcja opisywała to, co jest naprawdę w panelu. Zakres: nowa strona pomocy w panelu i ściąga do druku. Logika bez zmian. Bez nowych bibliotek.

## 0. Zanim zaczniesz

1. `git status`: prompty 10–13 są zacommitowane, poza nieśledzonymi `.cursor/`, `Claude outputs/`, `public/img/` czysto.
2. Przeczytaj raporty `docs/audyt/2026-09-maile-i-platnosci.md` i `docs/audyt/2026-09-dzien-dostawy.md`.
3. Każdą nazwę ekranu i napis przycisku bierz z kodu (`grep`), dokładnie tak, jak są w interfejsie. Każdy krok przeklikaj na danych testowych, zanim go opiszesz.

## 1. Strona `/admin/pomoc`

- Nowy link „Pomoc” w `components/admin/admin-nav.tsx`, na końcu, widoczny dla staff i owner.
- Treść w komponentach strony (bez biblioteki do markdown). Spis treści na górze z kotwicami.
- Przycisk „Drukuj instrukcję” i style druku: A4, czarny tekst na białym, bez menu panelu, każda sekcja zaczyna się od nowej linii, nie tnie list między stronami, jeśli się da.
- Na telefonie czytelna w jednej kolumnie.

## 2. Jak pisać

- Zwracasz się do Justyny na „Ty”. Krótkie zdania. Kroki numerowane: jeden krok = jedna czynność.
- Nazwy statusów tak, jak widzi je w panelu („Opłacone”, „W produkcji”, „Do odbioru”, „Odebrane”), nigdy angielskie nazwy z bazy.
- Przyciski w cudzysłowie, ekrany pogrubione: **Paczki** → „Jestem na miejscu — powiadom klientów”.
- Przy każdym kroku, który wysyła maila klientowi, dopisz jedno zdanie: co klient dostaje.
- Bez żargonu (webhook, status, RLS, cache). Bez zwrotów typu „w prosty sposób”, „bezproblemowo”, „kluczowe”.

## 3. Treść

1. **Jak wygląda dzień** — schemat w 6 punktach: wieczorem zamykają się zamówienia → rano produkcja → etykiety i pakowanie → dojazd do punktu i powiadomienie → wydawanie po kodzie → po odbiorach.
2. **Wieczorem** — o której zamykają się zamówienia na następny dzień i gdzie to ustawić, gdzie zobaczyć, ile czego upiec.
3. **Rano: produkcja** — „Dziś” → start produkcji, **Produkcja** → lista i druk.
4. **Etykiety i pakowanie** — **Paczki** → etykieciarka albo A4, ustawienia okna druku (skala 100%, marginesy: brak, bez nagłówków i stopek, rozmiar papieru dla etykieciarki), co jest na etykiecie.
5. **W punkcie: „jesteśmy”** — kiedy kliknąć, co się dzieje z paczkami bez rozpoczętej produkcji, co dostaje klient, co zrobić, gdy przy kimś jest „nie doszedł”.
6. **Wydawanie** — klient podaje kod → wpisz → wydaj. Klient bez kodu: szukanie po numerze albo nazwisku. Kod z innego dnia albo punktu: co widać i co zrobić.
7. **Po odbiorach** — co z paczkami, których nikt nie odebrał. Opisz tylko to, co jest w systemie. Jeśli nic, napisz, co Justyna ma zrobić ręcznie, i dopisz to pytanie w podsumowaniu dla Miłosza.
8. **„Nie dostałam maila”** — **Zamówienia** → numer → sekcja „Maile” → wyślij ponownie. Kod odbioru widać też w panelu przy zamówieniu.
9. **Anulowanie i zwrot** — kto może anulować i do kiedy, jak wygląda zwrot, co dostaje klient, co zrobić z mailem „Zwrot ręczny wymagany”.
10. **Klient zapłacił za wygasłe zamówienie** — skąd się o tym dowiesz (mail z promptu 10) i co zrobić.
11. **Zamówienia specjalne** — gdzie je widać i jak odpowiedzieć.
12. **Gdy coś nie działa** — jak zgłosić Miłoszowi, żeby dało się to szybko sprawdzić: co robiłaś, na którym ekranie, telefon czy komputer, godzina, numer zamówienia, zrzut ekranu.

## 4. Ściąga na trasę

Druga strona do druku `/admin/pomoc/trasa` (link na górze pomocy): jedna kartka A4 dla kierowcy, duży tekst:

1. Przed wyjazdem: paczki są oznaczone etykietami, masz telefon z zalogowanym panelem.
2. W punkcie: **Paczki** → Twój punkt → „Jestem na miejscu — powiadom klientów”.
3. Klient podaje kod → **Wydawanie** → wpisz kod → wydaj.
4. Nie ma kodu → szukaj po nazwisku albo numerze.
5. Coś nie gra → telefon do Justyny: `{owner_phone}` z ustawień.

## 5. Odbiór

1. `npm run lint`, `npm run build`.
2. Przeczytaj stronę pomocy na 390 px i wydrukuj ją do PDF w Chrome: nic nie jest ucięte, menu panelu nie drukuje się.
3. Sprawdź, że każdy napis przycisku z instrukcji istnieje w interfejsie (lista napisów i plików, w których są, na końcu odpowiedzi).

Na koniec: zmienione pliki, lista otwartych pytań do Miłosza i jedno zdanie, gdzie Justyna znajdzie instrukcję.
