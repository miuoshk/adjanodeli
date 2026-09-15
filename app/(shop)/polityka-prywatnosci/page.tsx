// Polityka prywatności: do weryfikacji przez prawnika przed startem sklepu.

export default function PrivacyPage() {
  return (
    <article className="space-y-8 leading-relaxed">
      <h1 className="font-heading text-3xl font-semibold">Polityka prywatności</h1>

      <section className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">Administrator</h2>
        <p>Administratorem danych osobowych jest [[NAZWA FIRMY]].</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">Cele</h2>
        <p>Dane przetwarzamy, żeby:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>zrealizować zamówienie i odbiór w punkcie,</li>
          <li>skontaktować się w sprawie zamówienia albo zapytania specjalnego,</li>
          <li>wysyłać informacje marketingowe — tylko jeśli wyrazisz zgodę.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">Podstawa prawna</h2>
        <p>
          Podstawą jest wykonanie umowy (zamówienie), obowiązek prawny (np. reklamacje) oraz —
          przy marketingu — Twoja zgoda. Możesz ją wycofać w każdej chwili.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">Odbiorcy</h2>
        <p>Z danymi mogą stykać się:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Supabase — hosting bazy w UE,</li>
          <li>Stripe — płatności,</li>
          <li>Resend — e-maile,</li>
          <li>Vercel — hosting strony.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">Okres przechowywania</h2>
        <p>
          Dane zamówienia trzymamy tak długo, jak potrzeba do realizacji, reklamacji i obowiązków
          prawnych. Konto możesz poprosić o usunięcie — o ile nie blokuje tego prawo.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">Twoje prawa</h2>
        <p>
          Masz prawo dostępu do danych, sprostowania, usunięcia, ograniczenia przetwarzania,
          przenoszenia i sprzeciwu. Skargę możesz złożyć do Prezesa UODO.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">Cookies</h2>
        <p>
          Używamy tylko niezbędnych mechanizmów: ciasteczka sesji logowania oraz koszyk w
          localStorage przeglądarki. Nie ma banera cookies, bo nie prowadzimy śledzenia
          marketingowego.
        </p>
      </section>
    </article>
  );
}
