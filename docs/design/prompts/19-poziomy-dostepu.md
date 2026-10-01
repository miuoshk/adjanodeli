# 19 · Poziomy dostępu: podgląd albo pełny

> Uwaga Justyny: „ważne, żebym mogła dać niektórym pracownikom podgląd, a nic do zmiany: plan produkcji, zamówienia, wydruk etykiet, i żeby wydawała”. Prompt 16 dał dostęp do sekcji, ale bez rozróżnienia oglądania i zmieniania. Zakres: poziom dostępu w każdej sekcji i ekran „Zespół”. Bez nowych bibliotek.

## 0. Zanim zaczniesz

1. `git status`: prompt 18 zacommitowany, poza nieśledzonymi `.cursor/`, `Claude outputs/`, `public/img/` czysto.
2. Przeczytaj `lib/admin/staff-access.ts`, `lib/admin/team.ts`, `lib/admin/team-actions.ts`, `lib/auth.ts` (`requireStaffPermission`), `supabase/migrations/0023_staff_permissions.sql`, `app/admin/(panel)/zespol/`.

## 1. Model

Każda sekcja ma poziom **Brak / Podgląd / Pełny**. Pełny obejmuje podgląd.

Migracja `supabase/migrations/0026_staff_access_levels.sql` (sprawdź numer):

- wartości w `profiles.staff_permissions` w formie `sekcja:poziom`, np. `orders:view`, `handover:manage`. Check: sekcje jak dziś, poziomy `view` i `manage`, najwyżej jeden wpis na sekcję;
- obecne wpisy bez poziomu zamień na `:manage`, żeby nikt nie stracił dostępu;
- `has_staff_permission(p_section text, p_level text default 'view')`: owner zawsze `true`; `manage` spełnia też `view`; nieaktywne konto `false`. Usuń starą wersję jednoparametrową dopiero po zmianie wszystkich wywołań.

Migrację wgraj tak jak poprzednie, przez MCP Supabase (`apply_migration`). **Nie używaj `npx supabase db push`**: historia migracji na bazie ma inne numery niż pliki. Potem typy: `npm run db:types`, a jeśli CLI nie jest zalogowane, przez MCP (`generate_typescript_types`).

## 2. Co znaczy podgląd w każdej sekcji

| Sekcja | Podgląd | Pełny dodatkowo |
|---|---|---|
| Dziś | plan dnia, liczby | przyciski kroków, zgodnie z poziomami ich sekcji |
| Zamówienia | lista, szczegóły, historia, maile | zmiana statusu, „Wyślij ponownie” |
| Produkcja | plan, wydruk planu | „Start produkcji dnia” |
| Paczki i etykiety | lista paczek, **wydruk etykiet** | „Jestem na miejscu — powiadom klientów”, „Wyślij ponownie” |
| Wydawanie | szukanie po kodzie i nazwisku, podgląd paczki | „Wydaj” |
| Zamówienia specjalne | lista i szczegóły | zmiana statusu, odpowiedź |

Drukowanie to podgląd, bo niczego w systemie nie zmienia.

## 3. Pilnowanie

- `requireStaffPermission(section, level = 'view')` na stronach; każda akcja serwera, która coś zmienia, wymaga `manage`. Przejrzyj wszystkie akcje w `lib/admin/*.ts` i wypisz w odpowiedzi tabelę: akcja → sekcja → poziom.
- W interfejsie przy podglądzie przyciski zmian są ukryte, a na górze sekcji mała etykieta „Tylko podgląd”. Bez wyszarzonych przycisków, które nic nie robią.
- Menu: sekcja widoczna przy podglądzie i przy pełnym dostępie.

## 4. Ekran „Zespół”

- Uprawnienia jako tabela: wiersz = sekcja, trzy opcje „Brak”, „Podgląd”, „Pełny”. Na telefonie każda sekcja jako osobny blok z trzema przyciskami.
- Na liście pracowników etykiety w formie „Produkcja: podgląd”.
- Zestawy (nadpisują tabelę, potem można ją zmieniać ręcznie):
  - **Podgląd i wydawanie** (prośba Justyny): Dziś podgląd, Zamówienia podgląd, Produkcja podgląd, Paczki i etykiety podgląd, Wydawanie pełny;
  - **Produkcja i pakowanie**: Dziś podgląd, Produkcja pełny, Paczki i etykiety pełny;
  - **Kierowca**: Paczki i etykiety pełny, Wydawanie pełny;
  - **Pełny dostęp pracownika**: wszystko pełny.

## 5. SPEC i Pomoc

- SPEC §2 i §8: poziomy, tabela z kroku 2, nowa sygnatura funkcji.
- `/admin/pomoc`, sekcja „Zespół”: co znaczy podgląd i pełny, jednym zdaniem przy każdym zestawie.

## 6. Odbiór

1. `npm test`, `npm run lint`, `npm run build`. Testy `has_staff_permission` dla `view`, `manage`, braku i nieaktywnego konta.
2. Pracownik z zestawem „Podgląd i wydawanie”: widzi zamówienia, plan i paczki, drukuje plan i etykiety, wydaje paczkę po kodzie. Nie widzi przycisków statusów, startu produkcji ani „Jestem na miejscu”.
3. Wywołanie akcji zmiany statusu przez tego pracownika z pominięciem interfejsu jest odrzucone.
4. Pracownik dodany w prompcie 16 nadal ma pełny dostęp do swoich sekcji.
5. Ekran „Zespół” na 390 px.

Na koniec: zmienione pliki, tabela akcji z kroku 3 i jedno zdanie, jak przetestować.
