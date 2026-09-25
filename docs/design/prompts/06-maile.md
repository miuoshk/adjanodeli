# 06 · E-maile w tym samym stylu

> Uruchamiasz **po** 05. Zakres: `lib/email/templates/*.tsx`. Treść maili, tematy, dane i wysyłka bez zmian — tylko wygląd. Maile to tabele i style inline (tak jak dziś). Bez nowych bibliotek.

## 0. Zanim zaczniesz

1. Przeczytaj `docs/SPEC.md` §11.
2. `git status` czysty, inaczej zatrzymaj się i zapytaj.
3. W mailach nie ma fontów z Google — zostaje `Georgia, 'Times New Roman', serif` dla tekstu i `'Arial Narrow', Arial, sans-serif` dla etykiet i liczb.

## 1. `shell.tsx`

- Tło zewnętrzne `#F1EADB`, kolumna `max-width: 560px`, w środku biała-kremowa karta `#FBF7EE` z ramką `1px solid #B8975A`.
- Nagłówek karty: zamiast paska khaki z tekstem — logo PNG na kremowym tle:
  - `<img src={`${appUrl}/brand/adjano-logo.png`} width="112" alt="Adjano" style={{ display: "block", border: 0 }} />`, gdzie `appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "")`; gdy `appUrl` puste — tekst `Adjano` w `#C4161C`, `font-style: italic`, `26px`.
  - pod logo cienka podwójna złota linia: dwa `td` wysokości 1 px `#B8975A` z 3 px przerwy (tabela, bo Outlook).
  - `title` z propsów (dziś wszędzie `AdjanoDeli`) wyświetl jako mała etykieta pod linią: `11px`, `letter-spacing: 0.16em`, `text-transform: uppercase`, `#57553E`, font etykiet.
- Treść `padding: 28px 28px 24px`, tekst `17px/1.55 #2B2A1F`.
- Stopka: `13px #57553E`, `border-top: 1px solid rgba(43,42,31,0.18)`: `Piekarnia-Cukiernia Adjano · ul. Katowicka 120, Mikołów` + telefon, jeśli jest (jak dziś).

## 2. `order-paid.tsx` — kod jak bilet

- `Zamówienie #{n} jest opłacone.` — `font-size: 22px`, Georgia.
- Kod w tabeli-bilecie: `border: 1px dashed #C4161C`, `padding: 18px`, `text-align: center`; nad kodem etykieta `KOD ODBIORU` (11 px, font etykiet, `#57553E`), kod `48px`, `font-weight: 700`, `letter-spacing: 0.18em`, `#C4161C`, font etykiet.
- Link `Pokaż QR i szczegóły` jako przycisk: `background #C4161C`, `color #F1EADB`, `padding 14px 22px`, `border-radius 6px`, `text-decoration none`, font etykiet 16 px.
- Punkt / adres / dzień / godziny jako tabela dwóch kolumn (etykieta 13 px `#57553E` | wartość 16 px).
- Pozycje: wiersze z cienką linią `rgba(43,42,31,0.18)`, suma pogrubiona 18 px.
- Linie o pieczątkach / voucherze: pod sumą, w ramce `border-left: 3px solid #C4161C; padding-left: 12px`.

## 3. Pozostałe szablony

- `order-delivered.tsx`: nagłówek `Twoja paczka czeka` (22 px), kod w tym samym bilecie co wyżej, punkt i „do której godziny” w tabeli dwóch kolumn.
- `standing-reminder.tsx`: lista pozycji jak w `order-paid`, przycisk `Zamawiam` w stylu przycisku z pkt 2.
- `special-request-owner.tsx`, `manual-refund-owner.tsx` (do właścicielki): tylko nowy `shell`, bez zmian w treści.

## 4. Odbiór

1. `npm run lint`, `npm run build`.
2. Wyślij testowo `order-paid` i `standing-reminder` (jeśli jest skrypt/endpoint testowy — użyj go; jeśli nie ma, złóż i opłać zamówienie testowe) i sprawdź w Gmailu (web + telefon) i w Apple Mail: logo się wyświetla, kod jest czytelny, przycisk klikalny.

Na koniec wypisz zmienione pliki i jedno zdanie, jak przetestować.
