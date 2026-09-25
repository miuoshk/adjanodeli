# 07 · Dane produktów — do przejrzenia z Justyną

To nie jest prompt do Cursora, tylko lista rzeczy w bazie, które psują wrażenie premium w sklepie. Kod ich nie naprawi: to treści, które widzi klient.

## Co robi `07-dane-produktow.sql`

- Nazwy produktów z wielką literą i bez literówek: „chleb prawdziwe żytni” → „Chleb żytni”, „bułka zwykła przenna” → „Bułka pszenna”, „z maliami” → „z malinami”, „kubek tiramisu” → „Tiramisu” (słowo „kubek” jest już w nazwie kategorii).
- Literówki w opisach: „serem mascarpone” → „ser mascarpone”, „własna recepturę” → „własną recepturę”, „maki” → „mąki”, „0,5kg” → „0,5 kg”.
- Adresy kategorii: `/sklep/ds` → `/sklep/chleby`, `/sklep/04` → `/sklep/slodkosci`.
- Alergenów, cen, stanów i zdjęć nie rusza.

Uruchom dopiero po akceptacji Justyny, w Supabase → SQL Editor. Całość idzie w jednej transakcji.

## Do decyzji Justyny (SQL tego nie zmienia)

- **Opis „Keto brownie tiramisu” jest skopiowany z sernika** (maliny, galaretka bez cukru). Trzeba wpisać prawdziwy skład.
- **„Keto murzynek”** — część piekarni zmieniła nazwę na „ciasto czekoladowe”. W SQL zostaje „Keto murzynek”, a decyzja należy do niej.
- **„Chleb żytni”** ma w opisie dodatek pszenicy. Jeśli to chleb żytnio-pszenny, lepiej tak go nazwać.
- **„Chleb pszenno-żytni”** zastępuje „chleb zwykły”, bo „zwykły” obniża cenę w głowie klienta. Opis mówi „pszenno-żytni”.
- **Alergeny do przeglądu** (to kwestia prawna, rozporządzenie UE 1169/2011):
  - Owsianka ma wpisane „Pszenica” i „jaja”, a opis ich nie wymienia (może chodzić o możliwą obecność — wtedy lepiej tak to opisać).
  - „Mąka migdałowa” i „Migdały” to w rozporządzeniu „orzechy”. Warto trzymać jedną nazwę.
  - Wielkość liter jest pomieszana („mleko” / „Pszenica” / „Laktoza”). Słownik alergenów w panelu (Słowniki → Alergeny) pozwala to ujednolicić w jednym miejscu.
- **Keto bułek nie ma w menu.** „Keto & Fit” to dziś sernik, brownie, murzynek, ciasto orzechowe i owsianka. Jeśli bułki keto mają być flagowym produktem, trzeba je dodać.

## Opis produktu keto, który sprzedaje (szablon dla Justyny)

Dla każdego produktu keto wpisz w opisie, w tej kolejności:

```
{Jedno zdanie, co to jest i czym smakuje.}
Skład: {pełna lista}.
Słodzik: {np. erytrytol}.
Porcja {waga} g: {kcal} kcal, węglowodany netto {x} g, białko {x} g, tłuszcz {x} g.
```

Liczby muszą pochodzić z receptury lub wyliczenia Justyny. Nie zgadujemy ich. Nowa linia w opisie (Enter) wyświetli się w sklepie jako osobny wiersz.
