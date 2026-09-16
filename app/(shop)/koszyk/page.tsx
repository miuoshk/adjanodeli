import { CartView } from "@/components/shop/cart-view";
import { getProfile } from "@/lib/auth";
import { getLoyaltyStatus } from "@/lib/loyalty/status";
import { parseInvoiceDefaults } from "@/lib/orders/invoice";
import { createServerClient } from "@/lib/supabase/server";

export default async function CartPage() {
  const supabase = await createServerClient();

  const [datesResult, pointsResult, settingsResult, profile] = await Promise.all([
    supabase.rpc("available_pickup_dates"),
    supabase
      .from("pickup_points")
      .select("id, name, description, pickup_from, pickup_to, weekdays, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("settings").select("max_qty_per_item").eq("id", 1).single(),
    getProfile(),
  ]);

  const loyalty = profile ? await getLoyaltyStatus(profile.id) : null;
  const pickupDates = (datesResult.data ?? []).map((value) => value.slice(0, 10));

  return (
    <CartView
      pickupDates={pickupDates}
      pickupPoints={pointsResult.data ?? []}
      maxQtyPerItem={settingsResult.data?.max_qty_per_item ?? 15}
      isLoggedIn={Boolean(profile)}
      vouchers={loyalty?.vouchers ?? []}
      invoiceDefaults={parseInvoiceDefaults(profile?.invoice_defaults)}
    />
  );
}
