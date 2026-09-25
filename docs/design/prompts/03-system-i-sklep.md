# 03 · Wspólny system wyglądu + sklep (`/sklep`, `/sklep/[kategoria]`, karta produktu)

> Uruchamiasz **po** 01 i 02. Po tym prompcie każda strona sklepu wygląda jak landing: papier, Brygada, Archivo, czerwień tylko na akcjach. Logika koszyka, dostępności, limitów i dni zostaje nietknięta — zmieniasz wygląd i układ.

## 0. Zanim zaczniesz

1. Przeczytaj `docs/SPEC.md` i `docs/design/landing-v2/reference.css` (skąd biorą się rozmiary i kolory).
2. `git status` czysty, inaczej zatrzymaj się i zapytaj.
3. Zmiany w `components/ui/*` działają też w panelu `/admin`. To zamierzone. Po zmianach przejdź po panelu (Dziś, Zamówienia, Produkty, formularz produktu) i sprawdź, że nic się nie rozjechało.

## 1. SPEC §10 — dopisz

```
- Cały sklep (wszystkie strony w app/(shop)) używa tego samego systemu co landing: papier --adj-cream z ziarnem, nagłówki Brygada 1918, etykiety/przyciski/liczby Archivo, header kremowy z paskiem najbliższego odbioru, stopka khaki.
- Kształty: przyciski i pola 6 px promienia, karty i ramki 0–2 px (papier, nie „bańki”). Cienie tylko pod kartami „papierowymi” (etykieta, naklejka, kod odbioru).
- Zdjęcia produktów (białe tło) zawsze z klasą adj-cutout na papierze, bez ramek i bez czarnych gradientów.
- Janosz: ekran po opłaceniu, pusty koszyk, 404 (bez zmian).
```

## 2. Chrome sklepu: header, tło, szerokości

### 2.1 Header i pasek na wszystkich stronach sklepu

W `components/shop/site-header-shell.tsx` usuń rozróżnienie landing / reszta dla wyglądu: **każda** strona w `app/(shop)` dostaje kremowy sticky header i pasek `LandingStrip` nad nim (to, co prompt 01 zrobił tylko dla `/`). Linki kotwic (`LandingNavLinks`) dalej tylko na `/`. Logo: wszędzie `/brand/adjano-logo-red.svg` (w `header-logo.tsx` usuń gałąź z PNG). Panel `/admin` ma własny layout — nie ruszasz go.

### 2.2 Tło i ziarno

- `app/(shop)/layout.tsx`: usuń `<PatternWash />`. Root layoutu sklepu dostaje klasę `adj-landing` (papier + ziarno) zamiast samego `isolate flex min-h-screen flex-col` — zostaw `isolate flex min-h-screen flex-col` i dopisz `adj-landing`.
- `app/(shop)/page.tsx` ma już `adj-landing` na wrapperze — zmień na zwykły `div`, żeby ziarno nie nakładało się dwa razy.
- `PatternWash` zostaje w kodzie tylko tam, gdzie jest jeszcze używany (sprawdź `app/not-found.tsx` — w prompcie 05 też znika).

### 2.3 Szerokości treści — `components/shop/shop-main.tsx`

Zamień logikę na mapę po ścieżce:
- `/` → pełna szerokość (jak jest),
- `/sklep` i `/sklep/*` → `mx-auto w-full max-w-[1280px] px-5 py-10 lg:px-12 lg:py-14`,
- `/koszyk` → `mx-auto w-full max-w-[1120px] px-5 py-10 lg:px-12 lg:py-14`,
- reszta → `mx-auto w-full max-w-3xl px-5 py-10 lg:py-14`.

## 3. `components/ui/*` w barwach Adjano

Zmieniasz tylko klasy (API komponentów bez zmian):

- **Button** (`button.tsx`):
  - baza: `font-label [font-stretch:85%] font-semibold tracking-[0.01em] rounded-[6px]`, `min-h-12` dla `lg` i `default` na mobile (`h-12 md:h-10` dla `default`),
  - `default`: `relative bg-[var(--adj-red)] text-[var(--adj-cream)] hover:bg-[var(--adj-red-dark)]` + wewnętrzna ramka jak `adj-btn` (`after:absolute after:inset-1 after:rounded-[3px] after:border after:border-[rgb(241_234_219/0.38)] after:content-[''] after:pointer-events-none`),
  - `outline`: `border border-[var(--adj-ink)]/30 bg-transparent text-[var(--adj-ink)] hover:border-[var(--adj-ink)] hover:bg-[var(--adj-cream-dark)]/60`,
  - `secondary`: `bg-[var(--adj-khaki)] text-[var(--adj-cream)] hover:bg-[var(--adj-khaki)]/90`,
  - `ghost`: `hover:bg-[var(--adj-cream-dark)]/70`,
  - `link`: jak `adj-link` (podkreślenie złote, offset 6 px),
  - `lg`: `h-14 px-7 text-[17px]`.
- **Input** / **Select trigger** / **textarea** w sklepie: `h-12 rounded-[6px] border-[rgba(43,42,31,0.28)] bg-[var(--adj-paper-light)] px-4 text-base shadow-none focus-visible:border-[var(--adj-khaki)] focus-visible:ring-[3px] focus-visible:ring-[var(--adj-gold)]/35`.
- **Label**: `adj-ui text-[15px] font-semibold text-[var(--adj-ink-soft)]`.
- **Dialog** / **Sheet**: `bg-[var(--adj-paper-light)] border border-[var(--adj-gold)] rounded-[4px] shadow-[0_40px_70px_-40px_rgba(43,42,31,0.6)]`; `DialogTitle` = `font-heading text-[26px] font-medium leading-tight`; `DialogDescription` = `text-base text-[var(--adj-ink-soft)]`; overlay `bg-[var(--adj-ink)]/35`.
- **Badge**: domyślny wariant = `adj-label text-[11px] rounded-none border px-2 py-1` (etykieta, nie pigułka).
- **Sonner** (`sonner.tsx`): toast `bg-[var(--adj-paper-light)] text-[var(--adj-ink)] border border-[rgba(43,42,31,0.18)] rounded-[4px] font-label [font-stretch:85%]`.
- `--radius` w `globals.css`: `0.375rem`.

## 4. Wspólne klocki — `components/brand/*` (nowe)

- `section-heading.tsx` — `SectionHeading({ eyebrow, title, as = "h2", description, action })`: etykieta `adj-label text-[var(--adj-red)]`, tytuł (H1: klasy H1 z promptu 01 w wersji mniejszej: `text-[2.5rem] lg:text-[3.75rem]`; H2: klasy H2 z promptu 01), opis `mt-4 max-w-[36em] text-lg text-[var(--adj-ink-soft)]`, `action` po prawej na desktopie (`lg:flex lg:items-end lg:justify-between`).
- `price.tsx` — `Price({ grosze, regularGrosze?, size = "md" })`: `adj-ui font-semibold tabular-nums`; `md` = `text-[17px]`, `lg` = `text-[22px]`; promocja: cena `text-[var(--adj-red)]` + regularna `ml-2 font-normal line-through text-[var(--adj-ink-soft)]`. Zawsze `formatPrice`.
- `qty-stepper.tsx` — `QtyStepper({ value, onDecrease, onIncrease, label })`: `inline-flex items-center rounded-[6px] border border-[var(--adj-ink)]/30`, przyciski `size-12` z `Minus`/`Plus` (lucide, 16 px), liczba `min-w-9 text-center adj-ui text-lg font-semibold tabular-nums`, `aria-live="polite"`, `aria-label` na przyciskach („Zmniejsz ilość”, „Zwiększ ilość”).
- `label-tag.tsx` — `LabelTag({ tone = "ink" | "red" | "gold" | "khaki", children })`: `adj-label text-[11px] border px-2 py-1 leading-none`; `red` = czerwony tekst i ramka, `gold` = tło `var(--adj-gold-light)/40` + tekst ink, `khaki` = tło khaki + tekst cream, `ink` = ramka ink-soft. Tagi z `product_tags` mapuj: `red→red`, `khaki→khaki`, reszta → `gold` (zastępuje `tagBadgeClass`).
- `shelf-tile.tsx` — przenieś tu kafel kategorii z `components/landing/landing-shelf.tsx` (ten z półką i `adj-cutout`) jako `ShelfTile({ …, compact })`. Landing importuje go stąd. `compact`: obrazek `aspect-[4/3]`, nazwa `text-[17px] lg:text-[20px]`, bez meta.

## 5. `components/shop/day-picker.tsx` — kalendarz zamiast pigułek

Ta sama logika (`router.push(...?dzien=)`), nowy wygląd:
- lista `flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 lg:mx-0 lg:px-0 snap-x`,
- przycisk `snap-start min-w-[76px] shrink-0 rounded-[6px] border px-3 py-2.5 text-center`:
  - góra `adj-label text-[11px]`: `jutro` jeśli to jutro (porównaj z `warsawDateIso(1)`), inaczej `format(d, "EEE", { locale: pl })` bez kropki,
  - środek `font-heading text-[28px] leading-none font-medium tabular-nums`: dzień miesiąca,
  - dół `adj-ui text-[13px]`: `format(d, "LLL", { locale: pl })` bez kropki,
  - wybrany: `bg-[var(--adj-khaki)] border-[var(--adj-khaki)] text-[var(--adj-cream)]`; pozostałe: `border-[rgba(43,42,31,0.22)] bg-[var(--adj-paper-light)] hover:border-[var(--adj-ink)]`,
  - `aria-pressed` na wybranym, `aria-label={formatDayChip(date)}`.

## 6. `/sklep` — `app/(shop)/sklep/page.tsx`

Dane bez zmian (dodaj tylko `cutoff_time` z `settings`, jeśli go nie ma). Nowy układ:
- `SectionHeading` jako H1: eyebrow `Sklep`, tytuł `buildPickupCopy(selectedDay, cutoff, warsawDateIso()).menuHeading` („Co pieczemy na środę”), opis = `.deadline` („Na środę zamówisz do wtorku, 20:00.”).
- `mt-8` `DayPicker`.
- `mt-4 adj-ui text-[15px] text-[var(--adj-ink-soft)]`: `Odbierasz w&nbsp;pracy? Kod od pracodawcy wpiszesz w&nbsp;koszyku.`
- `mt-10` siatka `ShelfTile` jak na landingu: `grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14`, meta = liczba pozycji. Na końcu kafel „Zamówienie specjalne” (ten z landingu).
- Pusta lista: `SectionHeading`-owy akapit `Na ten dzień nic nie pieczemy. Wybierz inny dzień powyżej.`
- „Zamówienia chwilowo wstrzymane” i „Sklep chwilowo niedostępny” — ten sam tekst, ale w `SectionHeading` (eyebrow `Sklep`), żeby nie był gołym akapitem.
- `MobileCartBar` zostaje.

## 7. `/sklep/[kategoria]` — `app/(shop)/sklep/[kategoria]/page.tsx`

- Okruszki `adj-ui text-[14px] text-[var(--adj-ink-soft)]`: `Sklep` (link z `?dzien=`) ` / ` nazwa kategorii.
- `SectionHeading` H1: eyebrow = `buildPickupCopy(selectedDay,…).longDate` („środa, 30 września”), tytuł = `nbsp(category.name)`, opis = `category.description`.
- `mt-8 DayPicker` z `basePath`.
- Lista produktów `mt-10 grid gap-y-8 md:grid-cols-2 md:gap-x-8 md:gap-y-12 lg:grid-cols-3`.
- „Inne kategorie”: `mt-20 border-t border-[var(--adj-ink)] pt-10`, `SectionHeading` H2 z `title="Inne kategorie"` (bez eyebrow), siatka `mt-6 grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6` z `ShelfTile compact`.
- Po tej zmianie `components/shop/category-tile.tsx` nie ma użyć → usuń plik i import ikon, jeśli nigdzie indziej nie jest używany (sprawdź grepem).

## 8. Karta produktu — `components/shop/product-card.tsx`

Logika, dialogi, toasty i propsy **bez zmian**. Nowy układ:

- `<article>`: `group flex gap-4 md:flex-col md:gap-0` (telefon: obrazek po lewej, treść po prawej; od `md`: pionowa karta). Bez ramki, bez tła, bez zaokrągleń.
- Obrazek: `relative size-[104px] shrink-0 md:size-auto md:aspect-square border-b border-[var(--adj-ink)]` (**bez tła**), `next/image fill object-contain object-bottom adj-cutout`, `sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 104px"`. Brak zdjęcia → sam dolny border, bez placeholdera.
- Treść `min-w-0 flex-1 md:mt-4`:
  - etykiety w rzędzie `flex flex-wrap gap-1.5` (nad nazwą): `Nowość` (`LabelTag gold`), `Promocja` (`red`), tagi, `Zostało {n}` (`red`, gdy `showRemaining`),
  - nazwa `mt-2 font-heading text-[20px] md:text-[24px] leading-[1.15] font-medium` = nazwa z wielką literą + `nbsp`,
  - opis `mt-1.5 text-[15px] leading-[1.5] text-[var(--adj-ink-soft)] md:line-clamp-3`, przy czym tekst po `\n` (np. „0,6kg”) pokaż w osobnej linii `adj-ui text-[13px]`,
  - alergeny `mt-2 adj-ui text-[13px] text-[var(--adj-ink-soft)]`: `Alergeny: {lista}` (małe litery, oddzielone przecinkami),
  - `leadNote` `mt-2 text-sm italic text-[var(--adj-ink-soft)]`.
- Wiersz akcji `mt-4 flex items-center justify-between gap-3`:
  - lewo `Price` (z `regularGrosze` przy promocji),
  - prawo: `Dodaj` (`Button`, `min-w-[112px]`), `QtyStepper` gdy `qty > 0`, `Wybierz {data}` (`Button variant="outline"`) gdy `tooEarly`, albo `adj-ui text-sm text-[var(--adj-ink-soft)]` `Wyprzedane na ten dzień`.
- Wyprzedane / za wcześnie: obrazek `opacity-50 grayscale`, reszta pełna (czytelność) — zamiast `opacity-55` na całym `article`.

## 9. `components/shop/mobile-cart-bar.tsx`

`fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(43,42,31,0.18)] bg-[var(--adj-paper-light)]/95 backdrop-blur px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden`; lewo `adj-ui text-[15px]`: `{n} szt.` + `Price` sumy; prawo `Button` `Do koszyka`.

## 10. Header — licznik pieczątek i koszyk

W `site-header.tsx` licznik pieczątek (`7/10`) zamień na mały „stempel”: `inline-flex size-10 items-center justify-center rounded-full border border-dashed border-[var(--adj-red)] adj-ui text-[13px] font-semibold text-[var(--adj-red)]` z tekstem `{active}` i `title`/`aria-label` `Pieczątki {active} z {next}`. Badge liczby w koszyku: `bg-[var(--adj-red)] text-[var(--adj-cream)] adj-ui text-[11px]`.

## 11. Odbiór

1. `npm test`, `npm run lint`, `npm run build`.
2. `/sklep` i `/sklep/kanapki` (albo dowolna kategoria) na 390 i 1440 px: kalendarz dni, kafle, karty produktów bez białych prostokątów wokół zdjęć.
3. Dodawanie do koszyka, zmiana dnia z pełnym koszykiem (dialog), limit sztuk (toast), produkt „za wcześnie” — działa jak przed zmianą.
4. Panel `/admin` — przyciski, pola i dialogi wyglądają spójnie i nic się nie rozjechało.

Na koniec wypisz zmienione pliki i jedno zdanie, jak przetestować.
