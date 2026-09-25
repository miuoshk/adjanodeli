import Image from "next/image";
import Link from "next/link";
import { Clock, Lock } from "lucide-react";

import type { PublicPoint } from "@/lib/shop/landing-data";
import type { PickupCopy } from "@/lib/shop/pickup-copy";

const wrap = "mx-auto w-full max-w-[1280px] px-5 lg:px-12";

export function LandingHero({
  copy,
  cutoff,
  shop,
  shopHref,
}: {
  copy: PickupCopy;
  cutoff: string;
  shop: PublicPoint | null;
  shopHref: string;
}) {
  return (
    <section className="pt-9 pb-16 lg:pt-[72px] lg:pb-24">
      <div className={wrap}>
        <div className="grid gap-4 lg:grid-cols-[7.2fr_4.8fr] lg:items-center lg:gap-10">
          <div>
            <p className="adj-label adj-rise flex flex-wrap items-center gap-x-3.5 gap-y-2.5 text-[var(--adj-red)]">
              <span>Piekarnia-Cukiernia</span>
              <span
                className="hidden size-1 rounded-full bg-[var(--adj-gold)] md:inline"
                aria-hidden
              />
              <span className="hidden md:inline">Mikołów-Kamionka</span>
              <span className="size-1 rounded-full bg-[var(--adj-gold)]" aria-hidden />
              <span>od 1937</span>
            </p>
            <h1 className="mt-[18px] font-heading text-[3rem] leading-[1.02] font-medium tracking-[-0.02em] text-balance md:text-[4.25rem] lg:mt-7 lg:text-[5.375rem] lg:leading-[0.98]">
              Zamów do {cutoff},{" "}
              <em className="block font-normal text-[var(--adj-khaki)] italic">
                rano odbierzesz w&nbsp;pracy.
              </em>
            </h1>
            <p className="mt-[22px] max-w-[34em] text-[1.1875rem] leading-[1.55] text-[var(--adj-ink-soft)] lg:mt-[30px] lg:text-[1.3125rem]">
              Pieczywo, kanapki i&nbsp;ciasta z&nbsp;piekarni przy Katowickiej 120. Zamówienie
              składasz przez internet, a&nbsp;rano odbierasz je w&nbsp;wybranym punkcie.
            </p>
            <div className="mt-[30px] flex flex-wrap items-center gap-x-[30px] gap-y-3.5 lg:mt-10">
              <Link className="adj-btn w-full md:w-auto" href={shopHref}>
                {copy.cta}
              </Link>
              <a className="adj-link" href="#jak-to-dziala">
                Jak to działa
              </a>
            </div>
            <div className="adj-ui mt-7 flex flex-col gap-2 border-t border-[rgba(43,42,31,0.18)] pt-[22px] text-[15px] text-[var(--adj-ink-soft)] md:flex-row md:flex-wrap md:gap-x-[22px] lg:mt-9">
              {shop ? (
                <span className="inline-flex items-center gap-2">
                  <Clock
                    className="size-[17px] shrink-0 text-[var(--adj-red)]"
                    strokeWidth={1.6}
                    aria-hidden
                  />
                  Odbiór w&nbsp;piekarni: {shop.days}, {shop.hours}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-2">
                <Lock
                  className="size-[17px] shrink-0 text-[var(--adj-red)]"
                  strokeWidth={1.6}
                  aria-hidden
                />
                W&nbsp;pracy: na kod od pracodawcy
              </span>
            </div>
          </div>
          <div className="relative mt-3 h-[390px] lg:mt-0 lg:h-[600px]" aria-hidden>
            <div className="adj-ring absolute top-1/2 left-1/2 size-[330px] -translate-x-1/2 -translate-y-1/2 lg:size-[500px]" />
            <div className="absolute -right-[22px] top-0 w-[300px] lg:-top-1.5 lg:-right-6 lg:w-[450px]">
              <Image
                src="/brand/hero-chleb.png"
                alt=""
                width={1086}
                height={1448}
                priority
                sizes="(min-width: 1024px) 450px, 300px"
                className="adj-cutout h-auto w-full"
              />
            </div>
            <div className="absolute -left-[18px] bottom-1.5 w-[184px] lg:-left-[34px] lg:bottom-[18px] lg:w-[270px]">
              <Image
                src="/brand/hero-bulki.png"
                alt=""
                width={1086}
                height={1448}
                sizes="(min-width: 1024px) 270px, 184px"
                className="adj-cutout h-auto w-full"
              />
            </div>
            <div className="absolute right-1 bottom-4 w-[168px] -rotate-3 border border-[rgba(184,151,90,0.55)] bg-[var(--adj-paper-light)] px-3.5 pt-4 pb-3.5 shadow-[0_1px_0_rgba(43,42,31,0.06),0_12px_28px_-18px_rgba(43,42,31,0.45)] lg:right-[18px] lg:bottom-11 lg:w-[200px] lg:px-[18px] lg:pt-[18px] lg:pb-4">
              <div className="mx-auto size-[9px] rounded-full border border-[var(--adj-gold)] bg-[var(--adj-cream)]" />
              <p className="mt-3 text-center text-lg leading-[1.15] italic lg:text-[21px]">
                Pieczone w&nbsp;Kamionce
              </p>
              <p className="adj-label mt-2 text-center text-[11px] text-[var(--adj-ink-soft)]">
                ul. Katowicka 120
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
