# 22 · Rabat za ilość

> Prośba Justyny z 5.10: „przy zakupie jednorazowo powyżej 20 sztuk rabat 10%, a przy 40 sztukach łącznie 20%”. Zakres: progi rabatu w ustawieniach, liczenie w `create_order`, koszyk, zamówienie, maile i panel. Bez nowych bibliotek.

**Przed startem uzupełnij w tym pliku odpowiedzi Justyny** (sekcja „Ustalenia”). Bez nich Cursor ma przyjąć domyślne wartości z nawiasów.

## Ustalenia

- Progi: od **[20]** sztuk −**[10]**%, od **[40]** sztuk −**[20]**%. („Powyżej 20” = od 21? Wpisz, co mówi Justyna).
- Sztuki liczone ze **[wszystkich produktów w zamówieniu]**. (Czy jakieś kategorie, np. torty, mają być wyłączone?)
- Rabat za ilość **[nie łączy się]** z voucherem lojalnościowym ani kodem rabatowym. System bierze **[korzystniejszy dla klienta]**.

## 0. Zanim zaczniesz

1. `git status`: prompt 21 zacommitowany, poza nieśledzonymi `.cursor/settings.json`, `Claude outputs/`, `public/img/` czysto.
2. Przeczytaj `docs/SPEC.md` (rabaty, vouchery, kody, minimum zamówienia, Stripe coupon), ostatnią definicję `create_order`, `lib/loyalty/discount.ts`, `lib/orders/place-order.ts`, `lib/orders/pay-order.ts`, `components/shop/cart-view.tsx`.
3. Zasady z `.cursor/rules/adjano.mdc` o migracjach i testowaniu funkcji SQL obowiązują.

## 1. Model

Migracja `supabase/migrations/0028_volume_discount.sql` (sprawdź numer i dopisz wpis do tabeli „Historia migracji” w `00-KOLEJNOSC.md`):

- `settings.volume_discount_enabled boolean not null default false`;
- `settings.volume_discount_tiers jsonb not null default '[{"min_qty":20,"pct":10},{"min_qty":40,"pct":20}]'` (wartości z „Ustaleń”); maks. 3 progi, `min_qty` rosnąco, `pct` 1–50;
- `orders.discount_source text null check (discount_source in ('voucher','code','volume'))` i `orders.discount_pct int null`. Dla starych zamówień uzupełnij `discount_source` z `voucher` / `discount_code_id`, gdzie się da;
- jeśli w „Ustaleniach” są wykluczone kategorie: `categories.excluded_from_volume_discount boolean not null default false`.

## 2. Liczenie w `create_order`

- Liczba sztuk = suma `qty` pozycji (bez wykluczonych kategorii, jeśli są).
- Próg = najwyższy spełniony. Rabat = `pct`% od sumy pozycji (z dopłatami za opcje), zaokrąglony w dół do grosza, tak jak `computeDiscount` (`Math.floor`). Zapisz to w SPEC.
- Gdy klient wybrał voucher albo kod: policz oba, zastosuj korzystniejszy dla klienta. Niezastosowany voucher **nie** zostaje zużyty, niezastosowany kod nie liczy się jako użyty.
- Zapisz `discount_grosze`, `discount_source`, `discount_pct`.
- Minimum 10 zł po rabacie i reszta logiki bez zmian.
- Test SQL: 19, 20, 39, 40 sztuk; rabat ilościowy przeciw voucherowi −10% i −50%; kod z `max_discount_grosze`; wyłączone ustawienie.

## 3. Koszyk

- Pod sumą linijka postępu, gdy rabat jest włączony: „Jeszcze 3 sztuki do rabatu 10%”. Po osiągnięciu: „Rabat za ilość: −10%”, z kwotą.
- Gdy klient ma voucher albo kod, a rabat za ilość jest korzystniejszy: „Rabat za ilość jest dla Ciebie lepszy. Voucher zostaje na następne zamówienie.” I odwrotnie.
- Ten sam wynik, który liczy baza. Koszyk tylko pokazuje podgląd, decyduje `create_order`.
- Limit `max_qty_per_item` zostaje (15 sztuk jednego produktu, wyżej formularz zamówienia specjalnego). Rabat liczy sumę sztuk ze wszystkich pozycji.

## 4. Płatność, maile, panel

- Stripe: ten sam mechanizm kuponu co dziś, nazwa kuponu zależna od źródła: „Rabat za ilość 20%”, „Voucher Adjano Deli”, kod.
- Mail `order-paid`, strona zamówienia klienta, szczegóły zamówienia w panelu, eksport CSV: rodzaj rabatu i procent.
- Statystyki: rabaty w podziale na źródło, jeśli statystyki pokazują dziś rabaty.

## 5. Ustawienia (owner)

Karta „Rabat za ilość”: włącz / wyłącz, progi (od ilu sztuk, ile procent, maks. 3), podgląd zdania, które zobaczy klient. Przy włączonym rabacie na górze `/sklep` jedna linijka: „Od 20 sztuk −10%, od 40 sztuk −20%”.

## 6. SPEC i Pomoc

SPEC: rabaty (zasada wyboru korzystniejszego, nowe kolumny), `create_order`. `/admin/pomoc`: jak ustawić progi i co widzi klient.

## 7. Odbiór

1. `npm test`, `npm run lint`, `npm run build`, testy SQL.
2. Koszyk z 19, 20 i 40 sztukami: komunikaty, kwoty, płatność testowa ze Stripe z kuponem.
3. Klient z voucherem −50% i 25 sztukami: zostaje voucher, rabat za ilość nie. Z voucherem −10% i 40 sztukami: rabat za ilość, voucher dalej ważny.
4. Mail, panel, CSV pokazują rodzaj rabatu.
5. Wyłączenie w Ustawieniach: koszyk i `create_order` działają jak przed zmianą.

Na koniec: zmienione pliki i jedno zdanie, jak przetestować.
