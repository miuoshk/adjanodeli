import Link from "next/link";

import { DashboardDayPicker } from "@/components/admin/dashboard-day-picker";
import { PageHeader } from "@/components/admin/page-header";
import { RefreshButton } from "@/components/admin/refresh-button";
import { StartProductionButton } from "@/components/admin/start-production-button";
import { getDashboardData } from "@/lib/admin/queries";
import { parseDateOnly, warsawDateIso } from "@/lib/dates";
import { formatDatePl, formatPrice } from "@/lib/format";
import { orderStatusMeta } from "@/lib/orders/status-labels";
import { Button } from "@/components/ui/button";

type AdminPageProps = {
  searchParams: Promise<{ dzien?: string }>;
};

function resolveDay(value: string | undefined): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return warsawDateIso(0);
}

function titleForDay(day: string): string {
  if (day === warsawDateIso(0)) {
    return "Dziś";
  }
  if (day === warsawDateIso(1)) {
    return "Jutro";
  }
  return formatDatePl(parseDateOnly(day));
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary p-4 text-secondary-foreground">
      <p className="text-sm">{label}</p>
      <p className="font-heading pt-1 text-3xl font-semibold leading-none">{value}</p>
    </div>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const day = resolveDay(params.dzien);
  const data = await getDashboardData(day);

  return (
    <div>
      <PageHeader title={titleForDay(day)}>
        <RefreshButton />
      </PageHeader>

      <DashboardDayPicker selected={day} />

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Opłacone zamówienia" value={String(data.paidOrderCount)} />
        <Tile label="Do produkcji" value={String(data.productionQty)} />
        <Tile label="Przychód dnia" value={formatPrice(data.revenueGrosze)} />
        <Tile label="Czeka na płatność" value={String(data.pendingPaymentCount)} />
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="text-2xl font-semibold">Paczki per punkt</h2>
        {data.points.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak punktów odbioru.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--adj-cream-dark)] bg-card">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--adj-cream-dark)]">
                  <th className="px-4 py-3 font-medium">Punkt</th>
                  <th className="px-4 py-3 font-medium">Zamówień</th>
                  <th className="px-4 py-3 font-medium">Odebranych</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.points.map((point) => (
                  <tr key={point.pointId} className="border-b border-[var(--adj-cream-dark)] last:border-0">
                    <td className="px-4 py-3">{point.name}</td>
                    <td className="px-4 py-3">{point.orderCount}</td>
                    <td className="px-4 py-3">{point.pickedUpCount}</td>
                    <td className="px-4 py-3">
                      {point.pickedUpCount}/{point.orderCount} odebrane
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-2xl font-semibold">Szybkie akcje</h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="min-h-12">
            <Link href={`/admin/produkcja?dzien=${day}`}>Zestawienie produkcyjne</Link>
          </Button>
          <StartProductionButton day={day} paidCount={data.paidReadyCount} />
          <Button asChild variant="outline" className="min-h-12">
            <Link href={`/admin/paczki?dzien=${day}`}>Lista paczek</Link>
          </Button>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-2xl font-semibold">Ostatnie zamówienia</h2>
        {data.recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nie ma jeszcze zamówień.</p>
        ) : (
          <ul className="space-y-2">
            {data.recentOrders.map((order) => {
              const meta = orderStatusMeta(order.status);
              return (
                <li key={order.id}>
                  <Link
                    href={`/zamowienie/${order.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">#{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDatePl(parseDateOnly(order.pickupDate))} · {order.pointName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatPrice(order.totalGrosze)}</p>
                      <p className="text-xs" style={{ color: meta.color }}>
                        {meta.label}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
