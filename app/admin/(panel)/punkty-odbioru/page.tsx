import Link from "next/link";

import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getOwnerPoints } from "@/lib/admin/owner-queries";
import { formatTimeRange } from "@/lib/format";
import { WEEKDAYS } from "@/lib/admin/catalog";

export default async function PickupPointsPage() {
  await requireRole("owner", "/admin/punkty-odbioru");
  const points = await getOwnerPoints();

  return (
    <div>
      <PageHeader title="Punkty odbioru">
        <Button asChild className="min-h-12">
          <Link href="/admin/punkty-odbioru/nowy">Nowy punkt</Link>
        </Button>
      </PageHeader>

      {points.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nie ma jeszcze punktów.</p>
      ) : (
        <>
        <ul className="space-y-3 md:hidden">
          {points.map((point) => (
            <li
              key={point.id}
              className="space-y-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4"
            >
              <p className="font-medium">{point.name}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {point.address}
                <br />
                {formatTimeRange(point.pickup_from, point.pickup_to)} ·{" "}
                {WEEKDAYS.filter((day) => point.weekdays.includes(day.value))
                  .map((day) => day.label)
                  .join(", ")}
              </p>
              <p className="text-sm text-muted-foreground">
                {point.is_active ? "aktywny" : "nieaktywny"} · odblokowania: {point.unlockCount}
              </p>
              <Button asChild variant="outline" className="min-h-12 w-full">
                <Link href={`/admin/punkty-odbioru/${point.id}`}>Edytuj</Link>
              </Button>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-xl border border-[var(--adj-cream-dark)] bg-card md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--adj-cream-dark)]">
                <th className="px-4 py-3 font-medium">Nazwa</th>
                <th className="px-4 py-3 font-medium">Adres</th>
                <th className="px-4 py-3 font-medium">Okno</th>
                <th className="px-4 py-3 font-medium">Dni</th>
                <th className="px-4 py-3 font-medium">Aktywny</th>
                <th className="px-4 py-3 font-medium">Odblokowania</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.id} className="border-b border-[var(--adj-cream-dark)] last:border-0">
                  <td className="px-4 py-3 font-medium">{point.name}</td>
                  <td className="px-4 py-3">{point.address}</td>
                  <td className="px-4 py-3">{formatTimeRange(point.pickup_from, point.pickup_to)}</td>
                  <td className="px-4 py-3">
                    {WEEKDAYS.filter((day) => point.weekdays.includes(day.value))
                      .map((day) => day.label)
                      .join(", ")}
                  </td>
                  <td className="px-4 py-3">{point.is_active ? "tak" : "nie"}</td>
                  <td className="px-4 py-3">{point.unlockCount}</td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="outline" className="min-h-10">
                      <Link href={`/admin/punkty-odbioru/${point.id}`}>Edytuj</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
