import type { PickupCopy } from "@/lib/shop/pickup-copy";

export function LandingStrip({ copy, cutoff }: { copy: PickupCopy; cutoff: string }) {
  return (
    <div className="bg-[var(--adj-khaki)] text-[var(--adj-cream)]">
      <div className="adj-ui mx-auto flex min-h-[38px] w-full max-w-[1280px] items-center gap-3 px-5 text-[13px] tracking-[0.02em] md:min-h-10 md:justify-center md:gap-[18px] md:text-sm lg:px-12">
        {copy.day ? (
          <>
            <span className="md:hidden">
              Najbliższy odbiór: <b className="font-[650]">{copy.shortDate}</b>
            </span>
            <span className="hidden md:inline">
              Najbliższy odbiór: <b className="font-[650]">{copy.longDate}</b>
            </span>
            <span className="h-3.5 w-px shrink-0 bg-[var(--adj-cream)]/35" aria-hidden />
            <span className="md:hidden">Zamówisz do {cutoff}</span>
            <span className="hidden md:inline">Zamówienia do {cutoff} dzień wcześniej</span>
            <span
              className="hidden h-3.5 w-px shrink-0 bg-[var(--adj-cream)]/35 md:block"
              aria-hidden
            />
            <span className="hidden md:inline">BLIK, karta, Apple Pay albo Google Pay</span>
          </>
        ) : (
          <span>Zamówienia do {cutoff} dzień przed odbiorem</span>
        )}
      </div>
    </div>
  );
}
