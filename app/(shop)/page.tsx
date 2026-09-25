import type { Metadata } from "next";

import { LandingBag } from "@/components/landing/landing-bag";
import { LandingFeatured, type FeaturedProduct } from "@/components/landing/landing-featured";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingHow } from "@/components/landing/landing-how";
import { LandingShelf } from "@/components/landing/landing-shelf";
import { LandingStory } from "@/components/landing/landing-story";
import { isoWeekday, warsawDateIso } from "@/lib/dates";
import { buildCategoryTiles, type ShopCategoryTileData } from "@/lib/shop/category-tiles";
import { getPickupBasics } from "@/lib/shop/landing-data";
import { buildPickupCopy } from "@/lib/shop/pickup-copy";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Adjano — piekarnia w Mikołowie od 1937",
  description:
    "Piekarnia-Cukiernia Adjano, ul. Katowicka 120. Zamów z telefonu, odbierz w pracy.",
  openGraph: {
    title: "Adjano — piekarnia w Mikołowie od 1937",
    description:
      "Piekarnia-Cukiernia Adjano, ul. Katowicka 120. Zamów z telefonu, odbierz w pracy.",
    images: [{ url: "/brand/kamienica.jpg" }],
  },
};

function stockPromo(
  row: { effective_price_grosze?: number; is_promo?: boolean } | undefined,
  regularPrice: number,
) {
  const isPromo = Boolean(row?.is_promo);
  const effective =
    isPromo && typeof row?.effective_price_grosze === "number"
      ? row.effective_price_grosze
      : regularPrice;
  return { isPromo, effective };
}

export default async function LandingPage() {
  const pickup = await getPickupBasics();
  const copy = buildPickupCopy(pickup.day, pickup.cutoff, warsawDateIso());
  const shop = pickup.publicPoints[0] ?? null;
  const shopHref = copy.day ? `/sklep?dzien=${copy.day}` : "/sklep";

  let tiles: ShopCategoryTileData[] = [];
  let featured: FeaturedProduct[] = [];
  if (getSupabasePublicEnv()) {
    try {
      const supabase = await createServerClient();
      const [categoriesResult, productsResult] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, slug, description, image_path, sort_order")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("products")
          .select("id, category_id, name, description, price_grosze, image_path, is_featured, weekdays, sort_order")
          .eq("is_active", true),
      ]);
      const { data: availability } = pickup.day
        ? await supabase.rpc("product_availability", { p_day: pickup.day })
        : { data: [] };
      const categories = categoriesResult.data ?? [];
      const products = productsResult.data ?? [];
      tiles = buildCategoryTiles(categories, products, availability ?? [], pickup.day);
      if (pickup.day) {
        const weekday = isoWeekday(pickup.day);
        const slugByCategory = new Map(categories.map((category) => [category.id, category.slug]));
        const stockByProduct = new Map((availability ?? []).map((row) => [row.product_id, row]));
        featured = products
          .filter(
            (product) =>
              product.is_featured &&
              product.category_id !== null &&
              product.weekdays.includes(weekday) &&
              slugByCategory.has(product.category_id),
          )
          .sort((a, b) => a.sort_order - b.sort_order)
          .slice(0, 4)
          .flatMap((product) => {
            const categoryId = product.category_id;
            if (!categoryId) {
              return [];
            }
            const slug = slugByCategory.get(categoryId);
            if (!slug || !pickup.day) {
              return [];
            }
            const stock = stockByProduct.get(product.id);
            const promo = stockPromo(stock, product.price_grosze);
            return [
              {
                id: product.id,
                name: product.name,
                description: product.description,
                imagePath: product.image_path,
                href: `/sklep/${slug}?dzien=${pickup.day}`,
                effectivePriceGrosze: promo.effective,
                regularPriceGrosze: product.price_grosze,
                isPromo: promo.isPromo,
                soldOut: stock ? !stock.is_available || stock.remaining <= 0 : false,
              },
            ];
          });
      }
    } catch {
      tiles = [];
      featured = [];
    }
  }

  return (
    <div>
      <LandingHero copy={copy} cutoff={pickup.cutoff} shop={shop} shopHref={shopHref} />
      {featured.length >= 2 ? (
        <LandingFeatured products={featured} copy={copy} shopHref={shopHref} />
      ) : null}
      <LandingShelf tiles={tiles} copy={copy} shopHref={shopHref} />
      <LandingHow cutoff={pickup.cutoff} points={pickup.publicPoints} />
      <LandingStory shop={shop} phone={pickup.phone} />
      <LandingBag copy={copy} shopHref={shopHref} />
    </div>
  );
}
