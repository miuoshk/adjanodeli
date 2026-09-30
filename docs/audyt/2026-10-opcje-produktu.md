# Audyt: opcje produktu (2026-10)

Klucz koszyka to dziś sam `productId`. `order_items` nie ma zdjęcia wyboru. Cena jednostkowa to cena produktu.

## Koszyk i sklep

- `lib/store/cart.ts` — `CartItem` i `add` / `remove` / `setQty` łączą pozycje po `productId`. Klucz ma być `productId` plus posortowane `optionIds`, a stary koszyk bez `optionIds` wczytuje się jako pusta lista.
- `components/shop/product-card.tsx` — „Dodaj” wrzuca produkt od razu. Przy opcjach otwiera okno wyboru; bez opcji zostaje jedno kliknięcie.
- `app/(shop)/sklep/[kategoria]/page.tsx` — ładuje produkty bez grup. Ma dociągnąć aktywne grupy i opcje i podać je karcie.
- `components/shop/cart-view.tsx` — lista, ilość, usuwanie i `placeOrder` idą po `productId`. Pod nazwą ma być linijka wyboru, brak wymaganej opcji blokuje płatność, a ilość i usuwanie idą po kluczu pozycji.
- `app/(shop)/koszyk/page.tsx` — tylko renderuje koszyk. Bez zmiany danych, dopóki widok sam pilnuje braku opcji.
- `components/shop/reorder-button.tsx` — woła `add` pozycjami z zamówienia. Pozycja ma nieść `optionIds`, inaczej ponowne zamówienie zgubi sos.
- `app/(shop)/zamowienie/[id]/page.tsx` — `toCartItems` i `OrderLines` pokazują samą nazwę. Linia ma mieć dopisek w nawiasie, a ponowne zamówienie te same opcje.

## Składanie zamówienia

- `lib/orders/place-order.ts` — schemat pozycji to `{ productId, qty }`. Dodać `optionIds` i komunikaty `OPTIONS_REQUIRED` oraz `OPTIONS_INVALID`.
- `supabase/migrations/0017_pickup_visibility.sql` — ostatnia pełna `create_order`; `0020_order_minimum_10pln.sql` zmienia tylko próg na 10 zł. Nowa funkcja ma przyjąć `option_ids`, sprawdzić grupy, doliczyć dopłatę i zostawić limity, czas przygotowania, rabaty, fakturę, minimum i widoczność punktów.
- `lib/orders/pay-order.ts` — nazwa w Stripe to `product_name`. Do nazwy pozycji dopisać wybór, kwota zostaje `unit_price_grosze` (już z dopłatą).

## Odczyt pozycji

- `app/(shop)/zamowienie/[id]/page.tsx` — lista pozycji. Format `2× nazwa (sos czosnkowy)`.
- `app/(shop)/moje-zamowienia/page.tsx` i `app/(shop)/konto/page.tsx` — karty nie pokazują pozycji, tylko link do szczegółów. Dodać jedną linijkę pozycji z opcjami.
- `components/shop/customer-order-list.tsx` — miejsce na tę linijkę.
- `lib/email/send-order-paid.ts` i `lib/email/templates/order-paid.tsx` — nazwa pozycji w mailu. Ta sama linia z nawiasem.
- `lib/admin/queries.ts` — `summarizeItems`, lista zamówień, paczki, wydawanie. Do podsumowania i nazw na etykiecie dodać wybór.
- `app/admin/(panel)/zamowienia/[id]/page.tsx` — `product_name × qty`. Dopisać wybór.
- `app/admin/(panel)/zamowienia/page.tsx` — pokazuje `itemsSummary` z zapytań. Wystarczy zmiana `summarizeItems`.
- `lib/admin/export-orders.ts` — wiersz zamówienia bez pozycji. Nowa kolumna „Opcje”.
- `lib/admin/queries.ts` `getProductionData` i `production_summary` — suma per produkt. Dodać rozbicie kombinacji opcji.
- `components/admin/production-table.tsx` — wiersz produktu. Pod sumą tekst „czosnkowy 3 · pomidorowy 2”, także na wydruku.
- `app/admin/(panel)/paczki/page.tsx` i `app/admin/paczki/drukuj/page.tsx` — nazwa pozycji z zapytania paczek. Nazwa na etykiecie ma mieścić wybór; `lib/labels/fit-label.ts` dalej liczy linie, dłuższa nazwa obcina się jak dotychczas.
- `lib/admin/stats.ts` — sumuje produkty po nazwie i ilości. Zostaje per produkt: dopłata jest już w cenie pozycji, rozbicie sosów jest w produkcji.
- `app/admin/(panel)/page.tsx` — kafelki liczą sztuki z `order_items(qty)`, bez nazw. Bez zmiany.

## Stałe zamówienia

- `standing_orders.items` i `lib/standing-orders/items.ts` — schemat `{ product_id, qty }`. Dodać `option_ids`, stare zapisy bez pola zostają pustą listą.
- `lib/standing-orders/actions.ts` `saveStandingOrderFromPaid` — zapisuje tylko produkt i ilość. Ma zapisać też opcje z `order_items`.
- `lib/standing-orders/fill-cart.ts` — wkłada produkt bez opcji i pomija tylko brak stanu. Wyłączona opcja albo brak wymaganej grupy pomija pozycję z tekstem „wybierz sos jeszcze raz”.
- `lib/standing-orders/send-reminders.ts` i `lib/email/templates/standing-reminder.tsx` — mail liczy cenę produktu. Ta sama reguła pominięcia i nazwa z wyborem.
- `components/shop/apply-standing-cart.tsx` — woła `add`. Wystarczy, że `CartItem` z fill-cart ma opcje.
- `app/(shop)/zamow-jak-zwykle` — przekazuje wynik fill-cart. Komunikat pominięcia jest już w `skipped`.
