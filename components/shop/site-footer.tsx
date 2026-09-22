import Link from "next/link";

import { PatternBand } from "@/components/shop/bakery-pattern";

// Baner cookies: NIE dodajemy. Tylko niezbędne cookies (sesja) i koszyk w localStorage.
// Informacja jest w polityce prywatności.

export function SiteFooter() {
  return (
    <footer className="mt-auto text-secondary-foreground">
      <PatternBand soft />
      <div className="bg-secondary">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 text-sm">
          <p className="font-medium">Piekarnia-Cukiernia Adjano · tradycja od 1937 r.</p>
          <address className="not-italic leading-relaxed">
            ul. Katowicka 120
            <br />
            43-190 Mikołów
            <br />
            tel. +48 000 000 000
          </address>
          <nav className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/regulamin" className="underline-offset-4 hover:underline">
              Regulamin
            </Link>
            <Link href="/polityka-prywatnosci" className="underline-offset-4 hover:underline">
              Polityka prywatności
            </Link>
            <Link href="/zamowienie-specjalne" className="underline-offset-4 hover:underline">
              Zamówienia specjalne
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
