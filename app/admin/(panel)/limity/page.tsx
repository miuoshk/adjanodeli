import Link from "next/link";

import { LimitsGridView } from "@/components/admin/limits-grid";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { addDaysIso, getDefaultLimitsFrom, getLimitsGrid } from "@/lib/admin/owner-queries";

type LimitsPageProps = {
  searchParams: Promise<{ od?: string }>;
};

export default async function LimitsPage({ searchParams }: LimitsPageProps) {
  await requireRole("owner", "/admin/limity");
  const params = await searchParams;
  const from =
    params.od && /^\d{4}-\d{2}-\d{2}$/.test(params.od) ? params.od : await getDefaultLimitsFrom();
  const grid = await getLimitsGrid(from);

  return (
    <div>
      <PageHeader title="Limity dzienne">
        <div className="flex gap-2">
          <Button asChild variant="outline" className="min-h-12">
            <Link href={`/admin/limity?od=${addDaysIso(from, -7)}`}>←</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-12">
            <Link href={`/admin/limity?od=${addDaysIso(from, 7)}`}>→</Link>
          </Button>
        </div>
      </PageHeader>
      <p className="mb-6 text-sm text-muted-foreground">
        Zmniejszenie limitu poniżej liczby już zarezerwowanej nie anuluje zamówień — blokuje tylko
        nowe.
      </p>
      <LimitsGridView grid={grid} />
    </div>
  );
}
