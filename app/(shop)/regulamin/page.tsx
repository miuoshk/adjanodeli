// Treść regulaminu wymaga weryfikacji przez prawnika przed startem sklepu.

export default function TermsPage() {
  return (
    <article className="space-y-8 leading-relaxed">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold">Regulamin sklepu AdjanoDeli</h1>
        <p className="text-sm text-muted-foreground">
          Data wejścia w życie: [[DATA WEJŚCIA W ŻYCIE]]
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">Sprzedawca</h2>
        <p>
          Sprzedawcą jest [[NAZWA FIRMY]], NIP [[NIP]], adres: [[ADRES]]. Kontakt: [[E-MAIL]],
          tel. [[TELEFON]].
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">Składanie zamówień</h2>
        <p>
          Zamówienia składasz przez stronę AdjanoDeli. Wybierasz dzień odbioru, punkt i produkty.
          Zamówienia na dany dzień przyjmujemy do godziny cutoff z ustawień sklepu (domyślnie
          20:00 czasu Europe/Warsaw) dnia poprzedniego. Dostępne są tylko dni i punkty, które
          sklep aktualnie obsługuje.
        </p>
        <p>
          Po opłaceniu dostajesz kod odbioru. Tym kodem potwierdzasz odbiór w wybranym punkcie.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">Płatność</h2>
        <p>
          Płatność jest z góry, online przez Stripe. Dostępne metody: BLIK, Przelewy24 i karta.
          Zamówienie nieopłacone w czasie sesji płatności wygasa i nie jest realizowane.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">Odbiór</h2>
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
        <h2 className="font-heading text-2xl font-semibold">Odstąpienie od umowy</h2>
        <p>
          Produkty AdjanoDeli to żywność przygotowywana na wskazany dzień odbioru, łatwo
          psująca się i o krótkim terminie przydatności. Z tego względu — zgodnie z art. 38
          pkt 4 ustawy o prawach konsumenta — prawo odstąpienia od umowy zawartej na odległość
          nie przysługuje. Jeśli coś jest nie tak z zamówieniem, napisz: rozpatrzymy sprawę
          indywidualnie (patrz reklamacje).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">Reklamacje</h2>
        <p>
          Reklamację złóż e-mailem na [[E-MAIL]] w ciągu 14 dni od odbioru albo od dnia, w
          którym zamówienie miało być odebrane. Opisz, o które zamówienie chodzi i co było
          nie tak. Odpowiemy w ciągu 14 dni.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">Alergeny</h2>
        <p>
          Informacja o alergenach jest przy każdym produkcie w menu. Jeśli masz wątpliwości,
          zadzwoń przed zamówieniem: [[TELEFON]].
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">Dane osobowe</h2>
        <p>
          Zasady przetwarzania danych osobowych są w{" "}
          <a href="/polityka-prywatnosci" className="underline underline-offset-4">
            polityce prywatności
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">Zmiany regulaminu</h2>
        <p>
          Możemy zmienić regulamin, gdy zmieni się prawo albo sposób działania sklepu. Nowa
          treść obowiązuje od daty podanej na górze tej strony. Do zamówień złożonych wcześniej
          stosuje się regulamin z chwili złożenia zamówienia.
        </p>
      </section>
    </article>
  );
}
