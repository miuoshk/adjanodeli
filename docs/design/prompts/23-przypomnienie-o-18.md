# 23 · Przypomnienie o 18:00 dzień przed odbiorem (za zgodą)

> Prośba Justyny z 5.10: „automatyczne przypomnienie każdemu zarejestrowanemu, np. o 18:00 dzień wcześniej”. Mail „zamów na jutro” to informacja handlowa. Od 10.11.2024 art. 398 Prawa komunikacji elektronicznej wymaga **uprzedniej zgody** odbiorcy i nie ma wyjątku dla obecnych klientów. Wysyłamy więc tylko do osób, które same to włączyły. Obecna zgoda `marketing_consent` („mail, gdy pojawi się coś nowego w menu”) dotyczy czegoś innego i **nie** może być użyta do przypomnień. Zakres: zgoda, miejsca jej zbierania, wysyłka o 18:00, wypisanie jednym kliknięciem. Bez nowych bibliotek.

## 0. Zanim zaczniesz

1. `git status`: prompt 22 zacommitowany, poza nieśledzonymi `.cursor/settings.json`, `Claude outputs/`, `public/img/` czysto.
2. Przeczytaj `docs/SPEC.md` §14 (stałe zamówienia i ich przypomnienie o 17:00), `lib/standing-orders/send-reminders.ts`, `app/api/cron/standing-reminders/route.ts`, `vercel.json`, `lib/email/resend.ts`, `components/shop/profile-form.tsx`, `app/(shop)/polityka-prywatnosci/page.tsx`.

## 1. Zgoda

Migracja `supabase/migrations/0029_daily_reminder.sql` (sprawdź numer, dopisz do „Historii migracji”):

- `profiles.daily_reminder boolean not null default false`;
- `profiles.daily_reminder_consent_at timestamptz null`, `profiles.daily_reminder_consent_text text null` (dokładne brzmienie zgody w chwili zaznaczenia);
- `profiles.daily_reminder_prompted_at timestamptz null` (kiedy ostatnio zapytaliśmy, żeby nie męczyć);
- `profiles.unsubscribe_token uuid not null default gen_random_uuid()` (unikalny);
- `settings.daily_reminder_enabled boolean not null default false`;
- `email_log.kind`: dopisz `daily_reminder`.

Brzmienie zgody (stała w kodzie, zapisywana przy włączeniu):
„Chcę dostawać maila o 18:00 w dni przed odbiorem z przypomnieniem, że można zamówić na jutro. Mogę to wyłączyć w każdej chwili jednym kliknięciem w mailu albo na koncie.”

Pole nigdy nie jest zaznaczone z góry. Włączenie zawsze wymaga kliknięcia klienta.

## 2. Gdzie klient może to włączyć

- **Po płatności**, na stronie zamówienia (`/zamowienie/[id]` przy statusie opłaconym): karta „Przypomnieć Ci jutro o 18:00, żeby zamówić na kolejny dzień?” z przyciskiem „Tak, przypominaj” i małym „Nie, dziękuję”. Oba zapisują `daily_reminder_prompted_at`. Pod przyciskiem drobnym drukiem brzmienie zgody.
- **`/konto`**: przełącznik „Przypomnienie o 18:00” z tym samym tekstem.
- **Jednorazowy pasek** dla zalogowanych, którzy nie zdecydowali (`daily_reminder_prompted_at is null`): ta sama propozycja, zamykany krzyżykiem. Po zamknięciu nie wraca przez 30 dni.
- **Nie** w mailach transakcyjnych i **nie** jako mail do wszystkich z pytaniem o zgodę: prośba o zgodę wysłana mailem bez zgody bywa uznawana za informację handlową, więc tej drogi nie używamy.

## 3. Wysyłka

Nowa trasa `app/api/cron/daily-reminders/route.ts` (`Authorization: Bearer CRON_SECRET`, jak przypomnienia stałych zamówień). `vercel.json`: dwa wpisy, `0 16 * * *` i `0 17 * * *` (UTC). W kodzie sprawdź, że w Warszawie jest między 17:45 a 18:59, żeby przy zmianie czasu nie wysłać dwa razy. Na planie Hobby Vercel uruchamia cron z dokładnością do godziny, więc mail przyjdzie między 18:00 a 18:59. Na Pro co do minuty. Zapisz to w komentarzu przy trasie.

Do kogo:

- `settings.daily_reminder_enabled = true`;
- jutro jest dniem odbioru (pierwszy dzień z `available_pickup_dates()` to jutro);
- `daily_reminder = true`;
- klient nie ma jeszcze opłaconego zamówienia na jutro;
- klient nie dostał dziś przypomnienia o stałym zamówieniu (`email_log`, `standing_reminder`, dziś);
- nie dostał dziś `daily_reminder` (ochrona przed podwójnym uruchomieniem).

Treść (szablon w stylu pozostałych maili, temat: `Zamówienie na jutro przyjmujemy do {cutoff}`):

- jedno zdanie: „Jutro odbiór w {punkt}, {godziny}. Zamówienia przyjmujemy do {cutoff}.” (punkt z ostatniego zamówienia klienta; gdy go nie ma, bez tego fragmentu);
- przycisk „Zamów na jutro” → `/sklep?src=przypomnienie`;
- na dole: „Nie chcesz tych przypomnień? Wyłącz je jednym kliknięciem” → `/przypomnienia/wypisz?t={unsubscribe_token}`;
- nagłówki `List-Unsubscribe` (link i `mailto:` z adresu właścicielki) oraz `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (Resend przyjmuje własne `headers`).

Wysyłka partiami (np. po 50, z krótką przerwą), każda próba w `email_log`.

## 4. Wypisanie

`/przypomnienia/wypisz?t=…`: bez logowania. GET pokazuje „Wyłączyć przypomnienia o 18:00?” z przyciskiem. POST (także z nagłówka one-click) ustawia `daily_reminder = false`. Potwierdzenie: „Wyłączone. Możesz je włączyć z powrotem na koncie.” Zły token: ten sam spokojny komunikat bez szczegółów.

## 5. Panel

- Ustawienia (owner): przełącznik „Przypomnienia o 18:00”, liczba osób z włączonym przypomnieniem, przycisk „Wyślij do mnie próbne przypomnienie”.
- Statystyki: liczba zamówień z `src=przypomnienie` w ostatnich 30 dniach (parametr przenieś do zamówienia, np. w `orders` albo w zdarzeniu, wybierz prostszą drogę i opisz w SPEC).

## 6. Prawo i teksty

- `polityka-prywatnosci`: nowy punkt o przypomnieniach: cel, podstawa (zgoda), jak wycofać.
- SPEC: zgoda, cron, warunki wysyłki, wypisanie. Dopisz zdanie, że `marketing_consent` nie obejmuje przypomnień.
- `/admin/pomoc`: czym jest przypomnienie, czemu nie można wysłać go wszystkim (jedno zdanie o wymogu zgody) i jak zachęcić klientów do włączenia (pasek, karta po płatności, plakat w punkcie).

## 7. Odbiór

1. `npm test`, `npm run lint`, `npm run build`, test SQL zapytania o odbiorców.
2. Nowe konto: brak przypomnień, dopóki klient nie kliknie „Tak, przypominaj”. Zgoda zapisana z datą i treścią.
3. Wywołanie trasy z `CRON_SECRET` o 18:10 czasu warszawskiego (podstaw czas w teście): mail przychodzi do osoby ze zgodą, nie przychodzi do osoby z zamówieniem na jutro ani do osoby, która dostała przypomnienie o stałym zamówieniu.
4. Drugie wywołanie tego samego dnia nic nie wysyła.
5. Link „Wyłącz” działa bez logowania, w Gmailu widać przycisk „Anuluj subskrypcję”.
6. Przy wyłączonym ustawieniu nic nie wychodzi.

Na koniec: zmienione pliki i jedno zdanie, jak przetestować.
