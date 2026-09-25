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
import { nbsp } from "@/lib/typography";

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

export function ShelfTile({
  tile,
  day,
  compact = false,
}: {
  tile: ShopCategoryTileData;
  day: string | null;
  compact?: boolean;
}) {
  const href = day ? `/sklep/${tile.slug}?dzien=${day}` : `/sklep/${tile.slug}`;
  const imageUrl = categoryPublicUrl(tile.imagePath);
  const Icon = ICONS_BY_SLUG[tile.slug] ?? ShoppingBag;

  return (
    <li>
      <Link href={href} className="group block">
        <div
          className={
            compact
              ? "relative aspect-[4/3] overflow-hidden border-b border-[var(--adj-ink)]"
              : "relative aspect-square overflow-hidden border-b border-[var(--adj-ink)]"
          }
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes={compact ? "(min-width: 1024px) 16vw, 33vw" : "(min-width: 1024px) 25vw, 50vw"}
              className="adj-cutout object-contain object-bottom transition-transform duration-300 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:-translate-y-1.5 group-hover:scale-[1.02]"
            />
          ) : (
            <span className="flex size-full items-center justify-center">
              <Icon
                className={compact ? "size-8 text-[var(--adj-khaki-light)]" : "size-14 text-[var(--adj-khaki-light)]"}
                strokeWidth={1.5}
                aria-hidden
              />
            </span>
          )}
          {!compact && (tile.hasPromo || tile.runningLow) ? (
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
        <h3
          className={
            compact
              ? "mt-2 text-[17px] leading-[1.15] font-medium group-hover:text-[var(--adj-red)] lg:text-[20px]"
              : "mt-3 text-[21px] leading-[1.15] font-medium group-hover:text-[var(--adj-red)] lg:mt-[18px] lg:text-[27px]"
          }
        >
          {nbsp(tile.name)}
        </h3>
        {compact ? null : (
          <p className="adj-label mt-2 text-[11px] tracking-[0.12em] text-[var(--adj-khaki-light)] lg:text-[13px] lg:tracking-[0.16em]">
            {formatPozycje(tile.productCount)}
          </p>
        )}
      </Link>
    </li>
  );
}

export function SpecialOrderTile() {
  return (
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
  );
}
