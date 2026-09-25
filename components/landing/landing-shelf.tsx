import Link from "next/link";

import { ShelfTile, SpecialOrderTile } from "@/components/brand/shelf-tile";
import type { ShopCategoryTileData } from "@/lib/shop/category-tiles";
import type { PickupCopy } from "@/lib/shop/pickup-copy";

const wrap = "mx-auto w-full max-w-[1280px] px-5 lg:px-12";

const h2 =
  "mt-[18px] font-heading text-[2.375rem] leading-[1.06] font-medium tracking-[-0.015em] text-balance lg:text-[3.625rem] lg:leading-[1.02]";

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
            <SpecialOrderTile />
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
