# 11 · Konto: klient widzi swoje zamówienia

> Uwaga Justyny: „klient na swoim koncie nie widzi zamówienia”. Zakres: to, co klient widzi po płatności i na koncie. Uruchamiasz po 10. Bez nowych bibliotek.

## 0. Zanim zaczniesz

1. `git status`: prompt 10 jest zacommitowany, poza nieśledzonymi `.cursor/`, `Claude outputs/`, `public/img/` czysto.
2. Przeczytaj `docs/SPEC.md` §8 i §9 oraz `docs/audyt/2026-09-maile-i-platnosci.md`.

## 1. Audyt — dopisz sekcję do `docs/audyt/2026-09-maile-i-platnosci.md`

Opisz, gdzie klient szuka zamówienia i co tam widzi:

- `/konto` (strona „Twoje konto”) — dziś nie ma tam listy zamówień. To najpewniej źródło uwagi.
- `/moje-zamowienia` — jak do niej trafić na telefonie (390 px) i na komputerze. Czy link jest w menu mobilnym?
- `/zamowienie/[id]?status=success` — co widzi klient zaraz po płatności, jeśli webhook jeszcze nie dotarł (status `pending_payment`).
- Status „Wygasło” po zapłacie (przypadek z promptu 10) — co widzi klient.
- RLS `orders_select` (`user_id = auth.uid()`): zamówienie zobaczy tylko konto, z którego je złożono. Klient zalogowany innym mailem niczego nie zobaczy.

Dopisz gotowe zapytanie SQL tylko do odczytu dla Miłosza: po adresie e-mail pokaż zamówienia (numer, status, `created_at`, `paid_at`) i to, czy `user_id` zgadza się z kontem o tym adresie.

## 2. `/konto`: sekcja „Twoje zamówienia”

Nad resztą strony, zaraz pod nagłówkiem:

- zamówienia `delivered` („Czeka na Ciebie”) i `paid` / `in_production` („W przygotowaniu”) jako karty z dużym kodem odbioru, punktem, dniem i godzinami (ten sam wygląd co `WaitingCard` z `/moje-zamowienia`, wydziel wspólny komponent);
- 3 ostatnie pozostałe jako krótka lista;
- link „Wszystkie zamówienia” do `/moje-zamowienia`;
- gdy zamówień nie ma: znak A, „Nie masz jeszcze zamówień.” i przycisk „Przejdź do sklepu”.

## 3. Na jakie konto jesteś zalogowana

Na `/konto` i `/moje-zamowienia` jedna linijka pod nagłówkiem: `Zalogowana jako {email}` oraz link „To nie Ty? Wyloguj”. Sklep zwraca się do klientki w formie żeńskiej (np. „płaciłaś”), trzymaj się tego.

## 4. Menu

Link „Moje zamówienia” ma być widoczny w nagłówku na komputerze i w menu na telefonie. Jeśli klient ma zamówienie `delivered`, przy linku mała kropka w karminie.

## 5. Po płatności

`/zamowienie/[id]?status=success`, gdy status to jeszcze `pending_payment`:

- komunikat „Potwierdzamy płatność…”,
- odświeżanie (`router.refresh()`) co 3 s przez maks. 60 s,
- po 60 s: „Płatność jeszcze się przetwarza. Mail z kodem odbioru przyjdzie za chwilę, a zamówienie znajdziesz w Moich zamówieniach.” plus link.

Gdy status zmieni się na `paid`: normalny widok z kodem.

Status `expired` przy zamówieniu, za które Stripe potwierdził płatność (zdarzenie z promptu 10): zamiast „Wygasło” pokaż „Płatność doszła po czasie. Skontaktujemy się z Tobą” i telefon z ustawień.

## 6. SPEC

§9: `/konto` pokazuje zamówienia. Dopisz zachowanie strony po płatności.

## 7. Odbiór

1. `npm test`, `npm run lint`, `npm run build`.
2. Zamówienie testowe → po płatności widok „Potwierdzamy płatność…” przechodzi w kod (Stripe CLI z opóźnieniem albo bez `stripe listen` przez pierwsze 10 s).
3. `/konto` na 390 px i 1440 px: karta z kodem jest na górze.
4. Zaloguj się innym mailem: widać „Zalogowana jako …” i brak cudzych zamówień.
5. Menu mobilne ma „Moje zamówienia”.

Na koniec: zmienione pliki i jedno zdanie, jak przetestować.
