import type { Metadata } from "next";

import { LandingBag } from "@/components/landing/landing-bag";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingHow } from "@/components/landing/landing-how";
import { LandingShelf } from "@/components/landing/landing-shelf";
import { LandingStory } from "@/components/landing/landing-story";
import { warsawDateIso } from "@/lib/dates";
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

export default async function LandingPage() {
  const pickup = await getPickupBasics();
  const copy = buildPickupCopy(pickup.day, pickup.cutoff, warsawDateIso());
  const shop = pickup.publicPoints[0] ?? null;
  const shopHref = copy.day ? `/sklep?dzien=${copy.day}` : "/sklep";

  let tiles: ShopCategoryTileData[] = [];
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
          .select("id, category_id, weekdays, price_grosze")
          .eq("is_active", true),
      ]);
      const { data: availability } = pickup.day
        ? await supabase.rpc("product_availability", { p_day: pickup.day })
        : { data: [] };
      tiles = buildCategoryTiles(
        categoriesResult.data ?? [],
        productsResult.data ?? [],
        availability ?? [],
        pickup.day,
      );
    } catch {
      tiles = [];
    }
  }

  return (
    <div className="adj-landing">
      <LandingHero copy={copy} cutoff={pickup.cutoff} shop={shop} shopHref={shopHref} />
      <LandingShelf tiles={tiles} copy={copy} shopHref={shopHref} />
      <LandingHow cutoff={pickup.cutoff} points={pickup.publicPoints} />
      <LandingStory shop={shop} phone={pickup.phone} />
      <LandingBag copy={copy} shopHref={shopHref} />
    </div>
  );
}
