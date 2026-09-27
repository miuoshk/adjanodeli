import Link from "next/link";

import { SectionHeading } from "@/components/brand/section-heading";
import { ApplyStandingCart } from "@/components/shop/apply-standing-cart";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { prepareStandingCart } from "@/lib/standing-orders/fill-cart";

type PageProps = {
  searchParams: Promise<{ s?: string; d?: string }>;
};

function StandingError({ message }: { message: string }) {
  return (
    <div>
      <SectionHeading
        as="h1"
        eyebrow="Stałe zamówienie"
        title="Nie udało się złożyć koszyka"
        description={message}
      />
      <Button asChild size="lg" className="mt-8">
        <Link href="/sklep">Przejdź do sklepu</Link>
      </Button>
    </div>
  );
}

export default async function OrderAsUsualPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const standingId = params.s ?? "";
  const day = params.d ?? "";
  await requireUser(`/zamow-jak-zwykle?s=${standingId}&d=${day}`);

  if (!standingId || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return <StandingError message="Brakuje stałego zamówienia albo dnia." />;
  }

  const result = await prepareStandingCart(standingId, day);
  if (!result.ok) {
    return <StandingError message={result.message} />;
  }

  if (result.items.length === 0) {
    const skipped =
      result.skipped.length > 0 ? ` Pominięte: ${result.skipped.join(", ")}.` : "";
    return <StandingError message={`Nic nie zostało na ten dzień.${skipped}`} />;
  }

  return (
    <ApplyStandingCart
      day={result.day}
      pickupPointId={result.pickupPointId}
      note={result.note}
      items={result.items}
      skipped={result.skipped}
    />
  );
}
