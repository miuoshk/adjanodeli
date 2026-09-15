import Link from "next/link";

import { AdminDayPicker } from "@/components/admin/admin-day-picker";
import { PageHeader } from "@/components/admin/page-header";
import { ProductionTable } from "@/components/admin/production-table";
import { getNearestOrderDay, getProductionData } from "@/lib/admin/queries";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl } from "@/lib/format";
import { Button } from "@/components/ui/button";

type ProductionPageProps = {
  searchParams: Promise<{ dzien?: string }>;
};

function orderCountLabel(count: number): string {
  if (count === 1) {
    return "1 zamówienie";
  }
  const rest10 = count % 10;
  const rest100 = count % 100;
  if (rest10 >= 2 && rest10 <= 4 && (rest100 < 10 || rest100 >= 20)) {
    return `${count} zamówienia`;
  }
  return `${count} zamówień`;
}

export default async function ProductionPage({ searchParams }: ProductionPageProps) {
  const params = await searchParams;
  const day =
    params.dzien && /^\d{4}-\d{2}-\d{2}$/.test(params.dzien)
      ? params.dzien
      : await getNearestOrderDay();
  const data = await getProductionData(day);

  return (
    <div>
      <PageHeader title={`Produkcja na ${formatDatePl(parseDateOnly(day))}`}>
        <p className="text-sm text-muted-foreground">{orderCountLabel(data.orderCount)}</p>
        <Button asChild className="min-h-12">
          <Link href={`/admin/produkcja/drukuj?dzien=${day}`}>Drukuj</Link>
        </Button>
      </PageHeader>

      <AdminDayPicker selected={day} basePath="/admin/produkcja" />

      <div className="mt-6">
        <ProductionTable data={data} variant="screen" />
      </div>
    </div>
  );
}
