import Link from "next/link";

import { AdminDayPicker } from "@/components/admin/admin-day-picker";
import { MarkPointDeliveredButton } from "@/components/admin/mark-point-delivered-button";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { getNearestOrderDay, getPackagesData } from "@/lib/admin/queries";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl, formatTimeRange } from "@/lib/format";
import { Button } from "@/components/ui/button";

type PackagesPageProps = {
  searchParams: Promise<{ dzien?: string }>;
};

function packCountLabel(count: number): string {
  if (count === 1) {
    return "1 paczka";
  }
  const rest10 = count % 10;
  const rest100 = count % 100;
  if (rest10 >= 2 && rest10 <= 4 && (rest100 < 10 || rest100 >= 20)) {
    return `${count} paczki`;
  }
  return `${count} paczek`;
}

export default async function PackagesPage({ searchParams }: PackagesPageProps) {
  const params = await searchParams;
  const day =
    params.dzien && /^\d{4}-\d{2}-\d{2}$/.test(params.dzien)
      ? params.dzien
      : await getNearestOrderDay();
  const data = await getPackagesData(day);

  return (
    <div>
      <PageHeader title={`Paczki na ${formatDatePl(parseDateOnly(day))}`} />
      <AdminDayPicker selected={day} basePath="/admin/paczki" />

      {data.sections.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Brak paczek na ten dzień.</p>
      ) : (
        <div className="mt-8 space-y-10">
          {data.sections.map((section) => (
            <section key={section.point.id} className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">{section.point.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {formatTimeRange(section.point.pickup_from, section.point.pickup_to)} · {section.point.address}
                  </p>
                  <p className="pt-1 text-sm">{packCountLabel(section.packages.length)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="min-h-12">
                    <Link href={`/admin/paczki/drukuj?dzien=${day}&punkt=${section.point.id}`}>
                      Drukuj etykiety
                    </Link>
                  </Button>
                  <MarkPointDeliveredButton
                    day={day}
                    pointId={section.point.id}
                    pointName={section.point.name}
                    count={section.inProductionCount}
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[var(--adj-cream-dark)] bg-card">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--adj-cream-dark)]">
                      <th className="px-4 py-3 font-medium">Kod</th>
                      <th className="px-4 py-3 font-medium">Klient</th>
                      <th className="px-4 py-3 font-medium">Pozycje</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Uwaga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.packages.map((item) => (
                      <tr key={item.id} className="border-b border-[var(--adj-cream-dark)] last:border-0">
                        <td className="px-4 py-3 font-mono text-2xl font-semibold tracking-wide">
                          {item.pickupCode}
                        </td>
                        <td className="px-4 py-3">{item.customerName}</td>
                        <td className="px-4 py-3">{item.itemsSummary}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3">{item.note?.trim() || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
