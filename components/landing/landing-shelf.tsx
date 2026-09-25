import Image from "next/image";
import Link from "next/link";
import {
  Cake,
  IceCream,
  Leaf,
  Salad,
  Sandwich,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { categoryPublicUrl } from "@/lib/categories/image";
import type { ShopCategoryTileData } from "@/lib/shop/category-tiles";
import type { PickupCopy } from "@/lib/shop/pickup-copy";
import { nbsp } from "@/lib/typography";

const wrap = "mx-auto w-full max-w-[1280px] px-5 lg:px-12";

const h2 =
  "mt-[18px] font-heading text-[2.375rem] leading-[1.06] font-medium tracking-[-0.015em] text-balance lg:text-[3.625rem] lg:leading-[1.02]";

const ICONS_BY_SLUG: Record<string, LucideIcon> = {
  kanapki: Sandwich,
  salatki: Salad,
  deserki: IceCream,
  ciasta: Cake,
  keto: Leaf,
  gastro: UtensilsCrossed,
};

function formatPozycje(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (count === 1) {
    return "1 pozycja";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} pozycje`;
  }
  return `${count} pozycji`;
}

function ShelfTile({ tile, day }: { tile: ShopCategoryTileData; day: string | null }) {
  const href = day ? `/sklep/${tile.slug}?dzien=${day}` : `/sklep/${tile.slug}`;
  const imageUrl = categoryPublicUrl(tile.imagePath);
  const Icon = ICONS_BY_SLUG[tile.slug] ?? ShoppingBag;
  const meta = formatPozycje(tile.productCount);

  return (
    <li>
      <Link href={href} className="group block">
        <div className="relative aspect-square overflow-hidden border-b border-[var(--adj-ink)]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="adj-cutout object-contain object-bottom transition-transform duration-300 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:-translate-y-1.5 group-hover:scale-[1.02]"
            />
          ) : (
            <span className="flex size-full items-center justify-center">
              <Icon className="size-14 text-[var(--adj-khaki-light)]" strokeWidth={1.5} aria-hidden />
            </span>
          )}
          {tile.hasPromo || tile.runningLow ? (
            <span className="absolute top-0 left-0 flex flex-col gap-1">
              {tile.hasPromo ? (
                <span className="adj-label border border-[var(--adj-red)] bg-[var(--adj-paper-light)] px-2 py-1 text-[11px] text-[var(--adj-red)]">
                  promocje
                </span>
              ) : null}
              {tile.runningLow ? (
                <span className="adj-label border border-[var(--adj-red)] bg-[var(--adj-paper-light)] px-2 py-1 text-[11px] text-[var(--adj-red)]">
                  kończy się
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-[21px] leading-[1.15] font-medium group-hover:text-[var(--adj-red)] lg:mt-[18px] lg:text-[27px]">
          {nbsp(tile.name)}
        </h3>
        <p className="adj-label mt-2 text-[11px] tracking-[0.12em] text-[var(--adj-khaki-light)] lg:text-[13px] lg:tracking-[0.16em]">
          {meta}
        </p>
      </Link>
    </li>
  );
}

export function LandingShelf({
  tiles,
  copy,
  shopHref,
}: {
  tiles: ShopCategoryTileData[];
  copy: PickupCopy;
  shopHref: string;
}) {
  return (
    <section id="sklep" className="py-[72px] lg:pt-28 lg:pb-[104px]">
      <div className={wrap}>
        <div className="flex flex-col items-start gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="adj-label text-[var(--adj-red)]">Menu</p>
            <h2 className={h2}>{copy.menuHeading}</h2>
          </div>
          <Link className="adj-link" href={shopHref}>
            Cały sklep
          </Link>
        </div>
        {tiles.length > 0 ? (
          <ul className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 lg:mt-14 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14">
            {tiles.map((tile) => (
              <ShelfTile key={tile.id} tile={tile} day={copy.day} />
            ))}
            <li className="col-span-2 lg:col-span-1">
              <Link
                href="/zamowienie-specjalne"
                className="flex h-full flex-col justify-between border border-[var(--adj-ink)] p-[22px] lg:px-[26px] lg:py-7"
              >
                <div>
                  <p className="adj-label text-[var(--adj-red)]">Zamówienie specjalne</p>
                  <p className="mt-4 text-2xl leading-[1.15] font-medium lg:text-[27px]">
                    Większa ilość albo coś spoza menu?
                  </p>
                  <p className="mt-3 text-[17px] text-[var(--adj-ink-soft)]">
                    Napisz, czego potrzebujesz i&nbsp;na kiedy. Odezwiemy się.
                  </p>
                </div>
                <span className="adj-link mt-6 self-start">Napisz do nas</span>
              </Link>
            </li>
          </ul>
        ) : (
          <p className="mt-9 text-lg text-[var(--adj-ink-soft)]">
            Menu na najbliższe dni jest w&nbsp;sklepie.{" "}
            <Link className="adj-link" href={shopHref}>
              Przejdź do sklepu
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
