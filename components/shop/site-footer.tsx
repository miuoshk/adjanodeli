import Image from "next/image";
import Link from "next/link";

import { warsawDateIso } from "@/lib/dates";
import { getPickupBasics } from "@/lib/shop/landing-data";
import { cn } from "@/lib/utils";

// Baner cookies: NIE dodajemy. Tylko niezbędne cookies (sesja) i koszyk w localStorage.
// Informacja jest w polityce prywatności.

export async function SiteFooter() {
  const pickup = await getPickupBasics();
  const shop = pickup.publicPoints[0] ?? null;
  const year = warsawDateIso().slice(0, 4);

  return (
    <footer className="bg-[var(--adj-khaki)] pb-9 text-[var(--adj-cream)]">
      <div className="adj-gilt" />
      <div className="mx-auto max-w-[1280px] px-5 lg:px-12">
        <div
          className={cn(
            "grid gap-9 pt-12 font-heading text-[17px] leading-[1.7] lg:gap-10 lg:pt-16",
            shop
              ? "lg:grid-cols-[4fr_2.6fr_2.6fr_2.6fr]"
              : "lg:grid-cols-[4fr_2.6fr_2.6fr]",
          )}
        >
          <div>
            <Image
              src="/brand/adjano-logo-cream.svg"
              alt="Adjano"
              width={585}
              height={332}
              className="h-auto w-[138px]"
              unoptimized
            />
            <p className="mt-3.5 max-w-[20em] text-[var(--adj-cream)]/80">
              Piekarnia-Cukiernia Adjano. Rodzinna piekarnia z&nbsp;Kamionki, od 1937 roku.
            </p>
          </div>
          <div className="space-y-3.5">
            <p className="adj-label text-[var(--adj-gold-light)]">Adres</p>
            <address className="not-italic">
              ul. Katowicka 120
              <br />
              43-190 Mikołów
              {pickup.phone ? (
                <>
                  <br />
                  <a
                    href={`tel:${pickup.phone}`}
                    className="hover:underline underline-offset-4"
                  >
                    tel. {pickup.phone}
                  </a>
                </>
              ) : null}
            </address>
          </div>
          {shop ? (
            <div className="space-y-3.5">
              <p className="adj-label text-[var(--adj-gold-light)]">Odbiór w&nbsp;sklepie</p>
              <p>
                {shop.days}, {shop.hours}
              </p>
            </div>
          ) : null}
          <div className="space-y-3.5">
            <p className="adj-label text-[var(--adj-gold-light)]">Informacje</p>
            <ul>
              <li>
                <Link href="/regulamin" className="hover:underline underline-offset-4">
                  Regulamin
                </Link>
              </li>
              <li>
                <Link href="/polityka-prywatnosci" className="hover:underline underline-offset-4">
                  Polityka prywatności
                </Link>
              </li>
              <li>
                <Link href="/zamowienie-specjalne" className="hover:underline underline-offset-4">
                  Zamówienia specjalne
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="adj-ui mt-11 flex flex-col gap-2 border-t border-[var(--adj-cream)]/20 pt-[22px] text-sm text-[var(--adj-cream)]/70 md:flex-row md:justify-between lg:mt-16">
          <p>© {year} Piekarnia-Cukiernia Adjano</p>
          <p>Zamówienia online: AdjanoDeli</p>
        </div>
      </div>
    </footer>
  );
}
