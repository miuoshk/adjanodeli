import Image from "next/image";
import Link from "next/link";

import { SectionHeading } from "@/components/brand/section-heading";
import { AccountPickupPoints } from "@/components/shop/account-pickup-points";
import {
  CustomerOrderRow,
  OrderWaitingCard,
  type CustomerOrder,
} from "@/components/shop/customer-order-list";
import { LoyaltySection } from "@/components/shop/loyalty-section";
import { ProfileForm } from "@/components/shop/profile-form";
import { SignedInLine } from "@/components/shop/signed-in-line";
import { Button } from "@/components/ui/button";
import { getProfile, requireUser } from "@/lib/auth";
import { signOut } from "@/lib/auth-actions";
import { getLoyaltyStatus } from "@/lib/loyalty/status";
import { groupAccountOrders } from "@/lib/orders/account-groups";
import { createServerClient } from "@/lib/supabase/server";

const cardClass =
  "mt-6 rounded-[4px] border border-[rgba(43,42,31,0.18)] bg-[var(--adj-paper-light)] px-5 py-5 lg:px-6";

export default async function AccountPage() {
  const session = await requireUser("/konto");
  const supabase = await createServerClient();
  const [profile, loyalty, accessResult, ordersResult] = await Promise.all([
    getProfile(),
    getLoyaltyStatus(session.user.id),
    supabase
      .from("pickup_point_access")
      .select("granted_at, pickup_points(name)")
      .eq("user_id", session.user.id)
      .order("granted_at", { ascending: false }),
    supabase
      .from("orders")
      .select("*, pickup_points(*), order_items(product_name, qty, options)")
      .order("created_at", { ascending: false }),
  ]);

  const accesses = (accessResult.data ?? []).flatMap((row) => {
    const point = row.pickup_points as { name: string } | { name: string }[] | null;
    const name = Array.isArray(point) ? point[0]?.name : point?.name;
    if (!name) {
      return [];
    }
    return [{ name, grantedAt: row.granted_at }];
  });

  const orders = (ordersResult.data ?? []) as CustomerOrder[];
  const groups = groupAccountOrders(orders);
  const email = profile?.email ?? session.user.email ?? "";

  return (
    <div>
      <SectionHeading as="h1" eyebrow="Konto" title="Twoje konto" />
      {email ? <SignedInLine email={email} /> : null}
      <AccountOrders groups={groups} hasOrders={orders.length > 0} />
      {loyalty ? (
        <div className="mt-12">
          <LoyaltySection status={loyalty} />
        </div>
      ) : null}
      <AccountPickupPoints accesses={accesses} />
      <Link
        href="/konto/stale-zamowienia"
        className="mt-12 flex items-center justify-between gap-4 rounded-[4px] border border-[rgba(43,42,31,0.18)] bg-[var(--adj-paper-light)] px-5 py-5 lg:px-6"
      >
        <span>
          <span className="block font-heading text-[22px] font-medium">Stałe zamówienia</span>
          <span className="mt-1 block text-[15px] text-[var(--adj-ink-soft)]">
            Przypomnimy o 17:00 dzień wcześniej.
          </span>
        </span>
        <span className="adj-link shrink-0">Zarządzaj</span>
      </Link>
      <section className="mt-12">
        <SectionHeading as="h2" title="Twoje dane" />
        <div className={cardClass}>
          <ProfileForm
            fullName={profile?.full_name}
            phone={profile?.phone}
            marketingConsent={profile?.marketing_consent}
            next="/konto"
            submitLabel="Zapisz"
          />
        </div>
      </section>
      <form action={signOut} className="mt-6">
        <Button type="submit" variant="outline" size="lg" className="w-full md:w-auto">
          Wyloguj
        </Button>
      </form>
    </div>
  );
}

function AccountOrders({
  groups,
  hasOrders,
}: {
  groups: ReturnType<typeof groupAccountOrders<CustomerOrder>>;
  hasOrders: boolean;
}) {
  if (!hasOrders) {
    return (
      <section className="mt-10">
        <SectionHeading as="h2" title="Twoje zamówienia" />
        <div className="mt-8 flex flex-col items-start">
          <Image
            src="/brand/logo/znak-A-karmin.svg"
            alt=""
            width={512}
            height={512}
            className="h-auto w-16"
            unoptimized
          />
          <p className="mt-6 text-[16px]">Nie masz jeszcze zamówień.</p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/sklep">Przejdź do sklepu</Link>
          </Button>
        </div>
      </section>
    );
  }

  const cards = [
    ...groups.waiting.map((order) => ({ order, label: "Czeka na Ciebie" })),
    ...groups.preparing.map((order) => ({ order, label: "W przygotowaniu" })),
  ];

  return (
    <section className="mt-10">
      <SectionHeading as="h2" title="Twoje zamówienia" />
      {cards.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {cards.map(({ order, label }) => (
            <OrderWaitingCard key={order.id} order={order} label={label} />
          ))}
        </ul>
      ) : null}
      {groups.recent.length > 0 ? (
        <ul className="mt-8 border-t border-[var(--adj-ink)]">
          {groups.recent.map((order) => (
            <CustomerOrderRow key={order.id} order={order} />
          ))}
        </ul>
      ) : null}
      <Link href="/moje-zamowienia" className="adj-link mt-6 inline-block">
        Wszystkie zamówienia
      </Link>
    </section>
  );
}
