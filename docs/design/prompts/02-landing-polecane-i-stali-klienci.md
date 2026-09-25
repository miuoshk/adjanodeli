# 02 · Landing: „Polecamy” i „Dla stałych klientów”

> Uruchamiasz **po** prompcie 01 (landing v4), kiedy jest zmergowany i działa. Zakres: dwie nowe części landingu, flaga „polecany” na produkcie, pole w panelu.

## 0. Zanim zaczniesz

1. Przeczytaj `docs/SPEC.md`. Ten prompt dopisuje kolumnę `products.is_featured` i zmienia opis `/` — krok 1 aktualizuje SPEC.
2. `git status` ma być czysty. Jeśli nie jest, zatrzymaj się i zapytaj.
3. Wzorzec wyglądu to ten sam system co w prompcie 01 (`docs/design/landing-v2/reference.css`): Brygada 1918, Archivo, klasy `adj-*`, tokeny `--adj-*`.

## 1. SPEC

- W modelu danych `products` dopisz: `is_featured boolean not null default false` — produkt pokazywany w sekcji „Polecamy” na stronie głównej. Ustawia właścicielka w panelu.
- Opis `/` uzupełnij o: `po hero sekcja „Polecamy” (do 4 produktów z is_featured dostępnych na najbliższy dzień), w „Jak to działa” blok „Dla stałych klientów” (pieczątki, stałe zamówienie, faktura).`

## 2. Baza

Nowa migracja `supabase/migrations/0019_featured_products.sql`:

```sql
alter table public.products
  add column if not exists is_featured boolean not null default false;

comment on column public.products.is_featured is
  'Pokazywany w sekcji Polecamy na stronie głównej (ustawia owner).';
```

Potem `npx supabase db push` i `npm run db:types`. Typy tylko z generatora, bez ręcznych edycji.

## 3. Panel — pole „Polecany”

- `components/admin/product-form.tsx`: w schemacie `isFeatured: z.boolean()`, domyślnie `product?.is_featured ?? false`, checkbox dokładnie jak „Nowość” (ten sam `FormField`), podpis `Polecany na stronie głównej`.
- `lib/admin/owner-actions.ts`: `isFeatured: boolean` w typie payloadu i `is_featured: payload.isFeatured` w insercie i update (tak jak `is_new`).
- `app/admin/(panel)/produkty/page.tsx`: jeśli lista ma kolumnę/znacznik „Nowość”, dodaj obok taki sam znacznik „Polecany”. Jeśli nie ma — nic nie dodawaj.

## 4. `lib/shop/pickup-copy.ts`

Dodaj do `PickupCopy` pole `featuredHeading`:
- z dniem: `Polecamy na ${target}` („Polecamy na poniedziałek”, „Polecamy na jutro”),
- bez dnia: `Polecamy`.

W `pickup-copy.test.ts` dopisz asercje `featuredHeading` do istniejących przypadków (poniedziałek, jutro, null).

## 5. Dane na landing — `app/(shop)/page.tsx`

- W zapytaniu o produkty dodaj `name, description, price_grosze, image_path, is_featured` (reszta jak jest).
- `featured` = produkty `is_active && is_featured`, dostępne w dniu `pickup.day` (`weekdays` zawiera dzień tygodnia), posortowane po `sort_order`, max 4. Cena efektywna i „wyprzedane” z `product_availability` (`effective_price_grosze`, `is_promo`, `is_available`, `remaining`) — tak jak w `app/(shop)/sklep/[kategoria]/page.tsx`.
- Link każdego produktu: `/sklep/${slugKategorii}?dzien=${day}` (slug z listy kategorii).
- Mniej niż 2 polecane → sekcji nie ma.

## 6. `components/landing/landing-featured.tsx` (nowy)

Sekcja między `LandingHero` a `LandingShelf`: `bg-[var(--adj-cream-dark)] py-[72px] lg:py-24`.

- Nagłówek: `flex flex-col items-start gap-5 lg:flex-row lg:items-end lg:justify-between`; etykieta `adj-label text-[var(--adj-red)]` = `Polecamy`, H2 (klasy H2 z promptu 01) = `{copy.featuredHeading}`, po prawej `adj-link` `Cały sklep` → `shopHref`.
- Siatka `mt-9 lg:mt-12 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-8`.
- Karta (`<Link>` na kategorię, `group block`):
  - zdjęcie `relative aspect-square overflow-hidden border-b border-[var(--adj-ink)]` (**bez tła** — zdjęcie produktu z klasą `adj-cutout` kładzie się na `cream-dark`), `next/image fill` z `productPublicUrl(image_path)`, `object-contain object-bottom`, hover jak w kaflach półki (`group-hover:-translate-y-1.5 group-hover:scale-[1.02]`),
  - wyprzedane: na zdjęciu `opacity-50 grayscale`, a w lewym górnym rogu etykieta `adj-label text-[11px] text-[var(--adj-ink-soft)] border border-[var(--adj-ink-soft)] bg-[var(--adj-paper-light)] px-2 py-1` = `Wyprzedane`,
  - nazwa `mt-3 lg:mt-4 text-[20px] lg:text-[24px] leading-[1.15] font-medium group-hover:text-[var(--adj-red)]` = `nbsp(name)` (nazwa z bazy, z pierwszą wielką literą: `name.charAt(0).toLocaleUpperCase("pl") + name.slice(1)`),
  - opis `mt-1.5 line-clamp-2 text-[15px] leading-[1.45] text-[var(--adj-ink-soft)]` = pierwsze zdanie `description` (do pierwszej kropki lub nowej linii; brak opisu → nic),
  - cena `mt-3 adj-ui text-[17px] font-semibold`: `formatPrice(effective)`; przy promocji cena w `text-[var(--adj-red)]` i obok `line-through text-[var(--adj-ink-soft)] font-normal` cena regularna.

## 7. „Dla stałych klientów” — w `components/landing/landing-how.tsx`

Po bloku punktów odbioru, w tej samej sekcji:

- Wrapper `mt-14 border-t border-[var(--adj-ink)] pt-10 lg:mt-16`, etykieta `adj-label text-[var(--adj-red)]` = `Dla stałych klientów`.
- Siatka `mt-6 grid gap-8 lg:grid-cols-3 lg:gap-10`, każda kolumna: `h3 text-[23px] lg:text-[26px] leading-[1.2] font-medium` + `p mt-2 text-[var(--adj-ink-soft)]`:
  1. `Pieczątki` · `Za każdy opłacony produkt dostajesz pieczątkę. Przy 10 pieczątkach masz −10% na zamówienie, przy 20 −50% (maks. 40&nbsp;zł), a&nbsp;przy 30 najtańszy produkt za 1&nbsp;grosz.` + w nowej linii `text-sm` `Pieczątki są ważne 60 dni.`
  2. `Stałe zamówienie` · `Zapisz zamówienie jako stałe. Dzień wcześniej o&nbsp;17:00 przypomnimy Ci mailem, a&nbsp;jednym kliknięciem przeniesiesz te same produkty do koszyka.`
  3. `Faktura na firmę` · `Zaznacz fakturę w&nbsp;koszyku i&nbsp;podaj NIP.`
- Progi i ważność bierz z SPEC §13. Jeśli kiedyś się zmienią w SQL, ten tekst trzeba poprawić (dopisz komentarz w kodzie).

## 8. Półka kategorii bez cen

W `components/landing/landing-shelf.tsx` meta kafla pokazuje już tylko liczbę pozycji (`10 pozycji`). Część `· od X zł` usuń. Pole `minPriceGrosze` w danych zostaw.

## 9. Odbiór

1. `npm test`, `npm run lint`, `npm run build`.
2. W panelu zaznacz „Polecany” przy 4 produktach dostępnych w poniedziałek → na `/` pojawia się sekcja „Polecamy na …” z cenami. Odznacz do jednego → sekcja znika.
3. Produkt wyprzedany na dany dzień ma etykietę „Wyprzedane” i szare zdjęcie.
4. Na 390 px dwie kolumny, nic nie wychodzi poza ekran.

Na koniec wypisz zmienione pliki i jedno zdanie, jak przetestować.
