import Image from "next/image";

import type { PublicPoint } from "@/lib/shop/landing-data";

const wrap = "mx-auto w-full max-w-[1280px] px-5 lg:px-12";

const h2 =
  "mt-[18px] font-heading text-[2.375rem] leading-[1.06] font-medium tracking-[-0.015em] text-balance lg:text-[3.625rem] lg:leading-[1.02]";

const factRow =
  "grid grid-cols-[116px_1fr] gap-3 border-b border-[rgba(43,42,31,0.18)] py-[13px] text-[17px] lg:grid-cols-[150px_1fr] lg:gap-4";

export function LandingStory({ shop, phone }: { shop: PublicPoint | null; phone: string | null }) {
  return (
    <section id="o-nas" className="py-[72px] lg:pt-[120px] lg:pb-28">
      <div className={wrap}>
        <div className="grid gap-9 lg:grid-cols-[7fr_5fr] lg:items-center lg:gap-[72px]">
          <div className="relative order-2 aspect-[3/2] overflow-hidden bg-[var(--adj-cream-dark)] lg:order-none">
            <Image
              src="/brand/landing/piec-lopata.jpg"
              alt="Upieczony bochenek na drewnianej łopacie przy otwartym piecu"
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="adj-photo object-cover"
            />
          </div>
          <div>
            <p className="adj-label text-[var(--adj-red)]">O&nbsp;nas</p>
            <h2 className={h2}>
              Pieczemy w&nbsp;Kamionce od{" "}
              <em className="font-normal text-[var(--adj-red)] italic">1937</em> roku.
            </h2>
            <p className="mt-6 text-lg text-[var(--adj-ink-soft)] lg:text-[19px]">
              Jesteśmy rodzinną piekarnią i&nbsp;cukiernią przy Katowickiej 120. Bochenki wyrastają
              u&nbsp;nas w&nbsp;koszykach, a&nbsp;do pieca wkładamy je drewnianą łopatą.
            </p>
            <p className="mt-3.5 text-lg text-[var(--adj-ink-soft)] lg:text-[19px]">
              Oprócz chleba i&nbsp;bułek robimy ciasta, a&nbsp;do pracy także kanapki, sałatki
              i&nbsp;deserki w&nbsp;kubeczkach.
            </p>
            <dl className="mt-8 border-t border-[var(--adj-ink)]">
              <div className={factRow}>
                <dt className="adj-ui pt-0.5 text-[15px] text-[var(--adj-ink-soft)]">Adres</dt>
                <dd>ul. Katowicka 120, 43-190 Mikołów</dd>
              </div>
              {shop ? (
                <div className={factRow}>
                  <dt className="adj-ui pt-0.5 text-[15px] text-[var(--adj-ink-soft)]">
                    Odbiór w&nbsp;sklepie
                  </dt>
                  <dd>
                    {shop.days}, {shop.hours}
                  </dd>
                </div>
              ) : null}
              {phone ? (
                <div className={factRow}>
                  <dt className="adj-ui pt-0.5 text-[15px] text-[var(--adj-ink-soft)]">Telefon</dt>
                  <dd>
                    <a
                      href={`tel:${phone}`}
                      className="underline decoration-[var(--adj-gold)] underline-offset-[6px]"
                    >
                      {phone}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:mt-16 lg:grid-cols-12 lg:items-end lg:gap-6">
          <figure className="lg:col-span-4 lg:col-start-2">
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src="/brand/landing/piec-koszyki.jpg"
                alt="Koszyki z wyrastającym ciastem na regałach, w tle piekarz przy piecu"
                fill
                sizes="(min-width: 1024px) 30vw, 50vw"
                className="adj-photo object-cover object-[30%_50%]"
              />
            </div>
            <figcaption className="mt-3.5 text-sm text-[var(--adj-ink-soft)] italic lg:text-[15px]">
              Koszyki do wyrastania.
            </figcaption>
          </figure>
          <figure className="lg:col-span-6 lg:col-start-7">
            <div className="relative aspect-[4/5] overflow-hidden lg:aspect-[3/2]">
              <Image
                src="/brand/landing/piec-trzon.jpg"
                alt="Bochenki pieką się w piecu"
                fill
                sizes="(min-width: 1024px) 45vw, 50vw"
                className="adj-photo object-cover object-[62%_50%] lg:object-center"
              />
            </div>
            <figcaption className="mt-3.5 text-sm text-[var(--adj-ink-soft)] italic lg:text-[15px]">
              Bochenki w&nbsp;piecu.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
