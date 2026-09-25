# 01 · Landing v4

> Wklej całość do Cursora (Agent) albo napisz: „wykonaj docs/design/prompts/01-landing.md”. Zadanie: nowy wygląd strony `/`, nowy header na landingu i nowa stopka. Logika sklepu, koszyka, płatności i panelu zostaje bez zmian.

---

## 0. Zanim zaczniesz

1. Przeczytaj `docs/SPEC.md` (zasada z `.cursor/rules/adjano.mdc`). Ten prompt **celowo zmienia §10 Design i opis strony `/`** — krok 4.1 aktualizuje SPEC, więc nie zatrzymuj się na tej sprzeczności.
2. Uruchom `git status`. Jeśli `app/(shop)/page.tsx` ma niezacommitowane zmiany, **zatrzymaj się i zapytaj**, czy je stashować. Ten prompt zastępuje cały plik.
3. Obejrzyj wzorzec:
   - `docs/design/landing-v2/desktop.jpg` i `mobile.jpg` — tak ma wyglądać efekt,
   - `docs/design/landing-v2/reference.html` + `reference.css` — dokładne wymiary, odstępy, kolory, kolejność sekcji i copy. Przenosisz je 1:1 na Tailwinda. Plików referencyjnych **nie importujesz** do aplikacji.

## 1. Kierunek

- Ciepły ecru papier z delikatnym ziarnem, khaki pasek i stopka, czerwień z logo tylko na przyciskach i akcentach.
- Typografia: polska antykwa **Brygada 1918** na nagłówki i tekst, wąski **Archivo** na etykiety i przyciski (podobny do liter z szyldu na budynku).
- Zdjęcia produktów na białym tle leżą bezpośrednio na papierze (`mix-blend-mode: multiply` + miękka maska) i stoją na cienkiej linii jak na półce.
- W sekcji „O nas” są prawdziwe zdjęcia z pieca Adjano (łopata, koszyki, bochenki w piecu).
- Wzór „przeplatanka” pojawia się raz: jako papierowa torba z naklejką nad stopką. Całostronicowa tapeta znika.
- Kolejność: pasek z najbliższym odbiorem → header → hero → menu (półka) → jak to działa + punkty odbioru → o nas → torba z CTA → stopka.

## 2. Pliki, które już są w repo (dodane razem z tym promptem)

- `public/brand/landing/piec-lopata.jpg`, `piec-koszyki.jpg`, `piec-trzon.jpg` — zdjęcia z pieca (1000×668),
- `public/brand/adjano-logo-red.svg`, `public/brand/adjano-logo-cream.svg` — logo bez tła,
- `public/brand/grain.png` — ziarno papieru 220×220,
- `public/brand/wzor-adjano-kafelek-przezroczysty.svg` — był już wcześniej.
- `public/brand/landing/hero-chleb-zytni.jpg` i `menu-martwa-natura.jpg` zostały po odrzuconej wersji z czarnym tłem. **Nie używaj ich.**

## 3. Zakres zmian

Nowe pliki:
- `components/shop/header-logo.tsx`
- `components/shop/landing-nav-links.tsx`
- `components/landing/landing-strip.tsx`
- `components/landing/landing-hero.tsx`
- `components/landing/landing-shelf.tsx`
- `components/landing/landing-how.tsx`
- `components/landing/landing-story.tsx`
- `components/landing/landing-bag.tsx`
- `lib/shop/landing-data.ts`
- `lib/shop/pickup-copy.ts` + `lib/shop/pickup-copy.test.ts`
- `lib/typography.ts` + `lib/typography.test.ts`
- `public/brand/hero-chleb.png`, `public/brand/hero-bulki.png` (krok 4.2)

Zmieniane pliki:
- `docs/SPEC.md` (§10 i opis `/`)
- `app/layout.tsx` (fonty)
- `app/globals.css` (tokeny + klasy `adj-*`)
- `app/(shop)/page.tsx` (cały landing)
- `lib/shop/category-tiles.ts` (dodatkowe pole `minPriceGrosze`)
- `components/shop/site-header.tsx`, `components/shop/site-header-shell.tsx`
- `components/shop/site-footer.tsx`

Nie ruszasz: `components/shop/category-tile.tsx` (używa go `/sklep`), `bakery-pattern.tsx`, niczego w `app/admin`, `lib/orders`, `supabase/`.

---

## 4. Krok po kroku

### 4.1 `docs/SPEC.md`

- W §10 Design zamień linię o fontach na:
  `- Fonty (next/font/google): nagłówki i tekst landingu Brygada 1918 (zmienna, normal + italic), etykiety i przyciski landingu Archivo (oś wdth), tekst aplikacji Inter (400/500/600). Logotyp "Adjano" wyłącznie jako obraz (public/brand/adjano-logo*.png|svg), nigdy jako tekst w foncie script.`
- W §10 dopisz tokeny: `--adj-paper-light: #FBF7EE` (karty i naklejka na landingu), `--adj-ink-soft: #57553E` (tekst drugorzędny, kontrast ≥ 5.7:1 na kremie), `--adj-gold-light: #D4BC85` (etykiety w stopce na khaki).
- Opis strony `/` zmień na: `/ — strona wizytówka (landing): pasek z najbliższym dniem odbioru, hero z produktami, menu na najbliższy dzień odbioru (kafle kategorii z ceną „od”), jak to działa w 3 krokach + punkty odbioru (tylko publiczne + informacja o punktach na kod), o nas ze zdjęciami z pieca, CTA na wzorze Adjano.`

### 4.2 Zdjęcia do hero

Hero używa dwóch stałych zdjęć (to te same, które są zdjęciami kategorii Chleby i Bułki). Pobierz oryginały z Supabase Storage do `public/brand/`:

```bash
source <(grep NEXT_PUBLIC_SUPABASE_URL .env.local)
curl -fSL "$NEXT_PUBLIC_SUPABASE_URL/storage/v1/object/public/categories/0fcce08c-88cb-4ecd-9c5d-518eb5381ce7/1789836903571.png" -o public/brand/hero-chleb.png
curl -fSL "$NEXT_PUBLIC_SUPABASE_URL/storage/v1/object/public/categories/65101fde-108e-4684-a330-baf35193fbba/1789836949106.png" -o public/brand/hero-bulki.png
```

Jeśli pobieranie się nie uda, zatrzymaj się i powiedz. Nie podstawiaj innych zdjęć. Zdjęcia z pieca są już w `public/brand/landing/`.

### 4.3 Fonty — `app/layout.tsx`

- Usuń `Cormorant_Garamond`. Dodaj:

```ts
import { Archivo, Brygada_1918, Inter } from "next/font/google";

const brygada = Brygada_1918({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-label",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
});
```

- `Inter` zostaje jako `--font-body`. Na `<body>`: `${brygada.variable} ${archivo.variable} ${inter.variable}`.
- Nagłówki w całej aplikacji (h1–h3 mają `font-heading`) przejdą na Brygadę — to zamierzone.

### 4.4 `app/globals.css`

1. W `@theme inline` dopisz `--font-label: var(--font-label);`.
2. W `:root` dopisz:

```css
  --adj-paper-light: #fbf7ee;
  --adj-ink-soft: #57553e;
  --adj-gold-light: #d4bc85;
```

3. Na końcu pliku dodaj (dokładnie):

```css
@layer components {
  .adj-landing {
    position: relative;
    background: var(--adj-cream);
    color: var(--adj-ink);
    font-family: var(--font-heading);
    font-variant-numeric: lining-nums;
  }
  /* ziarno papieru nad wszystkim, nie łapie kliknięć */
  .adj-landing::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 20;
    pointer-events: none;
    background: url("/brand/grain.png") 0 0 / 220px 220px repeat;
    opacity: 0.5;
  }
  .adj-label {
    font-family: var(--font-label);
    font-stretch: 75%;
    font-weight: 650;
    font-size: 0.8125rem;
    line-height: 1.2;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .adj-ui {
    font-family: var(--font-label);
    font-stretch: 85%;
  }
  .adj-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 3.5rem;
    padding-inline: 1.875rem;
    border-radius: 6px;
    background: var(--adj-red);
    color: var(--adj-cream);
    font-family: var(--font-label);
    font-stretch: 85%;
    font-weight: 650;
    font-size: 1.125rem;
    letter-spacing: 0.01em;
    text-decoration: none;
    transition: background-color 160ms ease, transform 120ms ease;
  }
  /* wewnętrzna ramka jak na pieczątce */
  .adj-btn::after {
    content: "";
    position: absolute;
    inset: 4px;
    border: 1px solid rgb(241 234 219 / 0.38);
    border-radius: 3px;
    pointer-events: none;
  }
  .adj-btn:hover { background: var(--adj-red-dark); }
  .adj-btn:active { transform: scale(0.98); }
  .adj-btn:focus-visible { outline: 2px solid var(--adj-ink); outline-offset: 3px; }
  .adj-link {
    font-family: var(--font-label);
    font-stretch: 85%;
    font-weight: 600;
    font-size: 1.0625rem;
    word-spacing: 0.08em;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 6px;
    text-decoration-color: var(--adj-gold);
  }
  .adj-link:hover { color: var(--adj-red); text-decoration-color: var(--adj-red); }
  .adj-gilt {
    height: 5px;
    border-top: 1px solid var(--adj-gold);
    border-bottom: 1px solid var(--adj-gold);
  }
  /* zdjęcie produktu na białym tle kładzie się na papier */
  .adj-cutout {
    mix-blend-mode: multiply;
    filter: brightness(1.035) contrast(1.03);
    -webkit-mask-image: radial-gradient(ellipse closest-side, #000 74%, transparent 100%);
    mask-image: radial-gradient(ellipse closest-side, #000 74%, transparent 100%);
  }
  /* zdjęcia z pieca: jednolita, lekko przygaszona kolorystyka */
  .adj-photo {
    filter: saturate(0.9) contrast(1.03);
  }
  .adj-ring {
    border-radius: 9999px;
    border: 1px solid rgb(184 151 90 / 0.55);
  }
  .adj-ring::after {
    content: "";
    position: absolute;
    inset: 10px;
    border-radius: 9999px;
    border: 1px solid rgb(184 151 90 / 0.3);
  }
  /* naklejka na torbie: podwójna złota ramka */
  .adj-framed {
    background: var(--adj-paper-light);
    border: 1px solid var(--adj-gold);
    outline: 1px solid var(--adj-gold);
    outline-offset: -9px;
    box-shadow: 0 40px 70px -40px rgb(43 42 31 / 0.6);
  }
  .adj-pattern {
    background-color: var(--adj-cream);
    background-image:
      linear-gradient(rgb(241 234 219 / 0.28), rgb(241 234 219 / 0.28)),
      url("/brand/wzor-adjano-kafelek-przezroczysty.svg");
    background-position: center;
    background-size: auto, 620px auto;
  }
  @media (min-width: 64rem) {
    .adj-pattern { background-size: auto, 980px auto; }
  }
  @media (prefers-reduced-motion: no-preference) {
    .adj-rise { animation: adj-rise 700ms cubic-bezier(0.2, 0.7, 0.2, 1) both; }
  }
}

@keyframes adj-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}
```

### 4.5 `lib/typography.ts` (+ test)

Wklej 1:1:

```ts
/**
 * Polska typografia: jednoliterowe spójniki i przyimki (a, i, o, u, w, z)
 * nie mogą zostać na końcu wiersza — sklejamy je twardą spacją z następnym słowem.
 * Używaj dla tekstów z bazy (nazwy kategorii, produktów). W JSX statycznym pisz &nbsp;.
 */
export function nbsp(text: string): string {
  return text.replace(/(?<=^|[\s („"])([aiouwzAIOUWZ])\s+/g, "$1 ");
}
```

`lib/typography.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { nbsp } from "./typography";

describe("nbsp", () => {
  it("skleja jednoliterowe słowa z następnym", () => {
    expect(nbsp("Deserki w kubeczkach")).toBe("Deserki w kubeczkach");
    expect(nbsp("sałatka z serkiem i rukolą")).toBe("sałatka z serkiem i rukolą");
    expect(nbsp("chleb i w domu")).toBe("chleb i w domu");
    expect(nbsp("W pracy")).toBe("W pracy");
  });

  it("nie rusza liter w środku słów ani skrótów", () => {
    expect(nbsp("Keto & Fit")).toBe("Keto & Fit");
    expect(nbsp("bajgiel drwala")).toBe("bajgiel drwala");
    expect(nbsp("KETO murzynek")).toBe("KETO murzynek");
  });
});
```

We wszystkich statycznych tekstach landingu, headera na landingu i stopki wstaw `&nbsp;` po jednoliterowych słowach (`w&nbsp;pracy`, `i&nbsp;ciasta`, `z&nbsp;Twoim` …) — tak jak w `reference.html`.

### 4.6 `lib/shop/pickup-copy.ts` (+ test)

Wklej 1:1 (testy przechodzą, sprawdzone):

```ts
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { isoWeekday, parseDateOnly } from "@/lib/dates";

// Indeks = ISO dzień tygodnia (1 = poniedziałek … 7 = niedziela).
const ACCUSATIVE = ["", "poniedziałek", "wtorek", "środę", "czwartek", "piątek", "sobotę", "niedzielę"];
const GENITIVE = ["", "poniedziałku", "wtorku", "środy", "czwartku", "piątku", "soboty", "niedzieli"];
const SHORT = ["", "pn", "wt", "śr", "czw", "pt", "sob", "nd"];

export function shiftIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export type PickupCopy = {
  /** Najbliższy dzień odbioru (YYYY-MM-DD) albo null, gdy baza nic nie zwróciła. */
  day: string | null;
  /** „poniedziałek, 28 września” */
  longDate: string | null;
  /** „pon., 28 września” */
  shortDate: string | null;
  /** „Zamów na poniedziałek” / „Zamów na jutro” / „Przejdź do sklepu” */
  cta: string;
  /** „Co pieczemy na poniedziałek” / „Co pieczemy” */
  menuHeading: string;
  /** „Na poniedziałek zamówisz do niedzieli, 20:00.” */
  deadline: string;
};

/**
 * Teksty landingu zależne od najbliższego dnia odbioru.
 * Dzień liczy baza (available_pickup_dates) — tu tylko go opisujemy.
 * Zamówienie na dzień D przyjmujemy do cutoff w dniu D-1 (tak liczy SQL dla lead_days = 1).
 */
export function buildPickupCopy(day: string | null, cutoff: string, todayIso: string): PickupCopy {
  if (!day) {
    return {
      day: null,
      longDate: null,
      shortDate: null,
      cta: "Przejdź do sklepu",
      menuHeading: "Co pieczemy",
      deadline: `Zamówienia przyjmujemy do ${cutoff} dzień przed odbiorem.`,
    };
  }

  const tomorrowIso = shiftIsoDate(todayIso, 1);
  const target = day === tomorrowIso ? "jutro" : ACCUSATIVE[isoWeekday(day)];
  const dayBefore = shiftIsoDate(day, -1);
  const until =
    dayBefore === todayIso
      ? `dziś do ${cutoff}`
      : dayBefore === tomorrowIso
        ? `do jutra, ${cutoff}`
        : `do ${GENITIVE[isoWeekday(dayBefore)]}, ${cutoff}`;
  const date = parseDateOnly(day);

  return {
    day,
    longDate: format(date, "EEEE, d MMMM", { locale: pl }),
    shortDate: format(date, "EEE, d MMMM", { locale: pl }),
    cta: `Zamów na ${target}`,
    menuHeading: `Co pieczemy na ${target}`,
    deadline: `Na ${target} zamówisz ${until}.`,
  };
}

/** [1,2,3,4,5] → „pn–pt”, [1,3,5] → „pn, śr, pt”, [1,2,3,4,5,6] → „pn–sob”. */
export function formatWeekdays(days: number[]): string {
  const sorted = [...new Set(days)].filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const d of sorted) {
    const last = groups.at(-1);
    if (last && d === last[last.length - 1] + 1) {
      last.push(d);
    } else {
      groups.push([d]);
    }
  }
  return groups
    .flatMap((g) => (g.length >= 3 ? [`${SHORT[g[0]]}–${SHORT[g[g.length - 1]]}`] : g.map((d) => SHORT[d])))
    .join(", ");
}
```

`lib/shop/pickup-copy.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { buildPickupCopy, formatWeekdays, shiftIsoDate } from "./pickup-copy";

describe("buildPickupCopy", () => {
  it("piątek przed 20:00 → odbiór w poniedziałek, zamówienie do niedzieli", () => {
    const copy = buildPickupCopy("2026-09-28", "20:00", "2026-09-25");
    expect(copy.longDate).toBe("poniedziałek, 28 września");
    expect(copy.shortDate).toBe("pon., 28 września");
    expect(copy.cta).toBe("Zamów na poniedziałek");
    expect(copy.menuHeading).toBe("Co pieczemy na poniedziałek");
    expect(copy.deadline).toBe("Na poniedziałek zamówisz do niedzieli, 20:00.");
  });

  it("wtorek przed cutoff → na jutro, dziś do 20:00", () => {
    const copy = buildPickupCopy("2026-09-30", "20:00", "2026-09-29");
    expect(copy.cta).toBe("Zamów na jutro");
    expect(copy.menuHeading).toBe("Co pieczemy na jutro");
    expect(copy.deadline).toBe("Na jutro zamówisz dziś do 20:00.");
  });

  it("wtorek po cutoff → na czwartek, do jutra", () => {
    const copy = buildPickupCopy("2026-10-01", "20:00", "2026-09-29");
    expect(copy.cta).toBe("Zamów na czwartek");
    expect(copy.deadline).toBe("Na czwartek zamówisz do jutra, 20:00.");
  });

  it("odmienia środę, sobotę i niedzielę", () => {
    expect(buildPickupCopy("2026-09-30", "20:00", "2026-09-25").cta).toBe("Zamów na środę");
    expect(buildPickupCopy("2026-10-03", "20:00", "2026-09-29").cta).toBe("Zamów na sobotę");
    expect(buildPickupCopy("2026-10-01", "20:00", "2026-09-28").deadline).toBe(
      "Na czwartek zamówisz do środy, 20:00.",
    );
  });

  it("bez dnia z bazy → teksty ogólne", () => {
    const copy = buildPickupCopy(null, "20:00", "2026-09-25");
    expect(copy.cta).toBe("Przejdź do sklepu");
    expect(copy.menuHeading).toBe("Co pieczemy");
    expect(copy.longDate).toBeNull();
  });
});

describe("formatWeekdays", () => {
  it("zwija ciągi od trzech dni", () => {
    expect(formatWeekdays([1, 2, 3, 4, 5])).toBe("pn–pt");
    expect(formatWeekdays([6, 1, 2, 3, 4, 5])).toBe("pn–sob");
    expect(formatWeekdays([1, 3, 5])).toBe("pn, śr, pt");
    expect(formatWeekdays([1, 2])).toBe("pn, wt");
  });
});

describe("shiftIsoDate", () => {
  it("przesuwa daty przez granice miesiąca", () => {
    expect(shiftIsoDate("2026-09-30", 1)).toBe("2026-10-01");
    expect(shiftIsoDate("2026-03-01", -1)).toBe("2026-02-28");
  });
});
```

### 4.7 `lib/shop/landing-data.ts`

Jedno źródło danych dla paska, landingu i stopki. Owiń w `cache` z `react`, żeby header, strona i stopka w jednym żądaniu zrobiły **jedno** zapytanie.

- `export const getPickupBasics = cache(async (): Promise<PickupBasics> => …)`
- Gdy `getSupabasePublicEnv()` zwraca null albo cokolwiek rzuci → fallback: `{ cutoff: "20:00", day: null, phone: null, orderWeekdays: [1, 2, 3, 4, 5], publicPoints: [] }`. Strona musi działać bez bazy (jak dziś).
- W `Promise.all`:
  - `settings`: `cutoff_time, owner_phone, order_weekdays` (`.eq("id", 1).maybeSingle()`),
  - `supabase.rpc("available_pickup_dates")` — dokładnie tak jak dziś w `page.tsx`, pierwszy element (`slice(0, 10)`) to `day`,
  - `pickup_points`: `id, name, address, description, pickup_from, pickup_to, weekdays` z `.eq("is_active", true).eq("visibility", "public").order("sort_order")`. **Tylko publiczne** — sąd i urząd nie mogą pojawić się na landingu nawet zalogowanej właścicielce (RLS pokazuje staffowi wszystko).
- Zwracaj: `cutoff` (przez `formatCutoff`), `day`, `phone` (trim albo null), `orderWeekdays`, `publicPoints` z polami gotowymi do wyświetlenia: `name`, `address`, `description`, `days` = `formatWeekdays(point.weekdays ∩ orderWeekdays)`, `hours` = `formatTimeRange(pickup_from, pickup_to)` z `lib/format.ts`.
- Typy z `database.types.ts`, bez `any`.

### 4.8 `lib/shop/category-tiles.ts`

- `ProductRow` dostaje opcjonalne `price_grosze?: number | null`.
- `ShopCategoryTileData` dostaje `minPriceGrosze: number | null` = najniższa `price_grosze` wśród produktów kategorii dostępnych w danym dniu (te same, które liczą się do `productCount`); brak cen → `null`.
- `/sklep` nie przekazuje cen → dostaje `null`, nic się tam nie zmienia wizualnie.

### 4.9 Header

`components/shop/site-header-shell.tsx`:
- Nowy opcjonalny prop `announcement?: ReactNode`.
- **Landing (`pathname === "/"`)**: usuń tryb przezroczysty i nasłuch scrolla. Renderuj:
  1. `{announcement}` (zwykły blok, przewija się),
  2. `<header className="sticky top-0 z-50 border-b border-[rgba(43,42,31,0.18)] bg-[var(--adj-cream)]/95 text-[var(--adj-ink)] backdrop-blur">` z kontenerem `mx-auto flex h-[68px] w-full max-w-[1280px] items-center justify-between px-5 lg:h-[84px] lg:px-12`. Bez złotej linii.
- **Pozostałe strony**: bez zmian (khaki, `max-w-3xl`, złota linia).

`components/shop/site-header.tsx`:
- `const pickup = await getPickupBasics(); const copy = buildPickupCopy(pickup.day, pickup.cutoff, warsawDateIso());`
- Przekaż `announcement={<LandingStrip copy={copy} cutoff={pickup.cutoff} />}` do shella.
- Po linku „Sklep” wstaw `<LandingNavLinks />`.
- Zamień obecny `<Link><Image …/></Link>` na `<HeaderLogo />`.

`components/shop/header-logo.tsx` (`"use client"`, `usePathname`):
- na `/`: `next/image` `/brand/adjano-logo-red.svg`, `width={585} height={332}`, `className="h-auto w-[100px] lg:w-[128px]"`, `priority`,
- na pozostałych stronach dokładnie to, co jest dziś (`/brand/adjano-logo.png`, `h-9 w-[120px]`),
- link zawsze na `/`, `aria-label="Adjano — strona główna"`.

`components/shop/landing-nav-links.tsx` (`"use client"`): gdy `usePathname() === "/"`, dwa linki `href="#jak-to-dziala"` („Jak to działa”) i `href="#punkty-odbioru"` („Punkty odbioru”), klasy jak link „Sklep” + `hidden lg:flex`. Na innych stronach `null`.

`components/landing/landing-strip.tsx` (serwerowy):
- `bg-[var(--adj-khaki)] text-[var(--adj-cream)]`, kontener jak wyżej, `min-h-[38px] md:min-h-10`, `adj-ui text-[13px] md:text-sm tracking-[0.02em]`, elementy w rzędzie z `gap-3 md:gap-[18px]`, na desktopie wyśrodkowane, separatory `h-3.5 w-px bg-[var(--adj-cream)]/35`.
- Desktop (`hidden md:inline`): `Najbliższy odbiór: <b>{copy.longDate}</b>` | `Zamówienia do {cutoff} dzień wcześniej` | `BLIK, Przelewy24 albo karta`.
- Telefon (`md:hidden`): `Najbliższy odbiór: <b>{copy.shortDate}</b>` | `Zamówisz do {cutoff}`.
- Gdy `copy.day === null`: sam tekst `Zamówienia do {cutoff} dzień przed odbiorem`.
- `<b>` = `font-[650]`.

### 4.10 Landing — `app/(shop)/page.tsx` + `components/landing/*`

`page.tsx`:
- `metadata` zostaje jak jest.
- Dane: `getPickupBasics()` + kategorie, produkty (**dodaj `price_grosze` do selecta**) i `product_availability` dla `pickup.day` — jak dziś. `buildCategoryTiles` jak dziś.
- `copy = buildPickupCopy(pickup.day, pickup.cutoff, warsawDateIso())`, `shop = pickup.publicPoints[0] ?? null`, `shopHref = copy.day ? /sklep?dzien=${copy.day} : /sklep`.
- Render: `<div className="adj-landing">` → `LandingHero`, `LandingShelf`, `LandingHow`, `LandingStory`, `LandingBag`. Stopka przychodzi z layoutu.
- Wspólny kontener sekcji: `mx-auto w-full max-w-[1280px] px-5 lg:px-12`.

Wszystkie wymiary są z `reference.css`. Mobile-first; układy wielokolumnowe od `lg` (1024 px).

**Typografia wspólna**
- H1: `font-heading font-medium text-[3rem] leading-[1.02] tracking-[-0.02em] text-balance md:text-[4.25rem] lg:text-[5.375rem] lg:leading-[0.98]`; `<em>` w H1: `block font-normal italic text-[var(--adj-khaki)]`.
- H2: `font-heading font-medium text-[2.375rem] leading-[1.06] tracking-[-0.015em] text-balance lg:text-[3.625rem] lg:leading-[1.02]`; `<em>` w H2: `font-normal italic`.
- Etykieta sekcji nad H2: `adj-label text-[var(--adj-red)]`, odstęp do H2 `mt-[18px]`.
- Tekst drugorzędny: `text-[var(--adj-ink-soft)]`.

**`LandingHero`** — `pt-9 pb-16 lg:pt-[72px] lg:pb-24`; siatka `grid gap-4 lg:grid-cols-[7.2fr_4.8fr] lg:gap-10 lg:items-center`.
- Lewa kolumna:
  - `adj-label text-[var(--adj-red)] flex flex-wrap items-center gap-x-3.5 gap-y-2.5 adj-rise`: `Piekarnia-Cukiernia` · `Mikołów-Kamionka` (ten i jego kropka `hidden md:inline`) · `od 1937`. Kropki: `size-1 rounded-full bg-[var(--adj-gold)]`.
  - H1 (`mt-[18px] lg:mt-7`): `Zamów do {cutoff},` + `<em>rano odbierzesz w&nbsp;pracy.</em>`
  - Lead (`mt-[22px] lg:mt-[30px] max-w-[34em] text-[1.1875rem] lg:text-[1.3125rem] leading-[1.55] text-[var(--adj-ink-soft)]`): `Pieczywo, kanapki i&nbsp;ciasta z&nbsp;piekarni przy Katowickiej 120. Zamówienie składasz przez internet, a&nbsp;rano odbierasz je w&nbsp;wybranym punkcie.`
  - CTA (`mt-[30px] lg:mt-10 flex flex-wrap items-center gap-x-[30px] gap-y-3.5`): `<Link className="adj-btn w-full md:w-auto" href={shopHref}>{copy.cta}</Link>` + `<a className="adj-link" href="#jak-to-dziala">Jak to działa</a>`.
  - Meta (`mt-7 lg:mt-9 pt-[22px] border-t border-[rgba(43,42,31,0.18)] flex flex-col gap-2 md:flex-row md:flex-wrap md:gap-x-[22px] adj-ui text-[15px] text-[var(--adj-ink-soft)]`), ikony 17 px w czerwieni (lucide `Clock` i `Lock`, `strokeWidth={1.6}`):
    - `Odbiór w&nbsp;piekarni: {shop.days}, {shop.hours}` — tylko gdy jest `shop`,
    - `W&nbsp;pracy: na kod od pracodawcy`.
- Prawa kolumna — martwa natura (`aria-hidden`), `relative h-[390px] mt-3 lg:mt-0 lg:h-[600px]`:
  - pierścień: `adj-ring absolute left-1/2 top-1/2 size-[330px] -translate-x-1/2 -translate-y-1/2 lg:size-[500px]`,
  - chleb: `absolute -right-[22px] top-0 w-[300px] lg:-right-6 lg:-top-1.5 lg:w-[450px]`, `next/image` `/brand/hero-chleb.png`, `priority`, `className="adj-cutout h-auto w-full"`, `sizes="(min-width: 1024px) 450px, 300px"`,
  - bułki: `absolute -left-[18px] bottom-1.5 w-[184px] lg:-left-[34px] lg:bottom-[18px] lg:w-[270px]`, `/brand/hero-bulki.png`, `adj-cutout`,
  - zawieszka: `absolute right-1 bottom-4 w-[168px] lg:right-[18px] lg:bottom-11 lg:w-[200px] -rotate-3 bg-[var(--adj-paper-light)] border border-[rgba(184,151,90,0.55)] px-3.5 pt-4 pb-3.5 lg:px-[18px] lg:pt-[18px] lg:pb-4 shadow-[0_1px_0_rgba(43,42,31,0.06),0_12px_28px_-18px_rgba(43,42,31,0.45)]`; na górze kółeczko `size-[9px] rounded-full border border-[var(--adj-gold)] bg-[var(--adj-cream)] mx-auto`; tekst `mt-3 text-center italic text-lg lg:text-[21px] leading-[1.15]` = `Pieczone w&nbsp;Kamionce`; pod spodem `adj-label mt-2 text-center text-[11px] text-[var(--adj-ink-soft)]` = `ul. Katowicka 120`.
  - Wrapper zdjęć **bez tła** i bez `z-index`/`isolation` — inaczej multiply nie złapie papieru.

**`LandingShelf`** — `id="sklep"`, `py-[72px] lg:pt-28 lg:pb-[104px]`.
- Nagłówek sekcji: `flex flex-col items-start gap-5 lg:flex-row lg:items-end lg:justify-between`: etykieta `Menu`, H2 `{copy.menuHeading}`, po prawej `adj-link` `Cały sklep` → `shopHref`.
- Siatka `<ul className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 lg:mt-14 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14">`.
- Kafel (osobny komponent w `landing-shelf.tsx`, `CategoryTile` zostaje nietknięty): `<Link>` na `/sklep/${slug}?dzien=${day}` (jak `CategoryTile`), `group block`:
  - obraz: `relative aspect-square overflow-hidden border-b border-[var(--adj-ink)]` (**bez tła**), `next/image fill` z `categoryPublicUrl(imagePath)`, `className="adj-cutout object-contain object-bottom transition-transform duration-300 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:-translate-y-1.5 group-hover:scale-[1.02]"`, `sizes="(min-width: 1024px) 25vw, 50vw"`; bez zdjęcia: ta sama ikona co w `CategoryTile`, wyśrodkowana, `size-14 text-[var(--adj-khaki-light)]`,
  - odznaki `promocje` / `kończy się`: `absolute left-0 top-0 adj-label text-[11px] text-[var(--adj-red)] border border-[var(--adj-red)] bg-[var(--adj-paper-light)] px-2 py-1` (jedna pod drugą, `gap-1`),
  - nazwa `mt-3 lg:mt-[18px] text-[21px] lg:text-[27px] leading-[1.15] font-medium group-hover:text-[var(--adj-red)]` = `nbsp(name)`,
  - meta `adj-label mt-2 text-[11px] tracking-[0.12em] lg:text-[13px] lg:tracking-[0.16em] text-[var(--adj-khaki-light)]` = `{n} {pozycja|pozycje|pozycji} · od {formatPrice(minPriceGrosze)}` (część z ceną tylko, gdy jest cena). Odmiana: 1 pozycja; 2–4 (poza 12–14) pozycje; reszta pozycji.
- Ostatni element listy (zawsze): `<li className="col-span-2 lg:col-span-1">` z `<Link href="/zamowienie-specjalne" className="flex h-full flex-col justify-between border border-[var(--adj-ink)] p-[22px] lg:px-[26px] lg:py-7">`: etykieta `Zamówienie specjalne` (czerwona), `mt-4 text-2xl lg:text-[27px] leading-[1.15] font-medium` `Większa ilość albo coś spoza menu?`, `mt-3 text-[17px] text-[var(--adj-ink-soft)]` `Napisz, czego potrzebujesz i&nbsp;na kiedy. Odezwiemy się.`, na dole `adj-link mt-6 self-start` `Napisz do nas`.
- Brak kafli (baza niedostępna): zamiast siatki zdanie `Menu na najbliższe dni jest w&nbsp;sklepie.` + `adj-link` `Przejdź do sklepu`.

**`LandingHow`** — `id="jak-to-dziala"`, `scroll-mt-24`, `bg-[var(--adj-cream-dark)] py-[72px] lg:py-[104px]`.
- Etykieta `Jak to działa`, H2 `Tak paczka trafia do&nbsp;Ciebie`.
- Siatka `mt-7 lg:mt-12 grid border-t border-[var(--adj-ink)] lg:grid-cols-3`; kolumny `py-6 lg:pt-8 lg:pb-[34px] lg:pr-10`, druga i trzecia `border-t border-[rgba(43,42,31,0.18)] lg:border-t-0 lg:border-l lg:pl-10`:
  - duże słowo `italic font-normal text-[42px] lg:text-[52px] leading-none text-[var(--adj-red)]`, `h3 mt-3 lg:mt-4 text-[23px] lg:text-[26px] leading-[1.2] font-medium`, `p mt-2 text-[var(--adj-ink-soft)]`:
    1. `do {cutoff}` · `Zamawiasz` · `Wybierasz dzień i&nbsp;punkt odbioru. Płacisz BLIK-iem, Przelewy24 albo kartą.`
    2. `rano` · `Pieczemy i&nbsp;pakujemy` · `Każda paczka dostaje etykietę z&nbsp;Twoim imieniem.`
    3. `na kod` · `Odbierasz` · `W&nbsp;punkcie podajesz cztery znaki z&nbsp;e‑maila.` (w „e‑maila” twardy dywiz U+2011).
- Punkty odbioru (`id="punkty-odbioru"`, `scroll-mt-24`): `grid gap-6 pt-[26px] border-t border-[rgba(43,42,31,0.18)] lg:grid-cols-2 lg:gap-x-10`; każda pozycja = `adj-label text-[var(--adj-ink-soft)]` + `p mt-2 text-[17px]`:
  - dla każdego publicznego punktu: etykieta `Odbiór w&nbsp;piekarni` (pierwszy; kolejne `Punkt odbioru`), tekst `{name}, {address}` + `<span className="text-[var(--adj-ink-soft)]"> · {days}, {hours}</span>`,
  - stała pozycja: etykieta `Odbiór w&nbsp;pracy`, tekst `Dowozimy do kilku instytucji w&nbsp;Mikołowie.` + `<span className="text-[var(--adj-ink-soft)]"> Kod dostaniesz w&nbsp;sekretariacie i&nbsp;wpiszesz go w&nbsp;koszyku.</span>`
  - **Nigdy** nie wypisuj nazw punktów `restricted`.

**`LandingStory`** — `id="o-nas"`, `py-[72px] lg:pt-[120px] lg:pb-28` (papier).
- Górny rząd `grid gap-9 lg:grid-cols-[7fr_5fr] lg:gap-[72px] lg:items-center`:
  - zdjęcie (na telefonie **pod** tekstem: `order-2 lg:order-none`) `relative aspect-[3/2] overflow-hidden bg-[var(--adj-cream-dark)]`, `next/image fill` `/brand/landing/piec-lopata.jpg`, alt `Upieczony bochenek na drewnianej łopacie przy otwartym piecu`, `className="adj-photo object-cover"`, `sizes="(min-width: 1024px) 55vw, 100vw"`,
  - tekst: etykieta `O&nbsp;nas`, H2 `Pieczemy w&nbsp;Kamionce od <em className="text-[var(--adj-red)]">1937</em> roku.`, akapity `mt-6` / `mt-3.5`, `text-lg lg:text-[19px] text-[var(--adj-ink-soft)]`:
    - `Jesteśmy rodzinną piekarnią i&nbsp;cukiernią przy Katowickiej 120. Bochenki wyrastają u&nbsp;nas w&nbsp;koszykach, a&nbsp;do pieca wkładamy je drewnianą łopatą.`
    - `Oprócz chleba i&nbsp;bułek robimy ciasta, a&nbsp;do pracy także kanapki, sałatki i&nbsp;deserki w&nbsp;kubeczkach.`
  - fakty `<dl className="mt-8 border-t border-[var(--adj-ink)]">`, wiersze `grid grid-cols-[116px_1fr] gap-3 lg:grid-cols-[150px_1fr] lg:gap-4 py-[13px] border-b border-[rgba(43,42,31,0.18)] text-[17px]`, `dt` = `adj-ui text-[15px] text-[var(--adj-ink-soft)] pt-0.5`:
    - `Adres` / `ul. Katowicka 120, 43-190 Mikołów`,
    - `Odbiór w&nbsp;sklepie` / `{shop.days}, {shop.hours}` — tylko gdy jest `shop`,
    - `Telefon` / `<a href="tel:…">{phone}</a>` — **tylko gdy `phone` jest ustawiony**.
- Dolny rząd `mt-6 grid grid-cols-2 gap-3 lg:mt-16 lg:grid-cols-12 lg:gap-6 lg:items-end`:
  - `<figure className="lg:col-start-2 lg:col-span-4">`: `relative aspect-[4/5] overflow-hidden` z `piec-koszyki.jpg` (`adj-photo object-cover object-[30%_50%]`), alt `Koszyki z wyrastającym ciastem na regałach, w tle piekarz przy piecu`, podpis `Koszyki do wyrastania.`,
  - `<figure className="lg:col-start-7 lg:col-span-6">`: `relative aspect-[4/5] lg:aspect-[3/2] overflow-hidden` z `piec-trzon.jpg` (`adj-photo object-cover object-[62%_50%] lg:object-center`), alt `Bochenki pieką się w piecu`, podpis `Bochenki w&nbsp;piecu.`,
  - podpisy `mt-3.5 text-sm lg:text-[15px] italic text-[var(--adj-ink-soft)]`.

**`LandingBag`** — `adj-pattern py-16 lg:py-[120px]`.
- Naklejka `adj-framed mx-auto max-w-[660px] px-6 pt-10 pb-10 text-center lg:px-14 lg:pt-[52px] lg:pb-[52px]`:
  - logo `/brand/adjano-logo-red.svg`, `w-24 lg:w-[120px] mx-auto h-auto`, alt `Adjano`,
  - H2 `mt-[22px] lg:mt-[26px] text-[34px] lg:text-[50px]` = `{copy.deadline}`,
  - `mt-[34px]` przycisk `adj-btn w-full md:w-auto` = `{copy.cta}` → `shopHref`.

### 4.11 Stopka — `components/shop/site-footer.tsx`

Ta sama na wszystkich stronach sklepu (to celowe).
- Komponent `async`, dane z `getPickupBasics()`.
- `bg-[var(--adj-khaki)] text-[var(--adj-cream)] pb-9`, na samej górze `<div className="adj-gilt" />`.
- Kontener `mx-auto max-w-[1280px] px-5 lg:px-12`, siatka `grid gap-9 pt-12 lg:grid-cols-[4fr_2.6fr_2.6fr_2.6fr] lg:gap-10 lg:pt-16`, tekst `font-heading text-[17px] leading-[1.7]`, nagłówki kolumn `adj-label text-[var(--adj-gold-light)]`:
  1. logo `/brand/adjano-logo-cream.svg` `w-[138px] h-auto` + `mt-3.5 max-w-[20em] text-[var(--adj-cream)]/80`: `Piekarnia-Cukiernia Adjano. Rodzinna piekarnia z&nbsp;Kamionki, od 1937 roku.`
  2. `Adres`: `ul. Katowicka 120` / `43-190 Mikołów`; pod spodem `tel. {phone}` jako link `tel:` — tylko gdy ustawiony. **Usuń `+48 000 000 000`.**
  3. `Odbiór w&nbsp;sklepie`: `{days}, {hours}` pierwszego publicznego punktu (brak → kolumna znika).
  4. `Informacje`: `Regulamin`, `Polityka prywatności`, `Zamówienia specjalne` (linki jak dziś, `hover:underline underline-offset-4`).
- Dół: `mt-11 lg:mt-16 pt-[22px] border-t border-[var(--adj-cream)]/20 flex flex-col gap-2 md:flex-row md:justify-between adj-ui text-sm text-[var(--adj-cream)]/70`: `© {rok} Piekarnia-Cukiernia Adjano` / `Zamówienia online: AdjanoDeli`.
- Zostaw komentarz o braku banera cookies.

---

## 5. Zasady, których pilnujesz

- Daty i cutoff biorą się z bazy (`available_pickup_dates`, `settings`). Landing tylko je opisuje; klient nic nie liczy.
- Ceny przez `formatPrice`, godziny przez `formatTimeRange`.
- Przyciski i linki dotykowe min. 48 px wysokości na telefonie (`adj-btn` ma 56 px).
- `mix-blend-mode: multiply` działa tylko wtedy, gdy między zdjęciem a tłem sekcji nie ma elementu z własnym tłem, `z-index`, `opacity < 1` ani `isolation`. Wrappery zdjęć produktów zostają bez tła.
- Maskotka Janosz (`janosz.png`) **nie** pojawia się na landingu (SPEC).
- Bez nowych bibliotek. Ikony z `lucide-react`, które już są w projekcie.
- Nie ruszaj `/sklep`, koszyka, panelu ani e-maili.

## 6. Odbiór

1. `npm test` — nowe testy (`pickup-copy`, `typography`) przechodzą, stare też.
2. `npm run lint` i `npm run build` bez błędów.
3. `npm run dev`, otwórz `/` na 390 px i 1440 px, porównaj z `desktop.jpg` / `mobile.jpg`:
   - produkty leżą na papierze, wokół zdjęć nie widać białych prostokątów,
   - pasek nad headerem pokazuje najbliższy dzień z bazy, CTA brzmi „Zamów na …” z poprawną odmianą,
   - w punktach odbioru widać tylko „Piekarnia Adjano” i pozycję „Odbiór w pracy” — także po zalogowaniu kontem właścicielki,
   - w stopce i w „O nas” nie ma zmyślonego telefonu,
   - żadne „w”, „i”, „z”, „a” nie wisi na końcu wiersza.
4. Bez zmiennych Supabase (`NEXT_PUBLIC_SUPABASE_URL` pusty) strona się renderuje: ogólne teksty, bez kafli, bez punktów.

Na koniec wypisz zmienione pliki i jedno zdanie, jak przetestować (zasada z `.cursor/rules/adjano.mdc`).
