# 21 · Panel na telefonie

> Uwaga Justyny z 5.10: „na telefonie ani ja, ani pracownica nie widzimy zakładki Panel”. Przyczyna jest znana: w `components/shop/site-header.tsx` link „Panel” ma `hidden … sm:flex`, czyli znika poniżej 640 px, a `components/shop/mobile-shop-menu.tsx` go nie ma. Zakres: wejście do panelu na telefonie. Bez nowych bibliotek.

## 0. Zanim zaczniesz

1. `git status`: poza nieśledzonymi `.cursor/settings.json`, `Claude outputs/`, `public/img/` dozwolone są nowe i zmienione pliki w `docs/design/prompts/` oraz zmiana w `.cursor/rules/adjano.mdc` (nowe zasady o migracjach i błędach). Wejdą do commita tego promptu. Cokolwiek innego: zatrzymaj się i zapytaj.
2. Przeczytaj `components/shop/site-header.tsx`, `components/shop/mobile-shop-menu.tsx`, `app/(shop)/konto/page.tsx`, `app/manifest.ts`, `app/(shop)/logowanie/page.tsx`.

## 1. Menu na telefonie

- `MobileShopMenu` dostaje `showPanel` (staff i owner, ta sama reguła co `isStaff` w nagłówku).
- Gdy `showPanel`: pierwsza pozycja menu „Panel piekarni”, wyróżniona (karminowy tekst albo cienka ramka), oddzielona linią od reszty.
- Pracownik z ograniczonymi uprawnieniami (prompty 16 i 19) trafia po kliknięciu do pierwszej sekcji, do której ma dostęp. To już robi `/admin`, sprawdź tylko, że działa z telefonu.

## 2. Konto

`/konto` dla staff i owner: na samej górze karta „Panel piekarni” z przyciskiem „Przejdź do panelu”. Klienci jej nie widzą.

## 3. Logowanie pracownika

Na dole `/logowanie` mały link „Logowanie dla pracowników piekarni” do `/admin/logowanie`. Pracownik bez konta klienta nie musi wtedy znać adresu panelu.

## 4. Ikona na ekranie telefonu

Panel dostaje własny manifest, żeby „Dodaj do ekranu głównego” otwierało panel, a nie sklep:

- plik `public/admin.webmanifest` (albo route handler) z `name: "Adjano Deli — panel"`, `short_name: "Panel"`, `start_url: "/admin"`, `scope: "/admin"`, `display: "standalone"`, kolory i ikony jak w `app/manifest.ts`;
- w layoucie panelu `metadata.manifest` wskazuje na ten plik, `appleWebApp.title` = „Panel”;
- sprawdź w podglądzie strony, że na `/admin` w `<head>` jest tylko ten manifest, a w sklepie tylko sklepowy;
- plik ma się otwierać bez logowania (sprawdź matcher w `middleware.ts`, telefon pobiera manifest bez sesji).

W `/admin/pomoc` dopisz dwa zdania: „Na telefonie otwórz panel w przeglądarce i wybierz Udostępnij → Do ekranu początkowego (iPhone) albo Menu → Dodaj do ekranu głównego (Android). Na ekranie pojawi się ikona „Panel”, która otwiera panel od razu.”

## 5. Historia migracji

Tabela „Historia migracji” w `docs/design/prompts/00-KOLEJNOSC.md` kończy się na `0025`. Przez MCP Supabase (tylko odczyt `supabase_migrations.schema_migrations`) znajdź wpisy dla `0026_staff_access_levels` i `0027_require_point_code`, dopisz je do tabeli i dodaj ich wersje do komend `migration repair` w tej sekcji. Niczego na bazie nie zmieniaj.

## 6. Odbiór

1. `npm run lint`, `npm run build`.
2. Na 390 px jako owner: menu ma „Panel piekarni” na górze, `/konto` ma kartę panelu.
3. Na 390 px jako pracownik z zestawem „Podgląd i wydawanie”: link prowadzi do pierwszej dozwolonej sekcji.
4. Na 390 px jako klient: żadnego śladu panelu.
5. `/logowanie` ma link dla pracowników.
6. Na iPhonie i Androidzie „Do ekranu początkowego” z `/admin` daje ikonę „Panel”, która otwiera panel (po zalogowaniu).

Na koniec: zmienione pliki i jedno zdanie, jak przetestować.
