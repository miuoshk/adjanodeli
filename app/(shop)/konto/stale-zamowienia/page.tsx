import Link from "next/link";

import { StandingOrdersManager } from "@/components/shop/standing-orders-manager";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export default async function StandingOrdersPage() {
  const session = await requireUser("/konto/stale-zamowienia");
  const supabase = await createServerClient();

  const [ordersResult, pointsResult] = await Promise.all([
    supabase
      .from("standing_orders")
      .select("id, name, pickup_point_id, weekdays, is_active")
      .eq("user_id", session.user.id)
      .order("created_at"),
    supabase
      .from("pickup_points")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <p>
        <Link href="/konto" className="text-sm underline underline-offset-4">
          Wróć do konta
        </Link>
      </p>
      <h1 className="text-3xl font-semibold">Stałe zamówienia</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Max 3. Nowe zapiszesz z opłaconego zamówienia.
      </p>
      <StandingOrdersManager
        orders={ordersResult.data ?? []}
        points={pointsResult.data ?? []}
      />
    </div>
  );
}
