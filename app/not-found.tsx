import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="adj-pattern flex min-h-screen items-center justify-center px-5 py-16">
      <div className="adj-framed w-full max-w-[520px] px-7 pt-10 pb-9 text-center lg:px-12 lg:pt-12 lg:pb-11">
        <Link href="/" aria-label="Adjano Deli — strona główna" className="inline-block">
          <Image
            src="/brand/logo/adjano-deli-karmin.svg"
            alt="Adjano Deli"
            width={520}
            height={231}
            className="mx-auto h-auto w-[150px] lg:w-[170px]"
            priority
            unoptimized
          />
        </Link>
        <div className="mt-7 h-px w-full bg-[var(--adj-gold-light)]" aria-hidden />
        <p className="adj-label mt-7 text-[var(--adj-red)]">Błąd 404</p>
        <h1 className="mt-3 font-heading text-[34px] leading-[1.08] font-medium lg:text-[40px]">
          Tej strony nie ma
        </h1>
        <p className="mx-auto mt-3 max-w-[30ch] text-balance text-[17px] leading-relaxed text-[var(--adj-ink-soft)]">
          Sprawdź adres albo wróć do sklepu. Pieczywo, kanapki i&nbsp;ciasta są na swoim miejscu.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <Link href="/sklep" className="adj-btn w-full sm:w-auto">
            Przejdź do sklepu
          </Link>
          <Link href="/" className="adj-link">
            Strona główna
          </Link>
        </div>
      </div>
    </main>
  );
}
