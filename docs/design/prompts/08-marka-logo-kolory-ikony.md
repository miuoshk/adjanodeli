# 08 · Marka Adjano Deli: logo, karmin, ikony, udostępnianie

> Uruchamiasz po 01–06 (są już w repo). Zakres: wygląd marki w całej aplikacji. Logika, dane, SQL i ceny bez zmian. Bez nowych bibliotek.

## Skąd to jest

- **Księga znaku Adjano Deli** (PDF, 36 stron). Miłosz dołączył folder „Adjano Deli — księga znaku”. Jeśli go widzisz, rozdziały 01, 02 i 04 opisują wszystko z tego promptu. Jeśli nie widzisz, ten prompt wystarczy.
- **Gotowe pliki są już w repo** (dodane razem z tym promptem, jeszcze niezacommitowane):
  - `public/brand/logo/adjano-deli-karmin.svg` — znak główny (szyld): napis Adjano + DELI, karmin. Na jasne tło.
  - `public/brand/logo/adjano-deli-krem-zloto.svg` — ten sam znak w kremie, DELI w jasnym złocie. Na oliwkę.
  - `public/brand/logo/adjano-deli-poziomy-karmin.svg` — wersja pozioma (Adjano | DELI) do nagłówka. viewBox 725.5×225.4.
  - `public/brand/logo/adjano-deli-poziomy-krem.svg` — wersja pozioma na oliwkę (panel admina).
  - `public/brand/logo/adjano-deli-tusz.svg` — jeden kolor do druku czarno-białego.
  - `public/brand/logo/znak-A-karmin.svg` — znak A w karminowym kole (ikona).
  - `public/brand/logo/znak-A-sam-karmin.svg` — sama litera A.
  - `public/brand/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`
  - `public/brand/email/adjano-deli-karmin@2x.png` — logo do maili (352×156, wyświetlane 176×78)
  - `docs/design/marka/app/` — pliki do przeniesienia do `app/` (krok 5)
  - `docs/design/marka/podglad/plansza-2-ikony.jpg` i `plansza-3-logo.jpg` — jak to ma wyglądać: ikony, podgląd linku, pas w stopce i które logo gdzie. Porównaj z nimi wynik.
- Szyldy mają viewBox 519.7×230.5, więc w `next/image` podawaj `width={520} height={231}`. Poziome: `width={726} height={225}`.
- **Nie przerysowujesz logo, nie generujesz własnych wersji, nie edytujesz plików SVG.** Tekst w nich jest zamieniony na krzywe.

## 0. Zanim zaczniesz

1. Przeczytaj `docs/SPEC.md` §10.
2. `git status`: dozwolone są tylko nowe pliki w `public/brand/logo`, `public/brand/icons`, `public/brand/email`, `docs/design/marka`, zmiany w `docs/design/**` (prompty i wzorzec landingu) oraz nieśledzone `.cursor/`, `Claude outputs/`, `public/img/`. Cokolwiek innego: zatrzymaj się i zapytaj. Zmiany w `docs/design/**` wejdą do commita tego promptu.
3. **Zasada: pieczątki nie używamy na stronie.** Chodzi o okrągły znak z napisem „PIEKARNIA · CUKIERNIA / MIKOŁÓW · OD 1937” w obręczy. Jej plików nie ma w repo i ich nie dodajesz. Na opakowaniach tak, na stronie nigdzie.

## 1. Karmin zamiast czerwieni

- `app/globals.css`: `--adj-red: #a6231f;` i `--adj-red-dark: #881d19;`. Nazwy zmiennych zostają (dopisz komentarz `/* karmin */`).
- Twarde wartości: `#C4161C` → `#A6231F`, `#9E1116` → `#881D19` w:
  - `components/admin/stats-charts.tsx`
  - `lib/orders/status-labels.ts`
  - `lib/email/templates/*.tsx`
- Sprawdź też zapisy RGB czerwieni, np. `rgb(196 22 28 / …)` → `rgb(166 35 31 / …)`.
- Na koniec `grep -rniE "c4161c|9e1116|196,? ?22,? ?28" app components lib` ma zwrócić zero wyników.

## 2. Logo w nagłówku

`components/shop/header-logo.tsx`:

```tsx
<Link href="/" aria-label="Adjano Deli — strona główna" className="shrink-0">
  <Image
    src="/brand/logo/adjano-deli-poziomy-karmin.svg"
    alt="Adjano Deli"
    width={726}
    height={225}
    className="h-10 w-auto lg:h-[46px]"
    priority
    unoptimized
  />
</Link>
```

Na 390 px logo nie może ściskać ikon koszyka i konta. Jeśli brakuje miejsca, na mobile `h-9`.

## 3. Wzór i panel w `globals.css`

Wzór `wzor-adjano-kafelek-przezroczysty.svg` to kafelek, który powtarza się bez szwów. Jego linie (#7d7748) na oliwce dają „oliwkę ton w ton” z księgi.

```css
.adj-pattern {
  background-color: var(--adj-khaki);
  background-image: url("/brand/wzor-adjano-kafelek-przezroczysty.svg");
  background-position: center;
  background-repeat: repeat;
  background-size: 620px auto;
}
@media (min-width: 64rem) {
  .adj-pattern { background-size: 980px auto; }
}
/* oliwkowy panel z podwójną złotą ramką: logo na wzorze zawsze stoi na gładkim polu */
.adj-plate {
  background: var(--adj-khaki);
  box-shadow:
    0 0 0 1px var(--adj-gold-light),
    0 0 0 6px var(--adj-khaki),
    0 0 0 7px var(--adj-gold-light);
}
```

Usuń z `.adj-pattern` kremową nakładkę (`linear-gradient(...)`), której używała poprzednia wersja.

## 4. Landing i stopka

**`components/landing/landing-bag.tsx`** — sekcja zostaje na `.adj-pattern` (teraz oliwka), karta `.adj-framed` (papier) zostaje. Zmienia się tylko logo:

```tsx
<Image src="/brand/logo/adjano-deli-karmin.svg" alt="Adjano Deli" width={520} height={231}
  className="mx-auto h-auto w-[150px] lg:w-[190px]" unoptimized />
```

**`components/shop/site-footer.tsx`**:

- Na samej górze stopki pas przeplatanki z logo:

  ```tsx
  <div className="adj-pattern flex h-[180px] items-center justify-center lg:h-[230px]">
    <div className="adj-plate px-10 py-7 lg:px-14 lg:py-9">
      <Image src="/brand/logo/adjano-deli-krem-zloto.svg" alt="Adjano Deli" width={520} height={231}
        className="h-auto w-[180px] lg:w-[230px]" unoptimized />
    </div>
  </div>
  ```

  Pod pasem `border-t border-[var(--adj-gold-light)]/50` zamiast obecnego `adj-gilt`.
- Pierwsza kolumna: usuń obrazek `adjano-logo-cream.svg` (logo jest w pasie). Tekst o piekarni zostaje.
- Nowa kolumna „Zamówienia” (etykieta `adj-label text-[var(--adj-gold-light)]` jak pozostałe):
  - `Do {pickup.cutoff} dzień wcześniej`
  - `BLIK, Apple Pay, Google Pay albo karta`
- Dopasuj siatkę na `lg`, żeby kolumny się mieściły (z punktem sklepu 5 kolumn, bez niego 4).
- Dolna linia: „Zamówienia online: AdjanoDeli” → „Zamówienia online: Adjano Deli”.

## 5. Ikony, manifest, udostępnianie

1. Przenieś pliki (Next.js sam doda z nich tagi w `<head>`):

   ```bash
   git mv -f docs/design/marka/app/favicon.ico app/favicon.ico
   git mv docs/design/marka/app/icon.svg app/icon.svg
   git mv docs/design/marka/app/apple-icon.png app/apple-icon.png
   git mv docs/design/marka/app/opengraph-image.png app/opengraph-image.png
   git mv docs/design/marka/app/opengraph-image.alt.txt app/opengraph-image.alt.txt
   git mv docs/design/marka/app/twitter-image.png app/twitter-image.png
   git mv docs/design/marka/app/twitter-image.alt.txt app/twitter-image.alt.txt
   ```

   (Jeśli pliki nie są jeszcze śledzone przez git, zwykłe `mv`.) Folder `docs/design/marka/app` ma zniknąć.

2. `app/manifest.ts`:

   ```ts
   import type { MetadataRoute } from "next";

   export default function manifest(): MetadataRoute.Manifest {
     return {
       name: "Adjano Deli — Piekarnia-Cukiernia Adjano",
       short_name: "Adjano Deli",
       description: "Pieczywo, kanapki, sałatki i ciasta z piekarni Adjano. Zamawiasz dzień wcześniej, odbierasz rano.",
       start_url: "/",
       display: "standalone",
       background_color: "#F1EADB",
       theme_color: "#4B4A2F",
       lang: "pl",
       icons: [
         { src: "/brand/icons/icon-192.png", sizes: "192x192", type: "image/png" },
         { src: "/brand/icons/icon-512.png", sizes: "512x512", type: "image/png" },
         { src: "/brand/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
       ],
     };
   }
   ```

3. `middleware.ts`: dopisz do wyjątków w `matcher` `manifest.webmanifest` oraz rozszerzenia `ico` i `txt`, żeby ikony i manifest nie przechodziły przez sesję Supabase.

4. `app/layout.tsx`:

   ```ts
   export const metadata: Metadata = {
     metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
     title: {
       default: "Adjano Deli · Piekarnia-Cukiernia Adjano",
       template: "%s · Adjano Deli",
     },
     description:
       "Pieczywo, kanapki, sałatki i ciasta z Piekarni-Cukierni Adjano w Mikołowie. Zamawiasz dzień wcześniej, odbierasz rano w punkcie przy pracy albo w sklepie.",
     applicationName: "Adjano Deli",
     openGraph: { siteName: "Adjano Deli", locale: "pl_PL", type: "website" },
   };

   export const viewport: Viewport = { themeColor: "#4B4A2F" };
   ```

   (`Viewport` importujesz z `next`.)

5. Tytuły stron korzystają z szablonu, więc zdejmij z nich nazwę marki:
   - `app/(shop)/sklep/page.tsx`: `title: "Sklep"` (w `openGraph` też).
   - `app/(shop)/sklep/[kategoria]/page.tsx`: `title: data.name`, a w przypadkach awaryjnych `"Sklep"`.
   - Przejrzyj pozostałe `title:` w `app/` i usuń z nich „AdjanoDeli” oraz „— AdjanoDeli”.

## 6. Nazwa marki w tekstach

W tekstach, które widzi klient: „AdjanoDeli” → „Adjano Deli”.

- `app/(shop)/regulamin/page.tsx` — tylko nazwa, reszta treści bez zmian.
- `lib/orders/pay-order.ts` — „Rabat AdjanoDeli” → „Rabat Adjano Deli” (widać go w Stripe).
- `components/admin/settings-form.tsx` — domyślna nazwa „Adjano Deli”.
- Tytuły maili zmienia prompt 09, tu ich nie ruszaj.

Nazwy techniczne (repo, pakiet, zmienne, komentarze) zostają.

## 7. Porządek i SPEC

- Jeśli `grep` nie znajduje już użyć `adjano-logo-red.svg` i `adjano-logo-cream.svg`, usuń te pliki (`git rm`). `adjano-logo.png` zostaje do promptu 09 (panel i maile).
- `docs/SPEC.md` §10:
  - `--adj-red: #A6231F (karmin …)`, `--adj-red-dark: #881D19 (hover)`.
  - Zdanie o logotypie zamień na: „Logotyp Adjano Deli wyłącznie jako plik z public/brand/logo/ (SVG, tekst w krzywych). Szyld: adjano-deli-karmin (jasne tło) i adjano-deli-krem-zloto (oliwka). Nagłówek: adjano-deli-poziomy-karmin. Favicon i ikony: znak A. Pieczątki nie używamy na stronie. Zasady: księga znaku Adjano Deli (PDF).”

## 8. Odbiór

1. `npm test`, `npm run lint`, `npm run build`.
2. 390 i 1440 px: nagłówek (logo ostre, nie ściska ikon), sekcja z przeplatanką na landingu (oliwka, karta z karminowym logo), stopka (pas z logo, kolumna „Zamówienia”).
3. Ikona w karcie przeglądarki to karminowe koło z A. `/manifest.webmanifest` zwraca JSON. `/opengraph-image.png` się otwiera.
4. W DevTools → Elements w `<head>`: `link rel="icon"`, `apple-touch-icon`, `og:image`, `theme-color`.
5. Nigdzie na stronie nie ma pieczątki.

Na koniec wypisz zmienione pliki i jedno zdanie, jak przetestować.
