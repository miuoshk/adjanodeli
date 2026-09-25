# 05 · Logowanie, konto, zamówienia i pozostałe strony

> Uruchamiasz **po** 04. Zakres: wszystkie pozostałe strony w `app/(shop)` i ich komponenty. Logika (auth OTP, profile, pieczątki, stałe zamówienia, punkty na kod, zamówienia specjalne) bez zmian — tylko układ, wygląd i drobne poprawki tekstów wypisane niżej.

## 0. Zanim zaczniesz

1. Przeczytaj `docs/SPEC.md` (§13 lojalność, §14 stałe zamówienia).
2. `git status` czysty, inaczej zatrzymaj się i zapytaj.
3. Używasz klocków z promptu 03: `SectionHeading`, `Price`, `LabelTag`, `QtyStepper`, `DayChips`, nowe warianty `Button`, `Input`, `Label`.

## 1. Wspólny wzór strony

Każda strona zaczyna się od `SectionHeading` jako H1 (eyebrow + tytuł + opcjonalny opis). Karty „papierowe” = `bg-[var(--adj-paper-light)] border border-[rgba(43,42,31,0.18)] rounded-[4px] px-5 py-5 lg:px-6`. Listy z liniami = `border-t border-[var(--adj-ink)]` + wiersze `border-b border-[rgba(43,42,31,0.18)] py-4`.

## 2. Logowanie — `app/(shop)/logowanie/page.tsx` + `components/shop/login-form.tsx`

- Kontener `mx-auto max-w-[440px]`.
- `SectionHeading`: eyebrow `Logowanie`, tytuł `Zaloguj się kodem`, opis `Podaj adres e‑mail. Wyślemy na niego kod do wpisania poniżej.`
- Formularz w karcie papierowej `mt-8`. Pole kodu: `Input` z `text-center font-label [font-stretch:75%] text-[28px] tracking-[0.35em]`, `inputMode="numeric"`, `autoComplete="one-time-code"`.
- Przyciski: główny `Button size="lg" w-full`, „wyślij ponownie” / „zmień e‑mail” = `Button variant="link"`.
- Błędy: `adj-ui text-[15px] text-[var(--adj-red)]`.

## 3. Uzupełnienie profilu — `app/(shop)/konto/uzupelnij/page.tsx`

`SectionHeading`: eyebrow `Konto`, tytuł `Jak się do Ciebie zwracać?`, opis `Imię trafi na etykietę paczki. Telefon przyda się, gdyby coś się zmieniło z odbiorem.` Formularz `ProfileForm` w karcie papierowej.

## 4. Konto — `app/(shop)/konto/page.tsx`

Kolejność: `SectionHeading` (eyebrow = e‑mail, tytuł `Twoje konto`), potem sekcje z `SectionHeading` H2 i `mt-12`.

### 4.1 Pieczątki — `components/shop/loyalty-section.tsx` jako karta z pieczątkami

Zamiast paska postępu **karta stempli** w stylu kartonika z piekarni:
- `adj-framed px-6 py-7`, nagłówek `adj-label` `Karta pieczątek` + po prawej `adj-ui text-[15px]` `{stamps} / {next}`,
- siatka 30 pól w 3 rzędach po 10 (`grid grid-cols-10 gap-2`), każde pole `aspect-square rounded-full border`:
  - zdobyte (indeks < `active_stamps`): `border-[var(--adj-red)] bg-[var(--adj-red)]/10` z małym czerwonym znakiem w środku (inline SVG kłos albo litera `A` w `font-heading italic`), lekko obrócone (`rotate-[-8deg]` co drugie, `rotate-[6deg]` pozostałe),
  - puste: `border-dashed border-[rgba(43,42,31,0.3)]`,
- pod każdym rzędem `adj-ui text-[13px] text-[var(--adj-ink-soft)]` nagroda progu: rząd 1 `10 pieczątek: −10%`, rząd 2 `20 pieczątek: −50% (maks. 40 zł)`, rząd 3 `30 pieczątek: najtańszy produkt za 1 grosz`,
- `mt-4 text-[15px] text-[var(--adj-ink-soft)]` `Pieczątka za każdy opłacony produkt. Ważna 60 dni.`
- `active_stamps` > 30 — pokaż 30 pełnych (UI nie liczy progów, tylko wyświetla).
- Vouchery pod kartą jako „kupony”: `flex items-center justify-between border border-dashed border-[var(--adj-red)] bg-[var(--adj-paper-light)] px-5 py-4`, lewo `font-heading text-[22px]` `voucherLabel(type)`, prawo `adj-ui text-[14px]` `ważny do {d MMMM}`. Brak voucherów: `text-[15px] text-[var(--adj-ink-soft)]` `Voucher pojawi się przy 10 pieczątkach.`

### 4.2 Moje punkty odbioru — `components/shop/account-pickup-points.tsx`

`SectionHeading` H2 `Punkty odbioru w pracy`; lista z liniami: nazwa punktu + `adj-ui text-[14px]` `od {d MMMM yyyy}`. Pusto: `Nie masz jeszcze punktu w pracy. Kod od pracodawcy wpiszesz w koszyku.`

### 4.3 Stałe zamówienia — skrót

Karta-link papierowa `flex items-center justify-between`: `font-heading text-[22px]` `Stałe zamówienia` + `text-[15px] text-[var(--adj-ink-soft)]` `Przypomnimy o 17:00 dzień wcześniej.` + `adj-link` `Zarządzaj` → `/konto/stale-zamowienia`.

### 4.4 Dane i wylogowanie

`SectionHeading` H2 `Twoje dane`, `ProfileForm` w karcie. Wyloguj: `Button variant="outline" size="lg" w-full md:w-auto`.

## 5. Stałe zamówienia — `app/(shop)/konto/stale-zamowienia/page.tsx` + `standing-orders-manager.tsx`

- `SectionHeading`: eyebrow `Konto`, tytuł `Stałe zamówienia`, opis `Dzień wcześniej o&nbsp;17:00 przypomnimy Ci mailem. Z maila jednym kliknięciem przeniesiesz produkty do koszyka.`
- Każde stałe zamówienie = karta papierowa: nazwa `font-heading text-[22px]`, lista pozycji jak `OrderLines` z promptu 04 (bez sum, jeśli dziś ich nie ma), dni tygodnia jako rząd przełączników w wyglądzie `DayChips` (skrót dnia: `pn wt śr czw pt sob nd`, wybrane khaki), akcje `Button variant="outline"` / `link`.
- Pusto: `Nie masz stałych zamówień. Po opłaceniu zamówienia możesz je zapisać jako stałe.`

## 6. Zamówienia — `app/(shop)/moje-zamowienia/page.tsx`

- `SectionHeading`: eyebrow `Konto`, tytuł `Zamówienia`.
- „Do odbioru” (`delivered`) na górze: karty `adj-framed px-6 py-6`, w nich kod `font-label [font-stretch:62%] font-extrabold text-[48px] leading-none tracking-[0.06em] text-[var(--adj-red)]`, punkt + godzina do, `adj-link` `Szczegóły`.
- Pozostałe: lista z liniami, wiersz = numer + data odbioru (`font-heading text-[19px]`), punkt (`text-[15px] text-[var(--adj-ink-soft)]`), `Price`, status jako `LabelTag` (`paid`/`in_production` → `gold`, `delivered` → `red`, `picked_up` → `ink`, `expired`/`cancelled`/`refunded` → `ink`), `adj-link` `Szczegóły`.
- `StatusBadge` z panelu zostaw dla panelu; w sklepie używasz `LabelTag` z etykietą z `orderStatusMeta`.
- Pusto: `Nie masz jeszcze zamówień.` + `Button` `Przejdź do sklepu`.

## 7. Pozostałe strony

- `zamow-jak-zwykle`: stan błędu → `SectionHeading` eyebrow `Stałe zamówienie`, tytuł `Nie udało się złożyć koszyka`, opis = komunikat, `Button` `Przejdź do sklepu`. Stan ładowania / przekierowania — jak dziś.
- `punkt/[kod]`: `SectionHeading` eyebrow `Punkt odbioru`, tytuł = komunikat w jednym zdaniu, `Button` do `/sklep`.
- `brak-dostepu`: eyebrow `Konto`, tytuł `Brak dostępu`, opis `Ta strona jest dostępna tylko dla pracowników piekarni.`, `Button` `Przejdź do sklepu`.
- `zamowienie-specjalne` + `special-request-form.tsx`: eyebrow `Zamówienia specjalne`, tytuł `Większe zamówienie albo coś spoza menu`, opis `Konferencja, szkolenie albo zamówienie do biura? Napisz, czego potrzebujesz i&nbsp;na kiedy. Oddzwonimy.`; formularz w karcie papierowej, pola z nowymi `Input`/`Label`, `Button size="lg"`. Stan „Dziękujemy” → `SectionHeading` H2 `Dziękujemy` + dotychczasowy tekst.
- `regulamin`, `polityka-prywatnosci`: typografia dokumentu — kontener `max-w-[68ch]`, H1 przez `SectionHeading` (eyebrow `Informacje`), H2 `font-heading text-[26px] font-medium mt-12`, akapity `text-[17px] leading-[1.7]`, listy z `list-disc pl-5 space-y-1.5`. Treść bez zmian.
- `app/(shop)/error.tsx`: eyebrow `Błąd`, tytuł `Coś poszło nie tak`, opis `Odśwież stronę albo wróć za chwilę.`, `Button` `Odśwież` (`onClick={() => location.reload()}`) + `Button variant="link"` `Przejdź do sklepu`.
- `app/not-found.tsx`: bez `PatternWash`; tło `adj-landing`, Janosz `w-[180px]`, `font-heading text-[34px] font-medium` `Tej strony nie ma`, `text-[var(--adj-ink-soft)]` `Kanapki są w sklepie.`, `Button size="lg"` `Przejdź do sklepu`.
- `app/error.tsx` (globalny): jak `app/(shop)/error.tsx`, ale z własnym tłem `bg-[var(--adj-cream)]`.

## 8. Porządek

- Po tym prompcie `PatternWash` i `PatternFrame` z `components/shop/bakery-pattern.tsx` nie mają użyć w sklepie. Sprawdź grepem panel; jeśli nigdzie nie są używane, usuń plik.

## 9. Odbiór

1. `npm test`, `npm run lint`, `npm run build`.
2. Przejdź po każdej stronie z tej listy na 390 i 1440 px (zaloguj się testowym kontem z kilkoma pieczątkami i voucherem).
3. Logowanie OTP od zera, uzupełnienie profilu, zapis i usunięcie stałego zamówienia, formularz zamówienia specjalnego — działają jak przed zmianą.

Na koniec wypisz zmienione pliki i jedno zdanie, jak przetestować.
