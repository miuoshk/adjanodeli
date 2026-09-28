# 10 · Maile i płatności: audyt, dziennik, ponowne wysyłanie

> Uwaga Justyny: „klient nie dostał potwierdzenia zakupu na maila”. Zakres: droga od płatności do maila i to, żeby każdy mail było widać w panelu. Ceny, koszyk i statusy bez zmian. Bez nowych bibliotek.

## 0. Zanim zaczniesz

1. `git status`: poza nieśledzonymi `.cursor/`, `Claude outputs/`, `public/img/` dozwolone są tylko nowe i zmienione pliki w `docs/design/prompts/` (prompty rundy 1). Wejdą do commita tego promptu. Cokolwiek innego: zatrzymaj się i zapytaj.
2. Przeczytaj `docs/SPEC.md` §5, §7, §11.
3. Najpierw audyt (krok 1), potem zmiany. Nie poprawiaj niczego w trakcie audytu.

## 1. Audyt — `docs/audyt/2026-09-maile-i-platnosci.md`

Przejdź całą drogę i opisz każdy krok: plik, funkcja, co się dzieje, co może się nie udać po cichu i gdzie to widać.

`lib/orders/place-order.ts` → `lib/orders/pay-order.ts` (sesja Stripe, `metadata.order_id`, `success_url`) → `app/api/stripe/webhook/route.ts` (`mark_order_paid`) → `lib/email/send-order-paid.ts` → `lib/email/resend.ts`.

Odpowiedz wprost na te pytania:

- `sendEmail` przy błędzie robi tylko `console.error`. Kto się o tym dowiaduje? (Dziś nikt.)
- Webhook przy `ORDER_EXPIRED` loguje `[WEBHOOK][EXPIRED_PAID]` i nic więcej. Klient zapłacił, zamówienie ma status „Wygasło”, maila nie ma. Kto się o tym dowiaduje?
- Czy ponowienie webhooka przez Stripe (ten sam `checkout.session.completed` drugi raz) wyśle drugi mail?
- Czego `sendOrderPaid` wymaga (`customer_email`, `pickup_code`, punkt) i kiedy może tego brakować?
- Resend bez zweryfikowanej domeny wysyła maile tylko na adres właściciela konta Resend. Jaki format ma mieć `EMAIL_FROM` (adres w domenie `adjanodeli.pl`, a nie `onboarding@resend.dev`)?
- Czy linki w mailach biorą `NEXT_PUBLIC_APP_URL` i czy na produkcji musi to być `https://adjanodeli.pl`?

Na końcu raportu sekcja **„Do sprawdzenia ręcznie (Miłosz)”**: rzeczy, których nie widać w kodzie. Wypisz je jako listę do odhaczenia, co najmniej:

- Vercel → Settings → Environment Variables (Production): `RESEND_API_KEY`, `EMAIL_FROM`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`.
- Vercel → Logs: szukaj `[EMAIL]` i `[WEBHOOK]` z dnia zamówienia.
- Resend → Domains: `adjanodeli.pl` ma status Verified. Resend → Emails: czy próba wysyłki w ogóle była i z jakim wynikiem.
- Stripe → Developers → Webhooks: endpoint `…/api/stripe/webhook` na produkcyjnym adresie, zdarzenia `checkout.session.completed` i `checkout.session.expired`, ostatnie dostarczenia z kodem 200.
- Supabase: zapytanie tylko do odczytu, które pokaże status, `paid_at` i `user_id` konkretnego zamówienia po numerze. Wpisz gotowe SQL do raportu.

## 2. Dziennik maili

Migracja `supabase/migrations/0021_email_log.sql`:

- tabela `email_log`: `id uuid pk default gen_random_uuid()`, `order_id uuid null references orders on delete set null`, `kind text not null check (kind in ('order_paid','order_delivered','standing_reminder','special_request_owner','manual_refund_owner','paid_after_expiry_owner','test'))`, `recipient text not null`, `status text not null check (status in ('sent','failed','skipped'))`, `provider_id text`, `error text`, `created_at timestamptz not null default now()`;
- indeks `(order_id, kind)`;
- RLS włączone, `select` tylko dla `is_staff()`. Zapis wyłącznie kluczem serwisowym (bez polityk insert dla klientów).

Potem `npx supabase db push` i `npm run db:types`. Typy tylko z generatora.

`lib/email/resend.ts`: `sendEmail` dostaje dodatkowo `kind` i opcjonalne `orderId`. Po każdej próbie zapisuje wiersz: `sent` z id z Resend albo `failed` z treścią błędu (maks. 500 znaków). Brak `RESEND_API_KEY` lub `EMAIL_FROM` to też `failed` z czytelnym opisem. Funkcja nadal nigdy nie rzuca wyjątku. Zaktualizuj wszystkie wywołania.

## 3. Bez podwójnych maili

`sendOrderPaid(orderId, { force })` i `sendOrderDelivered(orderId, { force })`: jeśli w `email_log` jest już `sent` dla tej pary `(order_id, kind)` i nie ma `force`, nie wysyłaj i zapisz `skipped`. Test jednostkowy tej logiki.

## 4. Zapłacone po wygaśnięciu

Webhook przy `ORDER_EXPIRED`: wyślij właścicielowi mail `paid_after_expiry_owner` (nowy szablon w stylu pozostałych, temat `Klient zapłacił za wygasłe zamówienie #{numer}`). W treści: numer, e-mail klienta, kwota, punkt i dzień, link do zamówienia w panelu i jedno zdanie, co zrobić: zwrot w Stripe albo telefon do klienta. Dopisz zdarzenie do `order_events` z notatką „Opłacone po wygaśnięciu”. Na stronie zamówienia w panelu pokaż to jako wyraźną informację na górze.

## 5. Panel: maile przy zamówieniu

`app/admin/(panel)/zamowienia/[id]/page.tsx`: nowa sekcja „Maile” z listą z `email_log` (rodzaj po polsku, adres, data i godzina, „Wysłany” albo „Nie doszedł” z treścią błędu). Przyciski:

- „Wyślij ponownie potwierdzenie”: statusy `paid`, `in_production`, `delivered`;
- „Wyślij ponownie „paczka czeka””: status `delivered`.

Oba z `force`. Po kliknięciu toast z wynikiem i odświeżenie listy. Dostęp: staff i owner.

Lista zamówień: przy zamówieniu, którego ostatni mail `order_paid` ma `failed`, mała etykieta „Mail nie doszedł”.

## 6. Ustawienia: stan poczty i płatności

`app/admin/(panel)/ustawienia/page.tsx` (tylko owner): karta „Poczta i płatności”:

- czy są ustawione `RESEND_API_KEY`, `STRIPE_WEBHOOK_SECRET` (tylko tak/nie, **nigdy wartości**);
- wartość `EMAIL_FROM` i `NEXT_PUBLIC_APP_URL` (nie są tajne);
- 10 ostatnich wierszy `email_log`;
- przycisk „Wyślij testowy mail” na adres właściciela (`kind = 'test'`).

## 7. SPEC

§11: dopisz dziennik maili, brak podwójnych wysyłek i mail `paid_after_expiry_owner`. §7: zachowanie webhooka przy `ORDER_EXPIRED`.

## 8. Odbiór

1. `npm test`, `npm run lint`, `npm run build`.
2. Lokalnie ze Stripe CLI (`stripe listen --forward-to localhost:3002/api/stripe/webhook`): zamówienie → płatność testowa → mail przychodzi → w panelu w „Maile” jest `Wysłany`.
3. `stripe events resend <id>` na tym samym zdarzeniu: drugi mail nie wychodzi, w dzienniku jest `skipped`.
4. Usuń lokalnie `EMAIL_FROM` i zapłać: w dzienniku `Nie doszedł` z opisem, w liście zamówień etykieta „Mail nie doszedł”, po przywróceniu zmiennej „Wyślij ponownie potwierdzenie” działa.
5. „Wyślij testowy mail” w Ustawieniach dochodzi.

Na koniec: lista zmienionych plików, raport z kroku 1 i jedno zdanie, co Miłosz ma sprawdzić ręcznie w pierwszej kolejności.
