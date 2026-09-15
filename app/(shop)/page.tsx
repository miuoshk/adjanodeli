import Link from "next/link";

import { DayPicker } from "@/components/shop/day-picker";
import { CategoryNav } from "@/components/shop/category-nav";
import { MobileCartBar } from "@/components/shop/mobile-cart-bar";
import { ProductCard } from "@/components/shop/product-card";
import { formatCutoff, parseDateOnly } from "@/lib/dates";
import { formatDatePl } from "@/lib/format";
import { createServerClient } from "@/lib/supabase/server";

type HomePageProps = {
  searchParams: Promise<{ dzien?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const supabase = await createServerClient();

  const [datesResult, categoriesResult, productsResult, settingsResult] = await Promise.all([
    supabase.rpc("available_pickup_dates"),
    supabase.from("categories").select("id, name, slug, sort_order").eq("is_active", true).order("sort_order"),
    supabase
      .from("products")
      .select("id, category_id, name, description, allergens, price_grosze, image_path, daily_cap_default, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("settings").select("cutoff_time, max_qty_per_item").eq("id", 1).single(),
  ]);

  const pickupDates = (datesResult.data ?? []).map((value) => value.slice(0, 10));

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

  const availabilityByProduct = new Map(
    (availability ?? []).map((row) => [row.product_id, row]),
  );

  const categories = categoriesResult.data ?? [];
  const products = productsResult.data ?? [];
  const cutoff = formatCutoff(settingsResult.data?.cutoff_time ?? "20:00");
  const maxQtyPerItem = settingsResult.data?.max_qty_per_item ?? 15;

  const categoriesWithProducts = categories
    .map((category) => ({
      ...category,
      products: products.filter((product) => product.category_id === category.id),
    }))
    .filter((category) => category.products.length > 0);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Zamów dziś, odbierz jutro w pracy.
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Zamówienia na {formatDatePl(parseDateOnly(selectedDay))} przyjmujemy do {cutoff}{" "}
          dnia poprzedniego.
        </p>
        <p>
          <Link href="/zamowienie-specjalne" className="text-sm underline underline-offset-4">
            Większe zamówienie?
          </Link>
        </p>
      </div>

      <DayPicker dates={pickupDates} selected={selectedDay} />

      {categoriesWithProducts.length > 0 ? (
        <CategoryNav
          categories={categoriesWithProducts.map((category) => ({
            name: category.name,
            slug: category.slug,
          }))}
        />
      ) : null}

      <div className="space-y-10">
        {categoriesWithProducts.map((category) => (
          <section key={category.id} id={category.slug} className="scroll-mt-32 space-y-4">
            <h2 className="text-2xl font-semibold">{category.name}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {category.products.map((product) => {
                const stock = availabilityByProduct.get(product.id);
                return (
                  <ProductCard
                    key={product.id}
                    productId={product.id}
                    name={product.name}
                    description={product.description}
                    allergens={product.allergens}
                    unitPriceGrosze={product.price_grosze}
                    imagePath={product.image_path}
                    day={selectedDay}
                    remaining={stock?.remaining ?? product.daily_cap_default}
                    isAvailable={stock?.is_available ?? true}
                    maxQtyPerItem={maxQtyPerItem}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <MobileCartBar />
    </div>
  );
}
