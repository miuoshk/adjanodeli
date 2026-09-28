import Link from "next/link";

import { SectionHeading } from "@/components/brand/section-heading";
import {
  CustomerOrderRow,
  OrderWaitingCard,
  type CustomerOrder,
} from "@/components/shop/customer-order-list";
import { SignedInLine } from "@/components/shop/signed-in-line";
import { Button } from "@/components/ui/button";
import { getProfile, requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export default async function MyOrdersPage() {
  const session = await requireUser("/moje-zamowienia");
  const supabase = await createServerClient();
  const [profile, ordersResult] = await Promise.all([
    getProfile(),
    supabase.from("orders").select("*, pickup_points(*)").order("created_at", { ascending: false }),
  ]);

  const orders = (ordersResult.data ?? []) as CustomerOrder[];
  const waiting = orders.filter((order) => order.status === "delivered");
  const rest = orders.filter((order) => order.status !== "delivered");
  const email = profile?.email ?? session.user.email ?? "";

  return (
    <div>
      <SectionHeading as="h1" eyebrow="Konto" title="Zamówienia" />
      {email ? <SignedInLine email={email} /> : null}
      {orders.length === 0 ? (
        <div className="mt-8">
          <p className="text-[15px] text-[var(--adj-ink-soft)]">Nie masz jeszcze zamówień.</p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/sklep">Przejdź do sklepu</Link>
          </Button>
        </div>
      ) : (
        <>
          {waiting.length > 0 ? (
            <ul className="mt-8 space-y-4">
              {waiting.map((order) => (
                <OrderWaitingCard key={order.id} order={order} label="Czeka na Ciebie" />
              ))}
            </ul>
          ) : null}
          {rest.length > 0 ? (
            <ul className={`${waiting.length > 0 ? "mt-10" : "mt-8"} border-t border-[var(--adj-ink)]`}>
              {rest.map((order) => (
                <CustomerOrderRow key={order.id} order={order} />
              ))}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
}
