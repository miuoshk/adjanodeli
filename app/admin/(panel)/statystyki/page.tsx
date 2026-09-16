import { PageHeader } from "@/components/admin/page-header";
import { StatsCharts } from "@/components/admin/stats-charts";
import { StatsRangeForm } from "@/components/admin/stats-range-form";
import { requireRole } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { getOwnerStats, resolveStatsRange, selloutSuggestion } from "@/lib/admin/stats";

type Search = {
  od?: string;
  do?: string;
};

type PageProps = {
  searchParams: Promise<Search>;
};

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary p-4 text-secondary-foreground">
      <p className="text-sm">{label}</p>
      <p className="font-heading pt-1 text-3xl font-semibold leading-none">{value}</p>
    </div>
  );
}

function formatPct(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

export default async function AdminStatsPage({ searchParams }: PageProps) {
  await requireRole("owner", "/admin/statystyki");
  const params = await searchParams;
  const range = resolveStatsRange(params.od, params.do);
  const stats = await getOwnerStats(range);

  return (
    <div className="space-y-8">
      <PageHeader title="Statystyki" />
      <StatsRangeForm from={range.from} to={range.to} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Tile label="Przychód" value={formatPrice(stats.summary.revenueGrosze)} />
        <Tile label="Zamówienia" value={String(stats.summary.orderCount)} />
        <Tile label="Średnia wartość" value={formatPrice(stats.summary.avgOrderGrosze)} />
        <Tile label="Klienci" value={String(stats.summary.uniqueCustomers)} />
        <Tile label="Powracający" value={String(stats.summary.returningCustomers)} />
        <Tile label="Nieodebrane" value={String(stats.summary.uncollectedCount)} />
      </div>

      <StatsCharts revenueByDay={stats.revenueByDay} ordersByWeekday={stats.ordersByWeekday} />

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Top produkty</h2>
        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak sprzedaży w tym zakresie.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--adj-cream-dark)] bg-card">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--adj-cream-dark)]">
                  <th className="px-4 py-3 font-medium">Produkt</th>
                  <th className="px-4 py-3 font-medium">Szt.</th>
                  <th className="px-4 py-3 font-medium">Przychód</th>
                  <th className="px-4 py-3 font-medium">% wyprzedań</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((row) => (
                  <tr key={row.productId} className="border-b border-[var(--adj-cream-dark)] last:border-0">
                    <td className="px-4 py-3">{row.productName}</td>
                    <td className="px-4 py-3">{row.qty}</td>
                    <td className="px-4 py-3">{formatPrice(row.revenueGrosze)}</td>
                    <td className="px-4 py-3">{formatPct(row.selloutPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Punkty odbioru</h2>
        {stats.points.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak zamówień w tym zakresie.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--adj-cream-dark)] bg-card">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--adj-cream-dark)]">
                  <th className="px-4 py-3 font-medium">Punkt</th>
                  <th className="px-4 py-3 font-medium">Zamówienia</th>
                  <th className="px-4 py-3 font-medium">Przychód</th>
                  <th className="px-4 py-3 font-medium">% nieodebranych</th>
                </tr>
              </thead>
              <tbody>
                {stats.points.map((row) => (
                  <tr key={row.pickupPointId} className="border-b border-[var(--adj-cream-dark)] last:border-0">
                    <td className="px-4 py-3">{row.pointName}</td>
                    <td className="px-4 py-3">{row.orderCount}</td>
                    <td className="px-4 py-3">{formatPrice(row.revenueGrosze)}</td>
                    <td className="px-4 py-3">{formatPct(row.uncollectedPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Produkty, które regularnie się wyprzedają</h2>
        {stats.selloutAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            W ostatnich 14 dniach żaden produkt nie wyprzedał się regularnie.
          </p>
        ) : (
          <ul className="space-y-2">
            {stats.selloutAlerts.map((alert) => (
              <li
                key={alert.productId}
                className="rounded-xl border border-[var(--adj-cream-dark)] bg-card px-4 py-3 text-sm leading-relaxed"
              >
                {selloutSuggestion(alert)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
