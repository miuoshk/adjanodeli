# 16 · Zespół: pracownicy i uprawnienia w panelu

> Uwaga Justyny: „chcę dodać do panelu pracownika, żeby widział Zamówienia, Produkcję, Paczki i Wydawanie, i żebyśmy z Adamem nie musieli tego robić z biura”. Dziś rola `staff` istnieje, ale nadaje się ją tylko przez SQL i daje zawsze ten sam dostęp. Zakres: ekran „Zespół” dla właścicielki i uprawnienia do sekcji. Logika zamówień bez zmian. Bez nowych bibliotek.

## 0. Zanim zaczniesz

1. `git status`: prompt 15 zacommitowany, poza nieśledzonymi `.cursor/`, `Claude outputs/`, `public/img/` czysto.
2. Przeczytaj `docs/SPEC.md` §2 i §8, `lib/auth.ts` (`requireRole`), `lib/auth-actions.ts` (`signInAdmin`), `supabase/migrations/0012_admin_login.sql`, `components/admin/admin-nav.tsx`, `lib/supabase/admin.ts`.
3. Wypisz w odpowiedzi (przed zmianami) każdą stronę panelu i każdą akcję serwera z `lib/admin/*.ts` z tym, jaką rolę dziś sprawdza. Na tej liście oprzesz krok 3.

## 1. Model

Migracja `supabase/migrations/0023_staff_permissions.sql` (sprawdź, czy numer jest wolny):

- `profiles.staff_permissions text[] not null default '{}'`, check: każdy element z listy `dashboard`, `orders`, `production`, `packages`, `handover`, `special_requests`;
- dla wszystkich obecnych `staff`: pełna lista, żeby nikt nie stracił dostępu;
- `profiles.is_active boolean not null default true` (wyłączony pracownik nie wchodzi do panelu);
- funkcja `has_staff_permission(p text) returns boolean`: owner zawsze `true`, staff z aktywnym kontem, gdy `p = any(staff_permissions)`.

Role zostają trzy (`customer`, `staff`, `owner`). Owner ma zawsze wszystko. Polityki RLS na danych zostają na `is_staff()`. Uprawnienia do sekcji pilnuje serwer aplikacji: strony i akcje (krok 3).

Potem `npx supabase db push` i `npm run db:types`.

## 2. Sekcje i co otwierają

| Uprawnienie | Nazwa w panelu | Strony | Akcje |
|---|---|---|---|
| `dashboard` | Dziś | `/admin` | podgląd dnia |
| `orders` | Zamówienia | `/admin/zamowienia`, `/admin/zamowienia/[id]` | zmiany statusu dostępne dla staff, ponowne wysłanie maila |
| `production` | Produkcja | `/admin/produkcja`, `/admin/produkcja/drukuj` | „Start produkcji dnia” |
| `packages` | Paczki i etykiety | `/admin/paczki`, `/admin/paczki/drukuj` | „Jestem na miejscu — powiadom klientów”, ponowne wysłanie „paczka czeka” |
| `handover` | Wydawanie | `/admin/wydawanie` | wydanie po kodzie, wyszukiwanie |
| `special_requests` | Zamówienia specjalne | `/admin/zamowienia-specjalne` | zmiana statusu zgłoszenia |

„Pomoc” widzi każdy w panelu. Anulowanie, zwroty, produkty, ustawienia, statystyki i „Zespół” zostają tylko dla owner, jak dziś.

Gotowe zestawy do jednego kliknięcia (tylko skrót, zapisują się pojedyncze uprawnienia):

- **Produkcja i pakowanie** — Dziś, Produkcja, Paczki i etykiety;
- **Kierowca** — Paczki i etykiety, Wydawanie;
- **Pełny dostęp pracownika** — wszystkie sześć.

## 3. Pilnowanie dostępu

- `lib/auth.ts`: `requireStaffPermission(p, next)`. Owner przechodzi zawsze. Staff bez uprawnienia albo z `is_active = false` trafia na nową stronę `/admin/brak-dostepu` („Nie masz dostępu do tej części panelu. Poproś właścicielkę o dodanie uprawnienia.”).
- Każda strona z tabeli i **każda** akcja serwera z tabeli sprawdza swoje uprawnienie. Ukrycie linku w menu to za mało.
- `admin-nav.tsx`: pokazuje tylko sekcje, do których użytkownik ma dostęp.
- Po zalogowaniu (`signInAdmin`) i przy wejściu na `/admin` bez uprawnienia `dashboard`: przekierowanie do pierwszej dozwolonej sekcji z kolejności tabeli.
- `admin_login_email`: nieaktywny pracownik nie może się zalogować (ten sam komunikat co przy złym haśle).
- „Dziś” (plan dnia z promptu 12): kroki, do których ktoś nie ma dostępu, pokazuje bez przycisków.

## 4. Ekran „Zespół” — `/admin/zespol` (tylko owner)

Link „Zespół” w menu obok „Ustawienia”.

**Lista:** imię i nazwisko, login (e-mail), uprawnienia jako etykiety, „Aktywny” / „Wyłączony”, ostatnie logowanie (`auth.users.last_sign_in_at`, przez klienta serwisowego).

**„Dodaj pracownika”:**

- imię i nazwisko, e-mail (to login do panelu), uprawnienia (zestawy + pojedyncze pola);
- hasło tymczasowe: przycisk „Wygeneruj” (12 znaków, bez mylących znaków `0 O l 1 I`) i przycisk „Kopiuj”. Hasło widać tylko raz, na ekranie po zapisaniu, z tekstem: „Przekaż je pracownikowi osobiście albo telefonicznie. Przy pierwszym logowaniu poprosimy o zmianę.”;
- zapis przez klienta serwisowego: `auth.admin.createUser({ email, password, email_confirm: true })`, potem `profiles`: `role = 'staff'`, `full_name`, `staff_permissions`, `is_active = true`, `must_change_password = true` (dodaj tę kolumnę w migracji);
- e-mail, który ma już konto klienta: komunikat „Ten adres ma już konto w sklepie. Nadać mu dostęp do panelu?” → po potwierdzeniu ustaw hasło (`auth.admin.updateUserById`) i rolę `staff`.

**Edycja pracownika:** zmiana uprawnień, „Ustaw nowe hasło” (to samo okno z generatorem), „Wyłącz dostęp” / „Włącz dostęp”. Wyłączenie działa od następnego kliknięcia pracownika, bo rola i `is_active` są sprawdzane przy każdym żądaniu.

**Współwłaściciel:** przy dodawaniu i edycji pole „Pełny dostęp właściciela” (rola `owner`) z potwierdzeniem „Ta osoba zobaczy i zmieni wszystko, także ustawienia i zespół.” Owner nie może odebrać roli sam sobie ani wyłączyć ostatniego aktywnego ownera.

## 5. Zmiana hasła przez pracownika

`/admin/konto`: „Zmień hasło” dla każdego w panelu (obecne hasło nie jest potrzebne, sesja wystarczy; nowe min. 10 znaków, dwa razy). Gdy `must_change_password = true`, po zalogowaniu panel przekierowuje tu i nie puszcza dalej, dopóki hasło nie zostanie zmienione.

## 6. Ślad w historii

Imię i nazwisko z `profiles.full_name` pojawia się już w historii zamówienia jako wykonawca zmiany (`actorName`). Sprawdź, że dla nowego pracownika widać jego imię, a nie „pracownik”.

## 7. SPEC, Pomoc

- SPEC §2: uprawnienia sekcji, zestawy, ekran Zespół, zmiana hasła, wyłączanie. Usuń zdanie „Zmiana roli tylko przez SQL”.
- SPEC §8: `has_staff_permission` i zasada, że strony i akcje sprawdzają uprawnienie.
- `/admin/pomoc`: nowa sekcja „Zespół: jak dodać pracownika” (dla owner) i zdanie dla pracownika, co zrobić przy pierwszym logowaniu.

## 8. Odbiór

1. `npm test`, `npm run lint`, `npm run build`. Testy jednostkowe `has_staff_permission` (owner, staff z uprawnieniem, bez, nieaktywny) w `supabase/tests`.
2. Owner dodaje pracownika z zestawem „Produkcja i pakowanie”. Pracownik loguje się, musi zmienić hasło, widzi tylko Dziś, Produkcję, Paczki i Pomoc.
3. Pracownik wpisuje ręcznie `/admin/wydawanie` i `/admin/zamowienia`: strona „Nie masz dostępu”. Wywołanie akcji wydania z pominięciem strony też jest odrzucone.
4. Owner dodaje „Wydawanie”: po odświeżeniu pracownik je widzi.
5. „Wyłącz dostęp”: następne kliknięcie pracownika kończy się stroną logowania, logowanie nie działa.
6. Wszystko na telefonie 390 px.

Na koniec: zmienione pliki, lista stron i akcji z przypisanym uprawnieniem (tabela) i jedno zdanie, jak przetestować.
