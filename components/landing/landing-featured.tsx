import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/lib/format";
import { productPublicUrl } from "@/lib/products/image";
import type { PickupCopy } from "@/lib/shop/pickup-copy";
import { nbsp } from "@/lib/typography";
import { cn } from "@/lib/utils";

const wrap = "mx-auto w-full max-w-[1280px] px-5 lg:px-12";

const h2 =
  "mt-[18px] font-heading text-[2.375rem] leading-[1.06] font-medium tracking-[-0.015em] text-balance lg:text-[3.625rem] lg:leading-[1.02]";

export type FeaturedProduct = {
  id: string;
  name: string;
  description: string | null;
  imagePath: string | null;
  href: string;
  effectivePriceGrosze: number;
  regularPriceGrosze: number;
  isPromo: boolean;
  soldOut: boolean;
};

function displayName(name: string): string {
  if (!name) {
    return name;
  }
  return name.charAt(0).toLocaleUpperCase("pl") + name.slice(1);
}

/** Pierwsze zdanie: do pierwszej kropki albo nowej linii. */
function firstSentence(description: string | null): string | null {
  const text = description?.trim();
  if (!text) {
    return null;
  }
  const end = text.search(/[.\n]/);
  const sentence = (end === -1 ? text : text.slice(0, end)).trim();
  return sentence || null;
}

function FeaturedCard({ product }: { product: FeaturedProduct }) {
  const imageUrl = productPublicUrl(product.imagePath);
  const sentence = firstSentence(product.description);

  return (
    <li>
      <Link href={product.href} className="group block">
        <div className="relative aspect-square overflow-hidden border-b border-[var(--adj-ink)]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className={cn(
                "adj-cutout object-contain object-bottom transition-transform duration-300 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:-translate-y-1.5 group-hover:scale-[1.02]",
                product.soldOut && "opacity-50 grayscale",
              )}
            />
          ) : null}
          {product.soldOut ? (
            <span className="adj-label absolute top-0 left-0 border border-[var(--adj-ink-soft)] bg-[var(--adj-paper-light)] px-2 py-1 text-[11px] text-[var(--adj-ink-soft)]">
              Wyprzedane
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-[20px] leading-[1.15] font-medium group-hover:text-[var(--adj-red)] lg:mt-4 lg:text-[24px]">
          {nbsp(displayName(product.name))}
        </h3>
        {sentence ? (
          <p className="mt-1.5 line-clamp-2 text-[15px] leading-[1.45] text-[var(--adj-ink-soft)]">
            {nbsp(sentence)}
          </p>
        ) : null}
        <p className="adj-ui mt-3 text-[17px] font-semibold">
          {product.isPromo ? (
            <>
              <span className="text-[var(--adj-red)]">{formatPrice(product.effectivePriceGrosze)}</span>{" "}
              <span className="font-normal text-[var(--adj-ink-soft)] line-through">
                {formatPrice(product.regularPriceGrosze)}
              </span>
            </>
          ) : (
            formatPrice(product.effectivePriceGrosze)
          )}
        </p>
      </Link>
    </li>
  );
}

export function LandingFeatured({
  products,
  copy,
  shopHref,
}: {
  products: FeaturedProduct[];
  copy: PickupCopy;
  shopHref: string;
}) {
  return (
    <section className="bg-[var(--adj-cream-dark)] py-[72px] lg:py-24">
      <div className={wrap}>
        <div className="flex flex-col items-start gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="adj-label text-[var(--adj-red)]">Polecamy</p>
            <h2 className={h2}>{copy.featuredHeading}</h2>
          </div>
          <Link className="adj-link" href={shopHref}>
            Cały sklep
          </Link>
        </div>
        <ul className="mt-9 grid grid-cols-2 gap-x-4 gap-y-10 lg:mt-12 lg:grid-cols-4 lg:gap-x-8">
          {products.map((product) => (
            <FeaturedCard key={product.id} product={product} />
          ))}
        </ul>
      </div>
    </section>
  );
}
