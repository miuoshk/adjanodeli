import Link from "next/link";

import { SectionHeading } from "@/components/brand/section-heading";
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
    <div>
      <SectionHeading
        as="h1"
        eyebrow="Konto"
        title="Stałe zamówienia"
        description="Dzień wcześniej o\u00a017:00 przypomnimy Ci mailem. Z maila jednym kliknięciem przeniesiesz produkty do koszyka."
        action={
          <Link href="/konto" className="adj-link">
            Wróć do konta
          </Link>
        }
      />
      <div className="mt-8">
        <StandingOrdersManager
          orders={ordersResult.data ?? []}
          points={pointsResult.data ?? []}
        />
      </div>
    </div>
  );
}
