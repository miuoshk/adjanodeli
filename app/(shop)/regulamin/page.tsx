import { SectionHeading } from "@/components/brand/section-heading";

// Treść regulaminu wymaga weryfikacji przez prawnika przed startem sklepu.

export default function TermsPage() {
  return (
    <article className="max-w-[68ch] text-[17px] leading-[1.7]">
      <SectionHeading as="h1" eyebrow="Informacje" title="Regulamin sklepu Adjano Deli" />
      <p className="mt-4">Data wejścia w życie: [[DATA WEJŚCIA W ŻYCIE]]</p>

      <section className="space-y-2">
        <h2 className="mt-12 font-heading text-[26px] font-medium">Sprzedawca</h2>
        <p>
          Sprzedawcą jest [[NAZWA FIRMY]], NIP [[NIP]], adres: [[ADRES]]. Kontakt: [[E-MAIL]],
          tel. [[TELEFON]].
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="mt-12 font-heading text-[26px] font-medium">Składanie zamówień</h2>
        <p>
          Zamówienia składasz przez stronę Adjano Deli. Wybierasz dzień odbioru, punkt i produkty.
          Zamówienia na dany dzień przyjmujemy do godziny cutoff z ustawień sklepu (domyślnie
          20:00 czasu Europe/Warsaw) dnia poprzedniego. Dostępne są tylko dni i punkty, które
          sklep aktualnie obsługuje.
        </p>
        <p>
          Po opłaceniu dostajesz kod odbioru. Tym kodem potwierdzasz odbiór w wybranym punkcie.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="mt-12 font-heading text-[26px] font-medium">Płatność</h2>
        <p>
          Płatność jest z góry, online przez Stripe. Dostępne metody: BLIK, karta, Apple Pay i Google Pay.
          Zamówienie nieopłacone w czasie sesji płatności wygasa i nie jest realizowane.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="mt-12 font-heading text-[26px] font-medium">Odbiór</h2>
        <p>
          Paczkę odbierasz osobiście w wybranym punkcie, w oknie godzinowym tego punktu, za
          okazaniem kodu. Jeśli nie odbierzesz zamówienia w tym oknie, zamówienie przepada bez
          zwrotu — to produkty spożywcze, przygotowane na konkretny dzień.
        </p>
      </section>

      <section className="space-y-2">
        {/*
          Brak prawa odstąpienia: sformułowane ostrożnie na podstawie art. 38 pkt 4
          ustawy o prawach konsumenta (żywność łatwo psująca się).
          Wymaga weryfikacji przez prawnika.
        */}
        <h2 className="mt-12 font-heading text-[26px] font-medium">Odstąpienie od umowy</h2>
        <p>
          Produkty Adjano Deli to żywność przygotowywana na wskazany dzień odbioru, łatwo
          psująca się i o krótkim terminie przydatności. Z tego względu — zgodnie z art. 38
          pkt 4 ustawy o prawach konsumenta — prawo odstąpienia od umowy zawartej na odległość
          nie przysługuje. Jeśli coś jest nie tak z zamówieniem, napisz: rozpatrzymy sprawę
          indywidualnie (patrz reklamacje).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="mt-12 font-heading text-[26px] font-medium">Reklamacje</h2>
        <p>
          Reklamację złóż e-mailem na [[E-MAIL]] w ciągu 14 dni od odbioru albo od dnia, w
          którym zamówienie miało być odebrane. Opisz, o które zamówienie chodzi i co było
          nie tak. Odpowiemy w ciągu 14 dni.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="mt-12 font-heading text-[26px] font-medium">Alergeny</h2>
        <p>
          Informacja o alergenach jest przy każdym produkcie w menu. Jeśli masz wątpliwości,
          zadzwoń przed zamówieniem: [[TELEFON]].
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="mt-12 font-heading text-[26px] font-medium">Dane osobowe</h2>
        <p>
          Zasady przetwarzania danych osobowych są w{" "}
          <a href="/polityka-prywatnosci" className="underline underline-offset-4">
            polityce prywatności
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="mt-12 font-heading text-[26px] font-medium">Zmiany regulaminu</h2>
        <p>
          Możemy zmienić regulamin, gdy zmieni się prawo albo sposób działania sklepu. Nowa
          treść obowiązuje od daty podanej na górze tej strony. Do zamówień złożonych wcześniej
          stosuje się regulamin z chwili złożenia zamówienia.
        </p>
      </section>
    </article>
  );
}
