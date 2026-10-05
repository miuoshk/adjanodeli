import { SectionHeading } from "@/components/brand/section-heading";

// Polityka prywatności: do weryfikacji przez prawnika przed startem sklepu.

export default function PrivacyPage() {
  return (
    <article className="max-w-[68ch] text-[17px] leading-[1.7]">
      <SectionHeading as="h1" eyebrow="Informacje" title="Polityka prywatności" />

      <section className="space-y-2">
        <h2 className="mt-12 font-heading text-[26px] font-medium">Administrator</h2>
        <p>Administratorem danych osobowych jest [[NAZWA FIRMY]].</p>
      </section>

      <section className="space-y-2">
        <h2 className="mt-12 font-heading text-[26px] font-medium">Cele</h2>
        <p>Dane przetwarzamy, żeby:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>zrealizować zamówienie i odbiór w punkcie,</li>
          <li>skontaktować się w sprawie zamówienia albo zapytania specjalnego,</li>
          <li>wysyłać informacje marketingowe — tylko jeśli wyrazisz zgodę,</li>
          <li>
            wysyłać przypomnienie o 18:00 dzień przed odbiorem — tylko jeśli osobno włączysz
            przypomnienie. Zgoda na nowości w menu tego nie obejmuje.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="mt-12 font-heading text-[26px] font-medium">Podstawa prawna</h2>
        <p>
          Podstawą jest wykonanie umowy (zamówienie), obowiązek prawny (np. reklamacje) oraz —
          przy marketingu i przy przypomnieniu o zamówieniu — Twoja zgoda. Możesz ją wycofać w
          każdej chwili: nowości w menu na koncie, przypomnienie o 18:00 w mailu albo na koncie.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="mt-12 font-heading text-[26px] font-medium">Odbiorcy</h2>
        <p>Z danymi mogą stykać się:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Supabase — hosting bazy w UE,</li>
          <li>Stripe — płatności,</li>
          <li>Resend — e-maile,</li>
          <li>Vercel — hosting strony.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="mt-12 font-heading text-[26px] font-medium">Okres przechowywania</h2>
        <p>
          Dane zamówienia trzymamy tak długo, jak potrzeba do realizacji, reklamacji i obowiązków
          prawnych. Konto możesz poprosić o usunięcie — o ile nie blokuje tego prawo.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="mt-12 font-heading text-[26px] font-medium">Twoje prawa</h2>
        <p>
          Masz prawo dostępu do danych, sprostowania, usunięcia, ograniczenia przetwarzania,
          przenoszenia i sprzeciwu. Skargę możesz złożyć do Prezesa UODO.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="mt-12 font-heading text-[26px] font-medium">Cookies</h2>
        <p>
          Używamy tylko niezbędnych mechanizmów: ciasteczka sesji logowania oraz koszyk w
          localStorage przeglądarki. Nie ma banera cookies, bo nie prowadzimy śledzenia
          marketingowego.
        </p>
      </section>
    </article>
  );
}
