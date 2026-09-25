# 04 · Koszyk i ekran zamówienia

> Uruchamiasz **po** 03 (używasz `components/brand/*`, nowych `components/ui/*` i kalendarza dni). Zakres: `components/shop/cart-view.tsx`, `app/(shop)/koszyk/page.tsx`, `app/(shop)/zamowienie/[id]/page.tsx` i małe komponenty, których używają. **Logika płatności, walidacji, rabatów, kodów punktów, faktur i dostępności zostaje bez zmian** — przestawiasz układ i wygląd.

## 0. Zanim zaczniesz

1. Przeczytaj `docs/SPEC.md` (§6 reguły, §7 płatności, §13 lojalność).
2. `git status` czysty, inaczej zatrzymaj się i zapytaj.
3. Przed zmianą `cart-view.tsx` przeczytaj go w całości. Jeśli chcesz wydzielić podkomponenty, rób to w tym samym katalogu (`components/shop/cart/*`) i przenoś logikę 1:1, bez „ulepszeń”.

## 1. Koszyk — układ

- Góra: `SectionHeading` H1: eyebrow = `Zamówienie na {longDate}` (dzień z koszyka, `buildPickupCopy(day, cutoff, warsawDateIso()).longDate`; bez dnia — eyebrow `Koszyk`), tytuł `Koszyk`.
- Desktop (`lg`): `grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14 lg:items-start`. Lewa kolumna: pozycje, Odbiór, Uwagi, Faktura. Prawa: podsumowanie w `lg:sticky lg:top-28`.
- Telefon: jedna kolumna w tej samej kolejności, podsumowanie na końcu.
- Komunikaty o limitach / lead time (czerwone ramki) zostają, ale w stylu: `border-l-2 border-[var(--adj-red)] bg-[var(--adj-paper-light)] px-4 py-3 text-[15px]`.

### 1.1 Pozycje

`<ul className="border-t border-[var(--adj-ink)]">`, każda pozycja `grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 border-b border-[rgba(43,42,31,0.18)] py-5`:
- nazwa `font-heading text-[20px] lg:text-[22px] leading-[1.2] font-medium` (wielka litera + `nbsp`), pod nią `adj-ui text-sm text-[var(--adj-ink-soft)]` = `{Price unit} / szt.`,
- po prawej wartość pozycji `Price size="md"`,
- druga linia: `QtyStepper` (te same handlery co dziś: `tryIncrease`, `setQty`), obok `Button variant="link"` `Usuń` → `remove(item.productId)` (funkcja już jest w store koszyka),
- komunikat o braku sztuk dla pozycji — jak dziś, `text-sm text-[var(--adj-red)]`.

### 1.2 Odbiór

`SectionHeading` H2 `Odbiór` (`mt-12`).
- **Dzień**: zamiast `Select` użyj `DayPicker`-owego wyglądu, ale jako lokalny wybór (bez nawigacji): wydziel z `day-picker.tsx` czysty komponent `DayChips({ dates, selected, onSelect })` i użyj go w obu miejscach (`DayPicker` = `DayChips` + `router.push`). W koszyku `onSelect = handleDayChange` (ta sama funkcja co dziś), `dates` = to, co dziś idzie do `Select` (`dayOptions`).
- **Punkt odbioru**: zamiast `Select` lista kart-radio (`role="radiogroup"`, każda karta `<label>` z ukrytym `<input type="radio">`):
  - karta `flex gap-4 rounded-[4px] border bg-[var(--adj-paper-light)] px-5 py-4 cursor-pointer`, wybrana `border-[var(--adj-khaki)] ring-1 ring-[var(--adj-khaki)]`, pozostałe `border-[rgba(43,42,31,0.22)]`,
  - kółko radia `size-5 rounded-full border border-[var(--adj-ink)]/40`, wybrane z kropką khaki,
  - treść: nazwa `font-heading text-[19px] font-medium`, adres + opis `text-[15px] text-[var(--adj-ink-soft)]`, godziny `adj-ui text-[14px]` (`formatTimeRange`),
  - lista = `visiblePoints` (bez zmian w logice), `onChange` → `setPickupPoint`.
- Pole „Odbierasz w pracy? Wpisz kod od pracodawcy” zostaje (ta sama logika), w stylu: `Label` + `Input` + `Button variant="outline"` w rzędzie.

### 1.3 Uwagi i faktura

- Uwagi: `Label` `Uwagi do zamówienia`, `textarea` w stylu Input (min 96 px), licznik `adj-ui text-[13px]`.
- Faktura: checkbox z etykietą `Chcę fakturę na firmę` (kwadrat `size-5 rounded-[3px] border border-[var(--adj-ink)]/40 accent-[var(--adj-khaki)]`), pola NIP / nazwa / adres jak dziś.

### 1.4 Podsumowanie (prawa kolumna)

`<aside className="adj-framed px-6 py-7 lg:px-8">` (podwójna złota ramka jak naklejka na landingu):
- `adj-label text-[var(--adj-ink-soft)]` `Podsumowanie`,
- voucher / kod rabatowy — logika bez zmian, wygląd: przełącznik vouchera jako checkbox z etykietą `Użyj vouchera: {voucherLabel}`, kod: `Input` + `Button variant="outline"` `Sprawdź`,
- wiersze `mt-5 space-y-2 adj-ui text-[16px]`: `Suma` / `Rabat` (tylko gdy > 0) z `Price`,
- `Do zapłaty`: `mt-4 border-t border-[rgba(43,42,31,0.18)] pt-4 flex items-baseline justify-between`, etykieta `font-heading text-xl`, kwota `font-heading text-[34px] font-medium tabular-nums`,
- `belowMinimum` — komunikat jak dziś,
- `mt-3 adj-ui text-[14px] text-[var(--adj-ink-soft)]`: `Płatność online: BLIK, Przelewy24 albo karta. Paczkę odbierasz na kod.`
- checkbox regulaminu — jak dziś (linki do `/regulamin` i `/polityka-prywatnosci`),
- przycisk: `Button size="lg" className="mt-5 w-full"`: `Przejdź do płatności · {formatPrice(payableGrosze)}` (stany disabled jak dziś),
- niezalogowany: ten sam przycisk-link na `/logowanie?next=/koszyk` z tekstem `Zaloguj się, żeby zamówić`, pod spodem `mt-2 text-center adj-ui text-[13px] text-[var(--adj-ink-soft)]` `Logujesz się kodem z e‑maila.`

### 1.5 Pusty koszyk

Janosz zostaje (SPEC). Układ: `flex flex-col items-center py-16 text-center`, obrazek `w-[180px]`, `mt-6 font-heading text-[32px] font-medium` `Koszyk jest pusty`, `mt-2 text-[var(--adj-ink-soft)]` `Janosz czeka na zamówienie.`, `mt-8` `Button size="lg"` `Przejdź do sklepu` → `/sklep`.

### 1.6 Ładowanie

`Ładowanie koszyka…` zamień na szkielet: 3 wiersze `Skeleton` (`h-16`) w kolorze `bg-[var(--adj-cream-dark)]`.

## 2. Ekran zamówienia — `app/(shop)/zamowienie/[id]/page.tsx`

Dane i warunki statusów bez zmian. Nowe klocki w tym samym pliku (albo `components/shop/order/*`):

### 2.1 `PickupTicket` — kod odbioru jak bilet

`<section className="adj-framed px-6 py-8 lg:px-10 lg:py-10">`:
- `adj-label text-[var(--adj-ink-soft)]` `Kod odbioru`,
- `lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10`:
  - kod `mt-3 font-label [font-stretch:62%] font-extrabold text-[88px] lg:text-[112px] leading-[0.9] tracking-[0.06em] text-[var(--adj-red)]` z `aria-label="Kod odbioru {code}"`,
  - QR (`QrCode`, bez zmian) w ramce `bg-white p-3 border border-[rgba(43,42,31,0.18)] w-[168px] mt-6 lg:mt-0`,
- pod spodem `mt-6 border-t border-dashed border-[rgba(43,42,31,0.3)] pt-5` lista `dl` (wiersze `grid grid-cols-[110px_1fr] gap-3 py-1.5 text-[16px]`, `dt` = `adj-ui text-[14px] text-[var(--adj-ink-soft)]`): `Punkt` / nazwa, `Adres` / adres + opis, `Dzień` / `formatDatePl`, `Godziny` / `formatTimeRange`.
- `PatternFrame` przestaje być używany na tym ekranie.

### 2.2 `OrderLines` — pozycje

`border-t border-[var(--adj-ink)]`, wiersze `flex justify-between gap-4 border-b border-[rgba(43,42,31,0.18)] py-3 text-[16px]`: `{qty}× {nazwa}` / `Price`. Na końcu `Suma` jak w koszyku (`font-heading text-[28px]`).

### 2.3 Stany

Każdy stan zaczyna się od `SectionHeading` H1 z eyebrow `Zamówienie #{order_number}`:
- `pending_payment`: tytuł `Czeka na płatność`; pod nim `OrderCountdown` jako `adj-ui text-[15px]` w ramce `inline-flex border border-[var(--adj-red)] px-3 py-1.5 text-[var(--adj-red)]`; `PayOrderButton` (w stylu `Button size="lg"`), `OrderLines`, blok punktu (te same `dl` co w bilecie, bez kodu).
- `paid` / `in_production`: tytuł `Opłacone. Dziękujemy!`, opis `Kod przyszedł też e‑mailem. Pokaż go przy odbiorze.`; `PickupTicket`; `OrderLines`; `SaveStandingOrderButton` i anulowanie jak dziś (`Button variant="outline"`); na dole Janosz `w-[140px]` z podpisem `italic text-[15px] text-[var(--adj-ink-soft)]` `Janosz pakuje Twoje zamówienie.`
- `delivered`: tytuł `Paczka czeka na Ciebie`, opis `{point.name}, do {godzina}.`; `PickupTicket` z dodatkową etykietą nad kodem `LabelTag red` `Do odbioru`; `OrderLines`.
- `picked_up`: tytuł `Odebrane{ data}. Smacznego!`; `OrderLines`; `ReorderButton` (`Button`).
- `expired`: tytuł `Zamówienie wygasło`, opis `Płatność nie dotarła na czas, więc produkty wróciły do sprzedaży.`; `ReorderButton`.
- `cancelled` / `refunded`: tytuł `Zamówienie anulowane`, opis jak dziś (zwrot + telefon, jeśli jest).
- `PaymentCheckPoll` — bez zmian, ale jego komunikat w stylu `adj-ui text-[15px] text-[var(--adj-ink-soft)]`.

## 3. Drobne komponenty

- `components/shop/pay-order-button.tsx`, `reorder-button.tsx`, `save-standing-order-button.tsx`, `cancel-order-button.tsx`: tylko klasy (warianty `Button` z promptu 03), teksty bez zmian, chyba że mają „—” w środku zdania — wtedy zamień na przecinek lub kropkę.

## 4. Odbiór

1. `npm test`, `npm run lint`, `npm run build`.
2. Pełna ścieżka na 390 i 1440 px: dodaj produkty → koszyk (zmiana dnia na chipsach, wybór punktu kartą, kod pracodawcy, faktura, voucher) → płatność testowa Stripe → powrót na `/zamowienie/[id]` (poll) → bilet z kodem i QR.
3. Status `delivered` i `expired` sprawdź, zmieniając status w panelu na testowym zamówieniu.
4. Pusty koszyk z Janoszem.

Na koniec wypisz zmienione pliki i jedno zdanie, jak przetestować.
