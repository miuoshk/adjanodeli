import { CartView } from "@/components/shop/cart-view";
import { getProfile } from "@/lib/auth";
import { formatCutoff } from "@/lib/dates";
import { getLoyaltyStatus } from "@/lib/loyalty/status";
import { parseInvoiceDefaults } from "@/lib/orders/invoice";
import { createServerClient } from "@/lib/supabase/server";

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ kod?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerClient();

  const [datesResult, pointsResult, settingsResult, profile] = await Promise.all([
    supabase.rpc("available_pickup_dates"),
    supabase
      .from("pickup_points")
      .select("id, name, address, description, pickup_from, pickup_to, weekdays, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("settings")
      .select("max_qty_per_item, cutoff_time, require_point_code")
      .eq("id", 1)
      .single(),
    getProfile(),
  ]);

  if (datesResult.error) {
    console.error("available_pickup_dates", datesResult.error.message);
  }
  if (pointsResult.error) {
    console.error("pickup_points", pointsResult.error.message);
  }
  if (settingsResult.error) {
    console.error("settings", settingsResult.error.message);
  }

  const loyalty = profile ? await getLoyaltyStatus(profile.id) : null;
  const pickupDates = (datesResult.data ?? []).map((value) => value.slice(0, 10));
  const requirePointCode = settingsResult.data?.require_point_code ?? true;
  let pickupPoints = pointsResult.data ?? [];

  if (requirePointCode && profile?.role !== "owner") {
    if (!profile) {
      pickupPoints = [];
    } else {
      const accessResult = await supabase
        .from("pickup_point_access")
        .select("pickup_point_id")
        .eq("user_id", profile.id);
      if (accessResult.error) {
        console.error("pickup_point_access", accessResult.error.message);
        pickupPoints = [];
      } else {
        const allowed = new Set((accessResult.data ?? []).map((row) => row.pickup_point_id));
        pickupPoints = pickupPoints.filter((point) => allowed.has(point.id));
      }
    }
  }

  return (
    <CartView
      pickupDates={pickupDates}
      pickupPoints={pickupPoints}
      maxQtyPerItem={settingsResult.data?.max_qty_per_item ?? 15}
      cutoff={
        settingsResult.data?.cutoff_time
          ? formatCutoff(String(settingsResult.data.cutoff_time))
          : "20:00"
      }
      isLoggedIn={Boolean(profile)}
      vouchers={loyalty?.vouchers ?? []}
      invoiceDefaults={parseInvoiceDefaults(profile?.invoice_defaults)}
      requirePointCode={requirePointCode}
      pendingCode={params.kod ?? null}
    />
  );
}
