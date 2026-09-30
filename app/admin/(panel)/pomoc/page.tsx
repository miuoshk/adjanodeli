import Link from "next/link";

import { PrintButton } from "@/components/admin/print-button";
import { formatCutoff } from "@/lib/dates";
import { createServerClient } from "@/lib/supabase/server";

const TOC = [
  { href: "#dzien", label: "Jak wygląda dzień" },
  { href: "#wieczor", label: "Wieczorem" },
  { href: "#produkcja", label: "Rano: produkcja" },
  { href: "#etykiety", label: "Etykiety i pakowanie" },
  { href: "#punkt", label: "W punkcie: jesteśmy" },
  { href: "#wydawanie", label: "Wydawanie" },
  { href: "#po-odbiorach", label: "Po odbiorach" },
  { href: "#mail", label: "Nie dostałam maila" },
  { href: "#anulowanie", label: "Anulowanie i zwrot" },
  { href: "#wygasle", label: "Zapłaciła za wygasłe" },
  { href: "#specjalne", label: "Zamówienia specjalne" },
  { href: "#zespol", label: "Zespół" },
  { href: "#zgloszenie", label: "Gdy coś nie działa" },
] as const;

export default async function HelpPage() {
  const supabase = await createServerClient();
  const { data } = await supabase.from("settings").select("cutoff_time").eq("id", 1).maybeSingle();
  const cutoff = formatCutoff(data?.cutoff_time ?? "20:00");

  return (
    <article className="help-sheet max-w-3xl space-y-8 text-base leading-relaxed">
      <header className="space-y-3">
        <h1 className="font-heading text-3xl font-semibold leading-tight">Instrukcja</h1>
        <p>Zamówienia i odbiory. Kroki są takie, jak przyciski w panelu.</p>
        <div className="no-print flex flex-col gap-2 sm:flex-row sm:items-center">
          <PrintButton label="Drukuj instrukcję" />
          <Link
            href="/admin/pomoc/trasa"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-[var(--adj-cream-dark)] bg-card px-4"
          >
            Ściąga na trasę
          </Link>
        </div>
      </header>

      <nav aria-label="Spis treści" className="rounded-xl border border-[var(--adj-cream-dark)] bg-card px-4 py-4">
        <p className="font-medium">Spis</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {TOC.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="underline-offset-4 hover:underline">
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section id="dzien" className="help-section space-y-3">
        <h2 className="font-heading text-2xl font-semibold">Jak wygląda dzień</h2>
        <ol className="list-decimal pl-5">
          <li>Wieczorem zamykają się zamówienia na następny dzień.</li>
          <li>Rano odpalasz produkcję i pieczesz według listy.</li>
          <li>Drukujesz etykiety i pakujesz.</li>
          <li>W punkcie dajesz znać, że paczki są na miejscu.</li>
          <li>Wydajesz po kodzie, który podaje klient.</li>
          <li>Po odbiorach zostają tylko paczki, których nikt nie wziął.</li>
        </ol>
      </section>

      <section id="wieczor" className="help-section space-y-3">
        <h2 className="font-heading text-2xl font-semibold">Wieczorem</h2>
        <ol className="list-decimal pl-5">
          <li>
            Zamówienia na następny dzień przyjmujesz do {cutoff}. Tę godzinę zmieniasz w{" "}
            <strong>Ustawienia</strong>, pole „Cutoff”, potem „Zapisz ustawienia”.
          </li>
          <li>Po tej godzinie sklep nie przyjmuje już zamówień na jutro. Opłacone zostają opłacone. Nikt nie dostaje maila.</li>
          <li>
            Ile czego upiec: <strong>Dziś</strong> → „Jutro” → w kroku „Produkcja” link „Lista do pieczenia”.
            Albo od razu <strong>Produkcja</strong> i „Jutro”. W tabeli jest produkt i kolumna „Razem”.
          </li>
        </ol>
      </section>

      <section id="produkcja" className="help-section space-y-3">
        <h2 className="font-heading text-2xl font-semibold">Rano: produkcja</h2>
        <ol className="list-decimal pl-5">
          <li>
            Wejdź w <strong>Dziś</strong>. W kroku „Produkcja” kliknij „Rozpocznij produkcję”.
          </li>
          <li>W oknie „Start produkcji” potwierdź „Start”. „Anuluj” zamyka okno i nic nie rusza.</li>
          <li>Zamówienia „Opłacone” przechodzą na „W produkcji”. Klient nie dostaje maila.</li>
          <li>
            To samo jest niżej, w sekcji <strong>Szybkie akcje</strong>, pod nazwą „Start produkcji dnia”.
          </li>
          <li>
            Listę do pieca otwierasz w <strong>Produkcja</strong>. „Drukuj” daje kartkę z ilościami i uwagami.
            Samo otwarcie listy nikomu nie pisze.
          </li>
        </ol>
      </section>

      <section id="etykiety" className="help-section space-y-3">
        <h2 className="font-heading text-2xl font-semibold">Etykiety i pakowanie</h2>
        <ol className="list-decimal pl-5">
          <li>
            Z <strong>Dziś</strong>, krok „Etykiety”, albo z <strong>Paczki</strong>: „Etykiety: etykieciarka”
            albo „Etykiety: A4”. Na górze <strong>Paczki</strong> są etykiety wszystkich punktów, przy punkcie
            tylko jego.
          </li>
          <li>Na etykieciarce wybierz „Etykieciarka 7,5 × 6 cm” i „Drukuj na etykieciarce”. Jedna etykieta na kartkę.</li>
          <li>Na zwykłej drukarce: „A4 (8 na stronie)” i „Drukuj na A4”. Osiem etykiet na kartce. „Linie cięcia” są włączone. Kliknij je jeszcze raz, gdy chcesz je wyłączyć.</li>
          <li>W oknie druku: skala 100%, marginesy: brak, bez nagłówków i stopek. Na etykieciarce rozmiar papieru 7,5 × 6 cm.</li>
          <li>
            Na etykiecie jest kod odbioru, skrócone imię i nazwisko (dwie pierwsze litery, reszta gwiazdki),
            punkt i dzień, produkty jak „2× Chleb żytni”, ewentualnie uwaga, na dole numer zamówienia.
            Ile danych klienta widać, ustawiasz w <strong>Ustawienia</strong>, karta „Etykiety”: skrócone imię i
            nazwisko, to samo ze skróconym e-mailem, albo pełne dane. Druk nikomu nie pisze.
          </li>
        </ol>
      </section>

      <section id="punkt" className="help-section space-y-3">
        <h2 className="font-heading text-2xl font-semibold">W punkcie: „jesteśmy”</h2>
        <ol className="list-decimal pl-5">
          <li>
            Kliknij, gdy paczki są już w tym punkcie. <strong>Paczki</strong> → dzień → nazwa punktu →
            „Jestem na miejscu — powiadom klientów”.
          </li>
          <li>W oknie „Jestem na miejscu” przeczytaj, ilu klientów dostanie maila i do której godziny. Potem „Powiadom”.</li>
          <li>
            Jeśli rano nikt nie kliknął startu, w oknie jest zdanie, że część nie miała rozpoczętej produkcji
            i oznaczysz je przy okazji. Te paczki też przechodzą na „Do odbioru” i klient dostaje maila.
          </li>
          <li>
            Klient dostaje mail „Twoja paczka czeka” z dużym kodem, punktem, adresem i zdaniem „Pokaż ten kod przy odbiorze.”
          </li>
          <li>Drugi raz tego samego dnia tego maila nie wyślesz. Okno powie „Kolejnego maila nie wyślę.” i zostanie „Zamknij”.</li>
          <li>
            Gdy mail przy kimś nie wyszedł, przy kodzie jest „Wyślij ponownie”. Na liście{" "}
            <strong>Zamówienia</strong> pod takim zamówieniem widać „Mail nie doszedł”.
          </li>
        </ol>
      </section>

      <section id="wydawanie" className="help-section space-y-3">
        <h2 className="font-heading text-2xl font-semibold">Wydawanie</h2>
        <ol className="list-decimal pl-5">
          <li>
            <strong>Wydawanie</strong>. Dzień to dziś. Punkt to ten, przy którym ostatnio kliknęłaś „Powiadom”.
            Możesz go zmienić na liście „Punkt odbioru”.
          </li>
          <li>Klient podaje kod. Wpisz go w „Kod odbioru”. Cztery znaki, wielkie litery same się ustawią.</li>
          <li>Gdy paczka jest „Do odbioru”, kliknij „Wydano”. Na górze pojawi się „Wydano ·” i imię. Pole kodu jest znowu puste, na następnego.</li>
          <li>Nad listą „Do wydania w tym punkcie” jest licznik „Wydane X z Y”. Z listy też wydajesz przyciskiem „Wydano”. Klient nie dostaje maila.</li>
          <li>
            Nie ma kodu: zobaczysz „Nie ma takiego kodu na dziś. Sprawdź dzień lub poproś o numer zamówienia.”
            Wpisz numer albo nazwisko i kliknij „Szukaj”. Numer znajdzie zamówienie także z innego dnia. Nazwisko tylko z wybranego dnia.
          </li>
          <li>
            Kod z innego dnia: zmień dzień na górze („Dziś”, „Jutro” albo „Wybierz datę”) i wpisz kod jeszcze raz.
            Albo szukaj po numerze.
          </li>
          <li>
            Kod z innego punktu: żółte zdanie „To zamówienie jest na …” i nazwa punktu. Możesz wydać albo przełączyć punkt.
          </li>
          <li>Już wydane: „Już odebrane” i godzina. Drugi raz nie wydasz.</li>
          <li>
            Paczka jeszcze nie jest „Do odbioru”: „Paczka nie jest jeszcze oznaczona jako dowieziona” i „Mimo to wydaj”.
            To oznacza ją jako „Odebrane” od razu. Klient nie dostaje wtedy maila, że paczka czeka.
          </li>
        </ol>
      </section>

      <section id="po-odbiorach" className="help-section space-y-3">
        <h2 className="font-heading text-2xl font-semibold">Po odbiorach</h2>
        <ol className="list-decimal pl-5">
          <li>Paczka, której nikt nie odebrał, zostaje „Do odbioru”. Program sam jej nie zdejmuje i nikomu nie pisze.</li>
          <li>Zadzwoń do klienta. Paczkę zabierz z powrotem do piekarni.</li>
          <li>
            Gdy ją jednak wydajesz, zrób to na <strong>Wydawanie</strong> przyciskiem „Wydano”.
            Gdy rezygnuje, anuluj zamówienie tak, jak w punkcie o anulowaniu.
          </li>
        </ol>
      </section>

      <section id="mail" className="help-section space-y-3">
        <h2 className="font-heading text-2xl font-semibold">„Nie dostałam maila”</h2>
        <ol className="list-decimal pl-5">
          <li>
            <strong>Zamówienia</strong> → numer zamówienia, na przykład #10.
          </li>
          <li>Kod odbioru jest duży na tej stronie, także gdy mail nie doszedł. Możesz go podać przez telefon.</li>
          <li>Niżej jest sekcja „Maile”. Przy każdej wysyłce widać „Wysłany”, „Nie doszedł” albo „Pominięty”.</li>
          <li>
            „Wyślij ponownie potwierdzenie” idzie, gdy zamówienie jest „Opłacone”, „W produkcji” albo „Do odbioru”.
            Klient dostaje jeszcze raz mail z kodem, punktem, godzinami i listą produktów.
          </li>
          <li>
            „Wyślij ponownie „paczka czeka”” jest tylko przy „Do odbioru”. Klient dostaje jeszcze raz mail, że paczka czeka, z kodem i adresem punktu.
          </li>
        </ol>
      </section>

      <section id="anulowanie" className="help-section space-y-3">
        <h2 className="font-heading text-2xl font-semibold">Anulowanie i zwrot</h2>
        <ol className="list-decimal pl-5">
          <li>
            Klientka sama anuluje tylko „Opłacone”, do godziny {cutoff} w dniu przed odbiorem.
            Włącznik jest w <strong>Ustawienia</strong>: „Klient może anulować do cutoff dnia przed odbiorem”.
            Na swoim zamówieniu klika „Anuluj zamówienie”. Pieniądze wracają na konto, z którego płaciła.
            Osobnego maila o anulowaniu nie dostaje. Na stronie zamówienia widzi „Zamówienie anulowane”.
          </li>
          <li>
            Ty anulujesz „Opłacone” i „W produkcji”. Wejdź w zamówienie, sekcja „Akcje”, „Anuluj”.
            W oknie „Anulować zamówienie?” wpisz „Powód” i kliknij „Anuluj zamówienie”. Pracownik tego przycisku nie ma.
          </li>
          <li>
            Przy Twoim anulowaniu zwrot nie robi się sam. W oknie jest: „Zwrot środków zrób w Stripe, potem oznacz jako zwrócone.”
            Na stronie zamówienia jest link „Płatność w Stripe”. Po zwrocie kliknij „Oznacz jako zwrócone”.
            Zamówienie będzie „Zwrócone”. Klientka nie dostaje o tym maila.
          </li>
          <li>
            Gdy automatyczny zwrot się nie uda, dostajesz mail „Zwrot ręczny wymagany” i numer zamówienia.
            W „Mailach” tego zamówienia widać „Zwrot ręczny”. Zrób zwrot w Stripe i kliknij „Oznacz jako zwrócone”.
          </li>
        </ol>
      </section>

      <section id="wygasle" className="help-section space-y-3">
        <h2 className="font-heading text-2xl font-semibold">Klient zapłacił za wygasłe zamówienie</h2>
        <ol className="list-decimal pl-5">
          <li>
            Dostajesz mail „Klient zapłacił za wygasłe zamówienie” i numer. W panelu, na górze tego zamówienia,
            jest zdanie: „Klient zapłacił, ale zamówienie już wygasło. Zrób zwrot w Stripe albo zadzwoń.”
            Zamówienie zostaje „Wygasło”. Nie idzie do pieca.
          </li>
          <li>
            Klient widzi „Płatność doszła po czasie. Skontaktujemy się z Tobą” i telefon z ustawień.
            Zadzwoń albo zrób zwrot w Stripe.
          </li>
        </ol>
      </section>

      <section id="specjalne" className="help-section space-y-3">
        <h2 className="font-heading text-2xl font-semibold">Zamówienia specjalne</h2>
        <ol className="list-decimal pl-5">
          <li>
            Nowe zapytanie przychodzi mailem „Nowe zamówienie specjalne”: imię, telefon, e-mail i treść.
          </li>
          <li>
            W panelu: <strong>Zamówienia specjalne</strong>. Przy zapytaniu jest lista: „Nowe”, „Skontaktowane”, „Zamknięte”.
          </li>
          <li>Odpowiadasz telefonem albo mailem z karty. Z panelu wiadomości do klienta nie wyślesz.</li>
        </ol>
      </section>

      <section id="zespol" className="help-section space-y-3">
        <h2 className="font-heading text-2xl font-semibold">Zespół: jak dodać pracownika</h2>
        <p>
          Przy pierwszym logowaniu panel prosi o zmianę hasła. Ustaw je, dopiero potem wejdziesz dalej.
        </p>
        <ol className="list-decimal pl-5">
          <li>
            Wejdź w <strong>Zespół</strong> (obok Ustawień). To widzisz tylko Ty.
          </li>
          <li>
            <strong>Dodaj pracownika</strong>: imię i nazwisko, e-mail (to login) i uprawnienia. Zestaw „Produkcja i pakowanie” daje Dziś, Produkcję i Paczki. „Kierowca” daje Paczki i Wydawanie.
          </li>
          <li>
            <strong>Wygeneruj</strong> hasło, <strong>Kopiuj</strong> i przekaż je osobiście albo telefonicznie. Na ekranie widać je tylko raz.
          </li>
          <li>
            Żeby dołożyć sekcję, zapisz uprawnienia jeszcze raz. Pracownik zobaczy ją po odświeżeniu.
          </li>
          <li>
            <strong>Wyłącz dostęp</strong>, gdy ktoś odchodzi. Następne kliknięcie wyrzuca go na logowanie, a stare hasło już nie działa.
          </li>
          <li>
            „Pełny dostęp właściciela” znaczy, że ta osoba zobaczy i zmieni wszystko, także ustawienia i zespół. Zostaw to Adamowi albo sobie.
          </li>
        </ol>
      </section>

      <section id="zgloszenie" className="help-section space-y-3">
        <h2 className="font-heading text-2xl font-semibold">Gdy coś nie działa</h2>
        <p>Napisz do Miłosza od razu, z tym, co da się sprawdzić:</p>
        <ol className="list-decimal pl-5">
          <li>Co robiłaś, krok po kroku.</li>
          <li>Który ekran: <strong>Dziś</strong>, <strong>Paczki</strong>, <strong>Wydawanie</strong> albo inny.</li>
          <li>Telefon czy komputer.</li>
          <li>Godzina.</li>
          <li>Numer zamówienia, jeśli go masz.</li>
          <li>Zrzut ekranu.</li>
        </ol>
      </section>
    </article>
  );
}
