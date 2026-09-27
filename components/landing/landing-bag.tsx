import Image from "next/image";
import Link from "next/link";

import type { PickupCopy } from "@/lib/shop/pickup-copy";

const wrap = "mx-auto w-full max-w-[1280px] px-5 lg:px-12";

export function LandingBag({ copy, shopHref }: { copy: PickupCopy; shopHref: string }) {
  return (
    <section className="adj-pattern py-16 lg:py-[120px]">
      <div className={wrap}>
        <div className="adj-framed mx-auto max-w-[660px] px-6 pt-10 pb-10 text-center lg:px-14 lg:pt-[52px] lg:pb-[52px]">
          <Image
            src="/brand/logo/adjano-deli-karmin.svg"
            alt="Adjano Deli"
            width={520}
            height={231}
            className="mx-auto h-auto w-[150px] lg:w-[190px]"
            unoptimized
          />
          <h2 className="mt-[22px] font-heading text-[34px] leading-[1.06] font-medium tracking-[-0.015em] text-balance lg:mt-[26px] lg:text-[50px] lg:leading-[1.02]">
            {copy.deadline}
          </h2>
          <div className="mt-[34px]">
            <Link className="adj-btn w-full md:w-auto" href={shopHref}>
              {copy.cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
