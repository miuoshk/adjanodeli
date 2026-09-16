import { parseStandingItems } from "@/lib/standing-orders/items";
import { createServerClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/store/cart";

export type FillStandingCartResult =
  | {
      ok: true;
      day: string;
      pickupPointId: string;
      note: string;
      items: CartItem[];
      skipped: string[];
    }
  | { ok: false; message: string };

export async function prepareStandingCart(
  standingId: string,
  day: string,
): Promise<FillStandingCartResult> {
  const supabase = await createServerClient();

  const [standingResult, datesResult, settingsResult] = await Promise.all([
    supabase
      .from("standing_orders")
      .select("id, pickup_point_id, items, note")
      .eq("id", standingId)
      .maybeSingle(),
    supabase.rpc("available_pickup_dates"),
    supabase.from("settings").select("max_qty_per_item").eq("id", 1).single(),
  ]);

  if (!standingResult.data) {
    return { ok: false, message: "Nie ma takiego stałego zamówienia." };
  }

  const pickupDates = (datesResult.data ?? []).map((value) => value.slice(0, 10));
  if (!pickupDates.includes(day)) {
    return { ok: false, message: "Ten dzień już nie jest dostępny." };
  }

  const wanted = parseStandingItems(standingResult.data.items);
  if (wanted.length === 0) {
    return { ok: false, message: "To stałe zamówienie jest puste." };
  }

  const maxQty = settingsResult.data?.max_qty_per_item ?? 15;
  const { data: availability } = await supabase.rpc("product_availability", { p_day: day });
  const stockById = new Map((availability ?? []).map((row) => [row.product_id, row]));

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_grosze, is_active")
    .in(
      "id",
      wanted.map((item) => item.product_id),
    );

  const productById = new Map((products ?? []).map((product) => [product.id, product]));
  const items: CartItem[] = [];
  const skipped: string[] = [];

  for (const line of wanted) {
    const product = productById.get(line.product_id);
    const stock = stockById.get(line.product_id);
    if (!product?.is_active || !stock?.is_available || stock.remaining <= 0) {
      skipped.push(product?.name ?? "produkt");
      continue;
    }

    const qty = Math.min(line.qty, stock.remaining, maxQty);
    items.push({
      productId: product.id,
      name: product.name,
      unitPriceGrosze: product.price_grosze,
      qty,
    });
    if (qty < line.qty) {
      skipped.push(`${product.name} (zostało ${qty})`);
    }
  }

  return {
    ok: true,
    day,
    pickupPointId: standingResult.data.pickup_point_id,
    note: standingResult.data.note ?? "",
    items,
    skipped,
  };
}
