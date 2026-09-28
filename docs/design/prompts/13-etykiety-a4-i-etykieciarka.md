# 13 · Etykiety: etykieciarka i A4, czytelna czcionka

> Uwaga Justyny: „czcionka za mała do druku etykiet, dać dwie opcje: pełne A4 i etykieciarka”. Dziś jest jeden format 75 × 60 mm z tekstem 7–8 pt. Zakres: `app/admin/paczki/drukuj` i linki do niego. Dane i zapytania bez zmian. Bez nowych bibliotek.

## 0. Zanim zaczniesz

1. `git status`: poprzednie prompty zacommitowane, poza nieśledzonymi `.cursor/`, `Claude outputs/`, `public/img/` czysto.
2. Przeczytaj `app/admin/paczki/drukuj/layout.tsx`, `page.tsx` i `lib/labels/mask-customer-name.ts`.

## 1. Formaty w jednym miejscu

Nowy plik `lib/labels/formats.ts`:

```ts
export const LABEL_FORMATS = {
  etykieta: { name: "Etykieciarka", page: "75mm 60mm", width: "75mm", height: "60mm", perPage: 1 },
  a4: { name: "A4, 8 na stronie", page: "A4", width: "105mm", height: "74.25mm", perPage: 8 },
} as const;
export type LabelFormat = keyof typeof LABEL_FORMATS;
```

Rozmiar etykieciarki zostaje 75 × 60 mm, jak dziś. Jeśli Justyna ma inną rolkę, zmienia się tylko ta stała.

## 2. Wybór formatu

`/admin/paczki/drukuj?dzien=…&punkt=…&format=etykieta|a4`, domyślnie `etykieta`.

Pasek narzędzi (niewidoczny w druku):

- dwa przełączniki „Etykieciarka 7,5 × 6 cm” i „A4 (8 na stronie)”, aktywny wyróżniony;
- przy A4 pole „Linie cięcia” (domyślnie włączone, parametr `linie=0` wyłącza);
- przycisk drukowania z napisem zależnym od formatu: „Drukuj na etykieciarce” / „Drukuj na A4”;
- jedna linijka podpowiedzi: „W oknie druku: skala 100%, marginesy: brak, bez nagłówków i stopek.”

Regułę `@page` i wymiary etykiety bierz z `LABEL_FORMATS` dla wybranego formatu. Style druku zostają w `layout.tsx` albo przechodzą do `page.tsx`, ale mają obowiązywać tylko jeden format naraz.

## 3. Co jest na etykiecie

Kolejność: kod odbioru, klient, punkt i dzień, produkty, uwaga, na dole mały numer zamówienia.

- **Kod odbioru**: monospace, pogrubiony.
- **Klient**: `maskCustomerName`, jak dziś.
- **Pełny e-mail usuń z etykiety.** Nazwisko jest maskowane, a pełny e-mail na paczce w punkcie podważa to maskowanie. Zamiast tego na dole mały numer `#{order_number}`.
- **Produkty**: `2× Chleb żytni`. Za długa lista: pokaż tyle, ile się zmieści, a na końcu „+ N pozycji więcej”.
- **Uwaga**: maks. 2 linijki, dalej wielokropek.
- Logo w tuszu zostaje w prawym górnym rogu.

Rozmiary tekstu:

| Element | Etykieciarka 75 × 60 mm | A4, 105 × 74 mm |
|---|---|---|
| Kod | 30 pt | 34 pt |
| Klient | 12 pt | 14 pt |
| Punkt · dzień | 10 pt | 12 pt |
| Produkty | 10 pt, maks. 4 linijki | 12 pt, maks. 7 linijek |
| Uwaga | 9 pt, maks. 2 linijki | 11 pt, maks. 2 linijki |
| Numer | 8 pt | 9 pt |
| Logo | 18 mm | 24 mm |

Żaden tekst nie może wyjść poza etykietę ani przeskoczyć na następną stronę.

## 4. A4

- Siatka 2 × 4 na stronie A4 bez marginesów, komórka 105 × 74,25 mm (pasuje do typowych arkuszy etykiet 8 na A4 i do zwykłego papieru).
- Wewnątrz komórki margines 5 mm.
- Linie cięcia: przerywana linia 0,3 mm w jasnoszarym kolorze na krawędziach komórek.
- Po 8 etykietach nowa strona. Etykieta nigdy nie jest cięta między stronami.

## 5. Linki

- `app/admin/(panel)/paczki/page.tsx`: przy każdym punkcie i na górze strony dwa linki „Etykiety: etykieciarka” i „Etykiety: A4”.
- „Dziś” (krok 2 z promptu 12): te same dwa linki.

## 6. SPEC

§9 (`/admin/paczki`): dwa formaty druku, brak e-maila na etykiecie.

## 7. Odbiór

1. `npm test`, `npm run lint`, `npm run build`.
2. Podgląd druku w Chrome dla obu formatów: 1, 8 i 9 paczek (9. na drugiej stronie A4), zamówienie z 10 pozycjami, długa nazwa produktu, długa uwaga.
3. Na etykieciarce: jedna etykieta na stronę 75 × 60 mm, nic nie ucięte.
4. Na A4 z liniami i bez linii.
5. Na etykiecie nie ma pełnego e-maila.

Na koniec: zmienione pliki i jedno zdanie, jak przetestować.
