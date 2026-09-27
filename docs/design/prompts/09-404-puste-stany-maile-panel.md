# 09 · Strona 404, puste stany, maile, panel i etykiety paczek

> Uruchamiasz **po** 08. Zakres: miejsca, gdzie jeszcze jest stary wygląd albo maskotka Janosz. Logika bez zmian. Bez nowych bibliotek.

## 0. Zanim zaczniesz

1. `git status`: prompt 08 jest zacommitowany i poza nieśledzonymi `.cursor/`, `Claude outputs/`, `public/img/` nie ma żadnych zmian. Inaczej zatrzymaj się i zapytaj.
2. `docs/SPEC.md` §10 ma dwa zdania o maskotce Janosz. Zamień oba na jedno:
   „Maskotki Janosz nie używamy. W pustych stanach i na stronach błędów stoi znak A albo przeplatanka z kremową kartką.”
   To jest zamierzona zmiana SPEC, więc nie zatrzymuj się na tej sprzeczności.
3. Pieczątki (okrągłego znaku z napisem w obręczy) nie używamy nigdzie na stronie, także tutaj.

## 1. Strona 404 — `app/not-found.tsx`

Cała strona na oliwkowej przeplatance, na środku papierowa karta z logo. Tak ma wyglądać: `docs/design/marka/podglad/plansza-1-404.jpg` (404 i strona błędu, komputer i telefon).

```tsx
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="adj-pattern flex min-h-screen items-center justify-center px-5 py-16">
      <div className="adj-framed w-full max-w-[520px] px-7 pt-10 pb-9 text-center lg:px-12 lg:pt-12 lg:pb-11">
        <Link href="/" aria-label="Adjano Deli — strona główna" className="inline-block">
          <Image
            src="/brand/logo/adjano-deli-karmin.svg"
            alt="Adjano Deli"
            width={520}
            height={231}
            className="mx-auto h-auto w-[150px] lg:w-[170px]"
            priority
            unoptimized
          />
        </Link>
        <div className="mt-7 h-px w-full bg-[var(--adj-gold-light)]" aria-hidden />
        <p className="adj-label mt-7 text-[var(--adj-red)]">Błąd 404</p>
        <h1 className="mt-3 font-heading text-[34px] leading-[1.08] font-medium lg:text-[40px]">
          Tej strony nie ma
        </h1>
        <p className="mx-auto mt-3 max-w-[30ch] text-balance text-[17px] leading-relaxed text-[var(--adj-ink-soft)]">
          Sprawdź adres albo wróć do sklepu. Pieczywo, kanapki i&nbsp;ciasta są na swoim miejscu.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <Link href="/sklep" className="adj-btn w-full sm:w-auto">Przejdź do sklepu</Link>
          <Link href="/" className="adj-link">Strona główna</Link>
        </div>
      </div>
    </main>
  );
}
```

## 2. Błąd globalny — `app/error.tsx`

Ten sam układ co 404 (`adj-pattern` + `adj-framed` + logo + złota linia, tekst z `text-balance`). Treść:

- etykieta: `Błąd`
- tytuł: `Coś poszło nie tak`
- tekst: `Odśwież stronę albo wróć za chwilę.`
- przycisk `adj-btn` „Odśwież” (`type="button"`, `onClick={() => location.reload()}`) i link `adj-link` „Przejdź do sklepu”.

`"use client"` zostaje. `app/(shop)/error.tsx` (w środku sklepu, z nagłówkiem i stopką) zostaje jak jest.

## 3. Pusty koszyk — `components/shop/cart-view.tsx`

Zamiast Janosza znak A:

```tsx
<Image src="/brand/logo/znak-A-karmin.svg" alt="" width={512} height={512} className="h-auto w-16" unoptimized />
<p className="mt-6 font-heading text-[32px] font-medium">Koszyk jest pusty</p>
<p className="mt-2 text-[var(--adj-ink-soft)]">Wybierz coś w&nbsp;sklepie, a&nbsp;pojawi się tutaj.</p>
```

Przycisk „Przejdź do sklepu” zostaje.

## 4. Zamówienie — `app/(shop)/zamowienie/[id]/page.tsx`

- Zmień nazwę `showJanosz` na `showPacking` (prop, typ, zmienne). Warunek, kiedy się pokazuje, bez zmian.
- Blok: znak A `w-12` (ten sam plik co wyżej, `alt=""`) i pod nim `text-[15px] text-[var(--adj-ink-soft)]`: `Przygotowujemy Twoje zamówienie.`

## 5. Karta pieczątek — `components/shop/loyalty-section.tsx`

W zdobytym polu zamiast litery „A” pisanej kursywą wstaw plik znaku:

```tsx
<Image src="/brand/logo/znak-A-sam-karmin.svg" alt="" width={185} height={161}
  className={cn("h-auto w-[62%]", index % 2 === 0 ? "rotate-[-8deg]" : "rotate-[6deg]")}
  aria-hidden unoptimized />
```

Reszta karty (obręcz pola, puste pola, opisy progów) bez zmian.

## 6. Maile — `lib/email/templates/*.tsx`

- `shell.tsx`: logo `${appUrl}/brand/email/adjano-deli-karmin@2x.png`, `width="176"`, `height="78"`, `alt="Adjano Deli"`. Gdy `appUrl` jest pusty: tekst `Adjano Deli` (kursywa 26 px w karminie, jak dziś).
- Kolor `red` w szablonach to już `#A6231F` (prompt 08). Sprawdź.
- Etykieta pod logo (`title`) mówi, czego dotyczy mail:
  - `order-paid.tsx`: `Zamówienie opłacone`
  - `order-delivered.tsx`: `Do odbioru`
  - `standing-reminder.tsx`: `Stałe zamówienie`
  - `special-request-owner.tsx`: `Zamówienie specjalne`
  - `manual-refund-owner.tsx`: `Zwrot do wykonania`
- Treść maili, tematy i wysyłka bez zmian.

## 7. Panel — `components/admin/admin-shell.tsx`

Pasek boczny jest oliwkowy, więc w obu miejscach logo w kremie:

```tsx
<Link href="/admin" className="relative mx-4 mt-4 block h-9 w-[132px]">
  <Image src="/brand/logo/adjano-deli-poziomy-krem.svg" alt="Adjano Deli" fill
    className="object-contain object-left" priority unoptimized />
</Link>
```

(W wersji mobilnej bez `priority`.)

## 8. Etykiety paczek — `app/admin/paczki/drukuj`

Na każdej etykiecie kod zostaje największy, a w prawym górnym rogu dochodzi logo w jednym kolorze:

```tsx
<div className="pack-label-head">
  <p className="pack-label-code">{item.pickupCode}</p>
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src="/brand/logo/adjano-deli-tusz.svg" alt="" className="pack-label-logo" />
</div>
```

W `layout.tsx` (style druku):

```css
.pack-label-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8pt; }
.pack-label-logo { width: 26mm; height: auto; }
```

Sprawdź podgląd wydruku: etykieta się nie łamie, kod ma nadal 32 pt.

## 9. Porządek

- `grep -rni "janosz" app components lib docs/SPEC.md` ma zwrócić zero wyników. Potem `git rm public/brand/janosz.png`.
- `grep -rn "adjano-logo.png" app components lib` ma zwrócić zero wyników. Potem `git rm public/brand/adjano-logo.png`.
- Jeśli po 08 zostały `adjano-logo-red.svg` albo `adjano-logo-cream.svg` bez użyć, usuń je.

## 10. Odbiór

1. `npm test`, `npm run lint`, `npm run build`.
2. `/nie-ma-takiej-strony` na 390 i 1440 px: oliwkowa przeplatanka, karta z logo, oba przyciski działają.
3. Pusty koszyk, zamówienie po opłaceniu, konto z pieczątkami (zaloguj się kontem testowym z kilkoma pieczątkami).
4. Wyślij testowo `order-paid` i sprawdź w Gmailu i Apple Mail: logo się wyświetla, etykieta pod logo to „Zamówienie opłacone”.
5. Panel: logo w pasku bocznym na desktopie i w menu mobilnym. Podgląd wydruku etykiet paczek.

Na koniec wypisz zmienione pliki i jedno zdanie, jak przetestować.
