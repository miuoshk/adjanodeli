# Audyt: maile i płatności (2026-09)

Stan kodu przed zmianami z promptu 10. Opisuje drogę od złożenia zamówienia do maila z potwierdzeniem. Nic w tym pliku nie jest jeszcze poprawione.

## 1. `placeOrder` — `lib/orders/place-order.ts`

Funkcja `placeOrder`.

1. Brak sesji: zwraca `NOT_AUTHENTICATED`. Klient widzi „Zaloguj się, żeby zamówić.”
2. Zod (`placeOrderSchema`) albo niekompletna faktura: zwraca komunikat, zamówienie nie powstaje.
3. `supabase.rpc("create_order", …)` — jedyne miejsce, które zapisuje zamówienie. W SQL powstaje status `pending_payment`, `pickup_code`, snapshot `customer_email` z profilu (`profiles.email`), `expires_at` (TTL z ustawień, domyślnie 30 min).
4. Błąd RPC jest mapowany w `parseRpcError` i wraca do koszyka. To nie jest cicha ścieżka.
5. Po sukcesie, jeśli klient chciał fakturę, jest `profiles.update`. Błąd tego zapisu jest ignorowany. Zamówienie już istnieje, płatność i tak rusza. Nie dotyczy maila.
6. `payOrder(data)`. Gdy płatność się otworzy: `{ ok: true, orderId, url }` (adres Checkout). Gdy się nie otworzy: i tak `{ ok: true, orderId, url: /zamowienie/{id} }`. Klient ląduje na stronie zamówienia bez Checkout. Komunikat z `payOrder` jest wtedy porzucany.

## 2. `payOrder` — `lib/orders/pay-order.ts`

Funkcja `payOrder`.

1. Złe id albo brak sesji: `NOT_PAYABLE` / redirect do logowania.
2. Odczyt zamówienia sesją użytkownika (RLS: własne). Musi być `pending_payment`, `expires_at` w przyszłości, co najmniej jedna pozycja.
3. Jeśli jest `stripe_checkout_session_id` i sesja Stripe jest nadal `open`, zwraca ten sam URL. Drugiej sesji nie tworzy.
4. Suma po rabacie `< 1000` gr: komunikat o minimum 10,00 zł. Do Stripe nie idzie.
5. Brak `NEXT_PUBLIC_APP_URL`: `appUrl()` rzuca wyjątek, łapany niżej. Klient widzi „Nie udało się otworzyć płatności.” W logu jest `[PAY]`.
6. `checkout.sessions.create`:
   - `mode: payment`, `currency: pln`, `payment_method_types: ['blik','card']`, `locale: 'pl'`
   - `metadata: { order_id }`, `client_reference_id = order.id`
   - `customer_email` ze snapshotu zamówienia
   - `expires_at` = teraz + 30 min (osobno od `orders.expires_at`)
   - `success_url`: `{NEXT_PUBLIC_APP_URL}/zamowienie/{id}?status=success`
   - `cancel_url`: `{NEXT_PUBLIC_APP_URL}/koszyk?cancelled=1`
   - pozycje z `unit_price_grosze`; przy rabacie kupon `amount_off`
7. Brak `session.url`: komunikat, bez zapisu id sesji.
8. `service_role` zapisuje `stripe_checkout_session_id`. Błąd zapisu: komunikat, sesja w Stripe już jest. Klient nie dostaje URL. Może spróbować ponownie; stara sesja nie jest podpięta pod zamówienie, więc powstanie druga.
9. Wyjątek Stripe (klucz, sieć): `console.error("[PAY]", order.id, error)` i ten sam komunikat dla klienta. Nikt poza logiem Vercela tego nie dostaje mailem.

Maila tu jeszcze nie ma. Potwierdzenie zakupu nie wychodzi z sukcesu Checkout, tylko z webhooka.

## 3. Webhook — `app/api/stripe/webhook/route.ts`, `POST`

1. Brak `STRIPE_WEBHOOK_SECRET` albo nagłówka `stripe-signature`: HTTP 400 `Invalid signature`. Stripe ponowi dostawę.
2. `constructEvent` nie zgadza podpisu: też 400. Stripe ponowi.
3. Dla `checkout.session.completed` i `checkout.session.expired` id zamówienia bierze `orderIdFromSession`: najpierw `metadata.order_id`, potem `client_reference_id`.
4. Zawsze `console.log("[WEBHOOK]", event.type, orderId)`.
5. Inne typy zdarzeń: HTTP 200 `{ received: true }` i nic więcej.

### `checkout.session.completed`

1. Brak `orderId`: nic nie robi, HTTP 200. Stripe nie ponawia. Zamówienie zostaje `pending_payment`, aż cron je wygasi. Maila nie ma.
2. `mark_order_paid(p_order_id, p_payment_intent_id)` kluczem serwisowym. Funkcja w `supabase/migrations/0006_loyalty.sql`:
   - brak wiersza: `ORDER_NOT_FOUND`
   - status już `paid`: `return` bez błędu (idempotencja statusu, nie maila)
   - status `expired`: `ORDER_EXPIRED` — status zostaje „Wygasło”, `paid_at` się nie ustawia, pieczątek nie ma
   - inny status niż `pending_payment`: `INVALID_TRANSITION`
   - `pending_payment`: status `paid`, `paid_at = now()`, `stripe_payment_intent_id`, wpis w `order_events`, `grant_stamps_for_order`
3. Błąd RPC z tekstem `ORDER_EXPIRED`: tylko `console.error("[WEBHOOK][EXPIRED_PAID]", orderId)`. Maila nie ma. HTTP 200, więc Stripe uznaje dostawę za udaną i nie ponawia.
4. Inny błąd RPC: `console.error("[WEBHOOK]", …)` i HTTP 200. Też bez ponowienia.
5. Brak błędu (w tym „już było paid”): `sendOrderPaid(orderId)`.
6. Wyjątek w tym bloku: `console.error` i i tak HTTP 200.

### `checkout.session.expired`

`expire_order`. Błąd tylko w `console.error`. HTTP 200. To ścieżka „klient nie zapłacił”, nie „zapłacił po czasie”.

## 4. `sendOrderPaid` — `lib/email/send-order-paid.ts`

Funkcja `sendOrderPaid(orderId)`. Klucz serwisowy.

Wymaga jednocześnie:

- `orders.customer_email` — kolumna `not null`, snapshot z profilu w `create_order`. Pusty string też odpada (`!order.customer_email`).
- `orders.pickup_code` — w schemacie nullable, `create_order` ustawia go zawsze. Brakuje go tylko, gdy wiersz jest spoza tej funkcji.
- zagnieżdżony `pickup_points` — `pickup_point_id` jest `not null` i bez `on delete set null`, więc punkt nie znika spod zamówienia. Brak w joinie to błąd odczytu, nie zwykły przypadek.

Gdy czegoś z tego nie ma: `console.error("[EMAIL]", …)` i `{ ok: false }`. Webhook i tak zwraca 200. Nikt nie dostaje maila ani wpisu w panelu.

Dalej, zanim wyśle:

- `loyalty_status` i vouchery wydane od `paid_at` — tylko do linijki o pieczątkach. Jak to rzuci, cały `try` kończy się `console.error("[EMAIL]")` i mail nie idzie, mimo że zamówienie jest `paid`.
- `settings.owner_phone` — jak brak, telefon w stopce jest pusty, mail i tak wychodzi.

Temat: `Zamówienie #{order_number} — kod odbioru {pickup_code}`.
Link „szczegóły”: `` `${NEXT_PUBLIC_APP_URL}/zamowienie/${id}` ``. Pusty env daje ścieżkę względną `/zamowienie/…`, w skrzynce bezużyteczną.

## 5. `sendEmail` — `lib/email/resend.ts`

1. Brak `RESEND_API_KEY` albo `EMAIL_FROM`: `console.error("[EMAIL]", "Brak RESEND_API_KEY albo EMAIL_FROM.")`, `{ ok: false }`.
2. `resend.emails.send({ from, to, subject, react })`. Błąd API: `console.error("[EMAIL]", error)`, `{ ok: false }`.
3. Wyjątek: to samo.
4. Sukces: `{ ok: true }`. Id z Resend jest odrzucane (`const { error }`).

Funkcja nie rzuca. Wołający (webhook, cron, akcja statusu) wyniku prawie nie pokazują. `sendManualRefundOwner` wynik w ogóle ignoruje.

## Odpowiedzi

**`sendEmail` przy błędzie robi tylko `console.error`. Kto się o tym dowiaduje?**
Nikt. Wpis ląduje w logu funkcji na Vercelu, z prefiksem `[EMAIL]`. Nie ma maila do właściciela, nie ma wiersza w bazie, nie ma oznaczenia przy zamówieniu. Webhook po nieudanym mailu zwraca 200, więc Stripe nie ponowi zdarzenia sam z siebie.

**Webhook przy `ORDER_EXPIRED` loguje `[WEBHOOK][EXPIRED_PAID]` i nic więcej. Kto się o tym dowiaduje?**
Nikt. Klient zapłacił, zamówienie zostaje w statusie „Wygasło”, `paid_at` puste, potwierdzenia nie ma. Właściciel nie dostaje maila. Odpowiedź jest 200, więc Stripe nie ponawia. Widać to tylko w logu Vercela, jeśli ktoś tam zajrzy.

**Czy ponowienie tego samego `checkout.session.completed` wyśle drugi mail?**
Tak. `mark_order_paid` przy statusie `paid` kończy się bez błędu i nie wysyła maila. Webhook traktuje to jak sukces i woła `sendOrderPaid` drugi raz. Nie ma dziennika ani sprawdzenia „ten mail już poszedł”. Drugi (i kolejny) mail wychodzi.

**Czego `sendOrderPaid` wymaga i kiedy może tego brakować?**
`customer_email`, `pickup_code` i wiersz punktu. E-mail jest `not null` i kopiowany z profilu przy `create_order` — brakuje go praktycznie tylko jako pusty string. Kod odbioru jest nullable w tabeli, ale `create_order` go losuje; brak to zamówienie nie z tej funkcji albo wyścig przed zapisem kodu. Punkt jest wymagany kluczem obcym. Do tego mail nie wyjdzie, gdy rzuci odczyt lojalności, zabraknie klucza Resend albo `EMAIL_FROM`, albo Resend odrzuci wysyłkę.

**Jaki format ma mieć `EMAIL_FROM`?**
Adres w domenie `adjanodeli.pl`, nie `onboarding@resend.dev`. SPEC podaje przykład `AdjanoDeli <zamowienia@adjanodeli.pl>`. Bez zweryfikowanej domeny Resend puszcza pocztę tylko na adres właściciela konta Resend — klient sklepu jej nie dostanie, a błąd widać wyłącznie w logu `[EMAIL]`.

**Czy linki biorą `NEXT_PUBLIC_APP_URL` i czy na produkcji ma to być `https://adjanodeli.pl`?**
Tak. `payOrder` składa z tego `success_url` i `cancel_url` i bez zmiennej w ogóle nie otwiera płatności. `sendOrderPaid` i `sendOrderDelivered` składają z tego link do `/zamowienie/{id}` (przy pustej zmiennej link jest względny). Logo w `lib/email/templates/shell.tsx` też bierze ten adres. Na produkcji wartość ma być `https://adjanodeli.pl`, bez ukośnika na końcu. Inny host (podgląd Vercela, `www` tylko wtedy, gdy to nie jest kanoniczny adres) wyśle ludzi i obrazki na zły serwer.

## Gdzie to widać dziś

| Co się stało | Gdzie widać |
| --- | --- |
| Płatność się nie otworzyła | Koszyk albo cichy powrót na stronę zamówienia (`placeOrder` gubi komunikat) |
| Webhook odrzucił podpis | Stripe: dostawa ≠ 200, log `[WEBHOOK]` nie powstaje |
| `ORDER_EXPIRED` | Tylko log `[WEBHOOK][EXPIRED_PAID]` |
| Mail nie wyszedł | Tylko log `[EMAIL]` |
| Mail wyszedł dwa razy | Skrzynka klienta, nigdzie w panelu |

## Do sprawdzenia ręcznie (Miłosz)

- [ ] Vercel → Settings → Environment Variables (Production): `RESEND_API_KEY`, `EMAIL_FROM`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`.
- [ ] `EMAIL_FROM` to adres w domenie `adjanodeli.pl` (na przykład `AdjanoDeli <zamowienia@adjanodeli.pl>`), nie `onboarding@resend.dev`.
- [ ] `NEXT_PUBLIC_APP_URL` na produkcji to `https://adjanodeli.pl`.
- [ ] Vercel → Logs: szukaj `[EMAIL]` i `[WEBHOOK]` z dnia zamówienia.
- [ ] Resend → Domains: `adjanodeli.pl` ma status Verified. Resend → Emails: czy próba wysyłki w ogóle była i z jakim wynikiem.
- [ ] Stripe → Developers → Webhooks: endpoint `https://adjanodeli.pl/api/stripe/webhook`, zdarzenia `checkout.session.completed` i `checkout.session.expired`, ostatnie dostarczenia z kodem 200.
- [ ] Supabase, tylko odczyt. Podmień numer zamówienia:

```sql
select order_number, status, paid_at, user_id, customer_email, pickup_code, stripe_payment_intent_id
from public.orders
where order_number = 0;
```

`paid_at` puste przy statusie `expired` i ustawionym `stripe_payment_intent_id` nie wystąpi samo: przy `ORDER_EXPIRED` funkcja nie zapisuje intentu. Sam status `expired` bez maila w Resend oznacza, że webhook albo nie doszedł, albo doszedł po wygaśnięciu i został tylko zalogowany.
