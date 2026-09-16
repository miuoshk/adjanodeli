import type { Metadata } from "next";

import { CategoryTile } from "@/components/shop/category-tile";
import { DayPicker } from "@/components/shop/day-picker";
import { MobileCartBar } from "@/components/shop/mobile-cart-bar";
import { UnlockPointToast } from "@/components/shop/unlock-point-toast";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl } from "@/lib/format";
import { buildCategoryTiles } from "@/lib/shop/category-tiles";
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

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  if (!getSupabasePublicEnv()) {
    return (
      <p className="text-lg leading-relaxed">
        Sklep chwilowo niedostępny. Wróć za chwilę.
      </p>
    );
  }

  try {
    const supabase = await createServerClient();

    const [datesResult, categoriesResult, productsResult] = await Promise.all([
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
    ]);

    const pickupDates = (datesResult.data ?? [])
      .map((value) => (typeof value === "string" ? value.slice(0, 10) : ""))
      .filter(Boolean);

    if (pickupDates.length === 0) {
      return (
        <p className="text-lg leading-relaxed">
          Zamówienia chwilowo wstrzymane. Wróć wkrótce.
        </p>
      );
    }

    const selectedDay =
      params.dzien && pickupDates.includes(params.dzien) ? params.dzien : pickupDates[0];

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
      <div className="space-y-6 pb-24 md:pb-0">
        <UnlockPointToast name={params.odblokowano?.trim() || null} />
        <DayPicker dates={pickupDates} selected={selectedDay} />
        <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Co dziś pieczemy na {formatDatePl(parseDateOnly(selectedDay))}?
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Odbiór w Twoim miejscu pracy? Zapytaj w sekretariacie o kod AdjanoDeli.
        </p>

        {tiles.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {tiles.map((tile) => (
              <li key={tile.id}>
                <CategoryTile
                  name={tile.name}
                  slug={tile.slug}
                  imagePath={tile.imagePath}
                  productCount={tile.productCount}
                  runningLow={tile.runningLow}
                  hasPromo={tile.hasPromo}
                  day={selectedDay}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-base leading-relaxed">Na ten dzień nic nie pieczemy.</p>
        )}

        {/* TODO: sekcja "Zamów ponownie" — 3 ostatnio zamawiane produkty dla zalogowanych */}

        <MobileCartBar />
      </div>
    );
  } catch {
    return (
      <p className="text-lg leading-relaxed">
        Sklep chwilowo niedostępny. Wróć za chwilę.
      </p>
    );
  }
}
