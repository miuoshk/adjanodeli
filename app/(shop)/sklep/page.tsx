import type { Metadata } from "next";

import { SectionHeading } from "@/components/brand/section-heading";
import { ShelfTile, SpecialOrderTile } from "@/components/brand/shelf-tile";
import { DayPicker } from "@/components/shop/day-picker";
import { MobileCartBar } from "@/components/shop/mobile-cart-bar";
import { UnlockPointToast } from "@/components/shop/unlock-point-toast";
import { formatCutoff, warsawDateIso } from "@/lib/dates";
import { buildCategoryTiles } from "@/lib/shop/category-tiles";
import { buildPickupCopy } from "@/lib/shop/pickup-copy";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";

type ShopPageProps = {
  searchParams: Promise<{ dzien?: string; odblokowano?: string }>;
};

export const metadata: Metadata = {
  title: "Sklep AdjanoDeli — zamów dziś, odbierz jutro w pracy",
  description:
    "Pieczywo i słodkości z Piekarni-Cukierni Adjano. Zamów do cutoff, odbierz rano w wybranym punkcie w Mikołowie.",
  openGraph: {
    title: "Sklep AdjanoDeli — zamów dziś, odbierz jutro w pracy",
    description:
      "Pieczywo i słodkości z Piekarni-Cukierni Adjano. Zamów do cutoff, odbierz rano w wybranym punkcie w Mikołowie.",
    images: [{ url: "/brand/kamienica.jpg" }],
  },
};

function shopPaused(title: string, description: string) {
  return <SectionHeading as="h1" eyebrow="Sklep" title={title} description={description} />;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  if (!getSupabasePublicEnv()) {
    return shopPaused("Sklep chwilowo niedostępny", "Wróć za chwilę.");
  }

  try {
    const supabase = await createServerClient();

    const [datesResult, categoriesResult, productsResult, settingsResult] = await Promise.all([
      supabase.rpc("available_pickup_dates"),
      supabase
        .from("categories")
        .select("id, name, slug, description, image_path, sort_order")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("products")
        .select("id, category_id, weekdays")
        .eq("is_active", true),
      supabase.from("settings").select("cutoff_time").eq("id", 1).maybeSingle(),
    ]);

    const pickupDates = (datesResult.data ?? [])
      .map((value) => (typeof value === "string" ? value.slice(0, 10) : ""))
      .filter(Boolean);

    if (pickupDates.length === 0) {
      return shopPaused("Zamówienia chwilowo wstrzymane", "Wróć wkrótce.");
    }

    const selectedDay =
      params.dzien && pickupDates.includes(params.dzien) ? params.dzien : pickupDates[0];
    const cutoff = settingsResult.data?.cutoff_time
      ? formatCutoff(String(settingsResult.data.cutoff_time))
      : "20:00";
    const copy = buildPickupCopy(selectedDay, cutoff, warsawDateIso());

    const { data: availability } = await supabase.rpc("product_availability", {
      p_day: selectedDay,
    });

    const tiles = buildCategoryTiles(
      categoriesResult.data ?? [],
      productsResult.data ?? [],
      availability ?? [],
      selectedDay,
    );

    return (
      <div className="pb-24 md:pb-0">
        <UnlockPointToast name={params.odblokowano?.trim() || null} />
        <SectionHeading
          as="h1"
          eyebrow="Sklep"
          title={copy.menuHeading}
          description={copy.deadline}
        />
        <div className="mt-8">
          <DayPicker dates={pickupDates} selected={selectedDay} />
        </div>
        <p className="adj-ui mt-4 text-[15px] text-[var(--adj-ink-soft)]">
          Odbierasz w&nbsp;pracy? Kod od pracodawcy wpiszesz w&nbsp;koszyku.
        </p>

        {tiles.length > 0 ? (
          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14">
            {tiles.map((tile) => (
              <ShelfTile key={tile.id} tile={tile} day={selectedDay} />
            ))}
            <SpecialOrderTile />
          </ul>
        ) : (
          <p className="mt-10 max-w-[36em] text-lg text-[var(--adj-ink-soft)]">
            Na ten dzień nic nie pieczemy. Wybierz inny dzień powyżej.
          </p>
        )}

        <MobileCartBar />
      </div>
    );
  } catch {
    return shopPaused("Sklep chwilowo niedostępny", "Wróć za chwilę.");
  }
}
