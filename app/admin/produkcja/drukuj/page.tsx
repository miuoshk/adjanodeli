import { PrintButton } from "@/components/admin/print-button";
import { ProductionTable } from "@/components/admin/production-table";
import { getNearestOrderDay, getProductionData } from "@/lib/admin/queries";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl } from "@/lib/format";

type ProductionPrintPageProps = {
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

export default async function ProductionPrintPage({ searchParams }: ProductionPrintPageProps) {
  const params = await searchParams;
  const day =
    params.dzien && /^\d{4}-\d{2}-\d{2}$/.test(params.dzien)
      ? params.dzien
      : await getNearestOrderDay();
  const data = await getProductionData(day);

  return (
    <div>
      <div className="print-toolbar">
        <div>
          <h1 className="print-title">Produkcja na {formatDatePl(parseDateOnly(day))}</h1>
          <p>{orderCountLabel(data.orderCount)}</p>
        </div>
        <PrintButton label="Drukuj" />
      </div>

      <ProductionTable data={data} variant="print" />

      <section className="print-notes">
        <h2>Uwagi klientów</h2>
        {data.notes.length === 0 ? (
          <p>Brak uwag.</p>
        ) : (
          <ul>
            {data.notes.map((item) => (
              <li key={item.orderNumber}>
                #{item.orderNumber}: {item.note}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
