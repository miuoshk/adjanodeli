import Link from "next/link";

import { ApplyStandingCart } from "@/components/shop/apply-standing-cart";
import { requireUser } from "@/lib/auth";
import { prepareStandingCart } from "@/lib/standing-orders/fill-cart";

type PageProps = {
  searchParams: Promise<{ s?: string; d?: string }>;
};

export default async function OrderAsUsualPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const standingId = params.s ?? "";
  const day = params.d ?? "";
  await requireUser(`/zamow-jak-zwykle?s=${standingId}&d=${day}`);

  if (!standingId || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">Nie da się złożyć koszyka</h1>
        <p>Brakuje stałego zamówienia albo dnia.</p>
        <p>
          <Link href="/sklep" className="underline underline-offset-4">
            Do menu
          </Link>
        </p>
      </div>
    );
  }

  const result = await prepareStandingCart(standingId, day);
  if (!result.ok) {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">Nie da się złożyć koszyka</h1>
        <p>{result.message}</p>
        <p>
          <Link href="/sklep" className="underline underline-offset-4">
            Do menu
          </Link>
        </p>
      </div>
    );
  }

  if (result.items.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">Nic nie zostało na ten dzień</h1>
        {result.skipped.length > 0 ? <p>Pominięte: {result.skipped.join(", ")}.</p> : null}
        <p>
          <Link href="/sklep" className="underline underline-offset-4">
            Do menu
          </Link>
        </p>
      </div>
    );
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
