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
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const ICONS_BY_SLUG: Record<string, LucideIcon> = {
  kanapki: Sandwich,
  salatki: Salad,
  deserki: IceCream,
  ciasta: Cake,
  keto: Leaf,
  gastro: UtensilsCrossed,
};

function iconForSlug(slug: string): LucideIcon {
  return ICONS_BY_SLUG[slug] ?? ShoppingBag;
}

function formatProductCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (count === 1) {
    return "1 produkt";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} produkty`;
  }
  return `${count} produktów`;
}

type CategoryTileProps = {
  name: string;
  slug: string;
  imagePath: string | null;
  productCount: number;
  runningLow: boolean;
  hasPromo?: boolean;
  day?: string | null;
  compact?: boolean;
};

export function CategoryTile({
  name,
  slug,
  imagePath,
  productCount,
  runningLow,
  hasPromo = false,
  day,
  compact = false,
}: CategoryTileProps) {
  const href = day ? `/sklep/${slug}?dzien=${day}` : `/sklep/${slug}`;
  const imageUrl = categoryPublicUrl(imagePath);
  const Icon = iconForSlug(slug);

  return (
    <Link
      href={href}
      className={cn(
        "relative block overflow-hidden rounded-xl bg-[var(--adj-khaki)] text-[var(--adj-cream)]",
        compact ? "aspect-square md:aspect-[4/3]" : "aspect-square md:aspect-[4/3]",
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={compact ? "(min-width: 768px) 20vw, 33vw" : "(min-width: 768px) 30vw, 50vw"}
          className="object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center">
          <Icon
            className={compact ? "size-10" : "size-14"}
            strokeWidth={1.5}
            aria-hidden
          />
        </span>
      )}
      <span
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
        aria-hidden
      />
      <span className="absolute top-2 right-2 flex flex-col items-end gap-1">
        {hasPromo ? (
          <Badge className="bg-primary text-primary-foreground">promocje</Badge>
        ) : null}
        {runningLow ? (
          <Badge className="bg-primary text-primary-foreground">kończy się</Badge>
        ) : null}
      </span>
      <span className={cn("absolute inset-x-0 bottom-0", compact ? "p-2" : "p-3")}>
        <span
          className={cn(
            "block font-heading font-semibold leading-tight",
            compact ? "line-clamp-2 text-sm sm:text-base" : "text-2xl sm:text-3xl",
          )}
        >
          {name}
        </span>
        <span className={cn("mt-1 block text-[var(--adj-cream)]/90", compact ? "text-xs" : "text-sm")}>
          {formatProductCount(productCount)}
        </span>
      </span>
    </Link>
  );
}
