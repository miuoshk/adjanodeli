import type { ReactNode } from "react";

import type { PublicPoint } from "@/lib/shop/landing-data";
import { nbsp } from "@/lib/typography";
import { cn } from "@/lib/utils";

const wrap = "mx-auto w-full max-w-[1280px] px-5 lg:px-12";

const h2 =
  "mt-[18px] font-heading text-[2.375rem] leading-[1.06] font-medium tracking-[-0.015em] text-balance lg:text-[3.625rem] lg:leading-[1.02]";

export function LandingHow({ cutoff, points }: { cutoff: string; points: PublicPoint[] }) {
  const steps: { big: string; title: ReactNode; text: ReactNode }[] = [
    {
      big: `do ${cutoff}`,
      title: "Zamawiasz",
      text: <>Wybierasz dzień i&nbsp;punkt odbioru. Płacisz BLIK-iem, kartą, Apple Pay albo Google Pay.</>,
    },
    {
      big: "rano",
      title: <>Pieczemy i&nbsp;pakujemy</>,
      text: <>Każda paczka dostaje etykietę z&nbsp;Twoim imieniem.</>,
    },
    {
      big: "na kod",
      title: "Odbierasz",
      text: <>W&nbsp;punkcie podajesz cztery znaki z&nbsp;e‑maila.</>,
    },
  ];

  return (
    <section
      id="jak-to-dziala"
      className="scroll-mt-24 bg-[var(--adj-cream-dark)] py-[72px] lg:py-[104px]"
    >
      <div className={wrap}>
        <p className="adj-label text-[var(--adj-red)]">Jak to działa</p>
        <h2 className={h2}>
          Tak paczka trafia do&nbsp;Ciebie
        </h2>
        <div className="mt-7 grid border-t border-[var(--adj-ink)] lg:mt-12 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.big}
              className={cn(
                "py-6 lg:pt-8 lg:pr-10 lg:pb-[34px]",
                index > 0 &&
                  "border-t border-[rgba(43,42,31,0.18)] lg:border-t-0 lg:border-l lg:pl-10",
              )}
            >
              <p className="text-[42px] leading-none font-normal text-[var(--adj-red)] italic lg:text-[52px]">
                {step.big}
              </p>
              <h3 className="mt-3 text-[23px] leading-[1.2] font-medium lg:mt-4 lg:text-[26px]">
                {step.title}
              </h3>
              <p className="mt-2 text-[var(--adj-ink-soft)]">{step.text}</p>
            </div>
          ))}
        </div>
        <div
          id="punkty-odbioru"
          className="grid scroll-mt-24 gap-6 border-t border-[rgba(43,42,31,0.18)] pt-[26px] lg:grid-cols-2 lg:gap-x-10"
        >
          {points.map((point, index) => (
            <div key={`${point.name}-${point.address}`}>
              <p className="adj-label text-[var(--adj-ink-soft)]">
                {index === 0 ? <>Odbiór w&nbsp;piekarni</> : "Punkt odbioru"}
              </p>
              <p className="mt-2 text-[17px]">
                {nbsp(point.name)}, {nbsp(point.address)}
                <span className="text-[var(--adj-ink-soft)]">
                  {" "}
                  · {point.days}, {point.hours}
                </span>
              </p>
            </div>
          ))}
          <div>
            <p className="adj-label text-[var(--adj-ink-soft)]">Odbiór w&nbsp;pracy</p>
            <p className="mt-2 text-[17px]">
              Dowozimy do kilku instytucji w&nbsp;Mikołowie.{" "}
              <span className="text-[var(--adj-ink-soft)]">
                Kod dostaniesz w&nbsp;sekretariacie i&nbsp;wpiszesz go w&nbsp;koszyku.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
