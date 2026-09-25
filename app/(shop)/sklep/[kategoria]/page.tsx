import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/brand/section-heading";
import { ShelfTile } from "@/components/brand/shelf-tile";
import { DayPicker } from "@/components/shop/day-picker";
import { MobileCartBar } from "@/components/shop/mobile-cart-bar";
import { ProductCard } from "@/components/shop/product-card";
import { formatCutoff, isoWeekday, warsawDateIso } from "@/lib/dates";
import { buildCategoryTiles } from "@/lib/shop/category-tiles";
import { buildPickupCopy } from "@/lib/shop/pickup-copy";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";
import { nbsp } from "@/lib/typography";

type CategoryPageProps = {
  params: Promise<{ kategoria: string }>;
  searchParams: Promise<{ dzien?: string }>;
};

function stockLead(row: { lead_days?: number; earliest_date?: string | null } | undefined) {
  return {
    leadDays: typeof row?.lead_days === "number" && row.lead_days >= 1 ? row.lead_days : 1,
    earliestDate: row?.earliest_date ? String(row.earliest_date).slice(0, 10) : null,
  };
}

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

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { kategoria } = await params;
  if (!getSupabasePublicEnv()) {
    return { title: "Sklep AdjanoDeli" };
  }
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("categories")
    .select("name, description")
    .eq("slug", kategoria)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) {
    return { title: "Sklep AdjanoDeli" };
  }

  return {
    title: `${data.name} — AdjanoDeli`,
    description: data.description?.trim() || `Zamów ${data.name.toLowerCase()} z Piekarni Adjano.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { kategoria } = await params;
  const query = await searchParams;

  if (!getSupabasePublicEnv()) {
    return (
      <SectionHeading
        as="h1"
        eyebrow="Sklep"
        title="Sklep chwilowo niedostępny"
        description="Wróć za chwilę."
      />
    );
  }

  const supabase = await createServerClient();
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_path")
    .eq("slug", kategoria)
    .eq("is_active", true)
    .maybeSingle();

  if (!category) {
    notFound();
  }

  const [datesResult, categoriesResult, productsResult, settingsResult, tagsResult] = await Promise.all([
    supabase.rpc("available_pickup_dates"),
    supabase
      .from("categories")
      .select("id, name, slug, description, image_path, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("products")
      .select(
        "id, category_id, name, description, allergens, tags, price_grosze, image_path, daily_cap_default, sort_order, weekdays, is_new",
      )
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("settings").select("max_qty_per_item, cutoff_time").eq("id", 1).maybeSingle(),
    supabase.from("product_tags").select("name, color"),
  ]);

  const pickupDates = (datesResult.data ?? [])
    .map((value) => (typeof value === "string" ? value.slice(0, 10) : ""))
    .filter(Boolean);

  if (pickupDates.length === 0) {
    return (
      <SectionHeading
        as="h1"
        eyebrow="Sklep"
        title="Zamówienia chwilowo wstrzymane"
        description="Wróć wkrótce."
      />
    );
  }

  const selectedDay =
    query.dzien && pickupDates.includes(query.dzien) ? query.dzien : pickupDates[0];
  const dayWeekday = isoWeekday(selectedDay);
  const maxQtyPerItem = settingsResult.data?.max_qty_per_item ?? 15;
  const cutoff = settingsResult.data?.cutoff_time
    ? formatCutoff(String(settingsResult.data.cutoff_time))
    : "20:00";
  const copy = buildPickupCopy(selectedDay, cutoff, warsawDateIso());

  const { data: availability } = await supabase.rpc("product_availability", {
    p_day: selectedDay,
  });
  const availabilityByProduct = new Map((availability ?? []).map((row) => [row.product_id, row]));
  const tagColorByName = new Map((tagsResult.data ?? []).map((row) => [row.name, row.color]));

  const products = (productsResult.data ?? []).filter(
    (product) => product.category_id === category.id && product.weekdays.includes(dayWeekday),
  );

  const otherTiles = buildCategoryTiles(
    (categoriesResult.data ?? []).filter((item) => item.id !== category.id),
    productsResult.data ?? [],
    availability ?? [],
    selectedDay,
  );

  return (
    <div className="pb-24 md:pb-0">
      <nav className="adj-ui text-[14px] text-[var(--adj-ink-soft)]">
        <Link href={`/sklep?dzien=${selectedDay}`} className="hover:text-[var(--adj-ink)]">
          Sklep
        </Link>
        {" / "}
        <span className="text-[var(--adj-ink)]">{nbsp(category.name)}</span>
      </nav>

      <div className="mt-6">
        <SectionHeading
          as="h1"
          eyebrow={copy.longDate ?? undefined}
          title={nbsp(category.name)}
          description={category.description}
        />
      </div>

      <div className="mt-8">
        <DayPicker dates={pickupDates} selected={selectedDay} basePath={`/sklep/${category.slug}`} />
      </div>

      {products.length > 0 ? (
        <div className="mt-10 grid gap-y-8 md:grid-cols-2 md:gap-x-8 md:gap-y-12 lg:grid-cols-3">
          {products.map((product) => {
            const stock = availabilityByProduct.get(product.id);
            return (
              <ProductCard
                key={product.id}
                productId={product.id}
                name={product.name}
                description={product.description}
                allergens={product.allergens}
                tags={product.tags.map((name) => ({
                  name,
                  color: tagColorByName.get(name) ?? "gold",
                }))}
                unitPriceGrosze={stockPromo(stock, product.price_grosze).effective}
                regularPriceGrosze={product.price_grosze}
                isPromo={stockPromo(stock, product.price_grosze).isPromo}
                imagePath={product.image_path}
                day={selectedDay}
                remaining={stock?.remaining ?? product.daily_cap_default}
                isAvailable={stock?.is_available ?? true}
                isNew={Boolean(product.is_new)}
                maxQtyPerItem={maxQtyPerItem}
                leadDays={stockLead(stock).leadDays}
                earliestDate={stockLead(stock).earliestDate}
              />
            );
          })}
        </div>
      ) : (
        <p className="mt-10 text-lg text-[var(--adj-ink-soft)]">Na ten dzień nic z tej kategorii.</p>
      )}

      {otherTiles.length > 0 ? (
        <section className="mt-20 border-t border-[var(--adj-ink)] pt-10">
          <SectionHeading as="h2" title="Inne kategorie" />
          <ul className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {otherTiles.map((tile) => (
              <ShelfTile key={tile.id} tile={tile} day={selectedDay} compact />
            ))}
          </ul>
        </section>
      ) : null}

      <MobileCartBar />
    </div>
  );
}
