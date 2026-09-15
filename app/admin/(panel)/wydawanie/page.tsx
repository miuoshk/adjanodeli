import { HandoverScreen } from "@/components/admin/handover-screen";
import { AdminDayPicker } from "@/components/admin/admin-day-picker";
import { PageHeader } from "@/components/admin/page-header";
import { getHandoverPoints } from "@/lib/admin/queries";
import { parseDateOnly, warsawDateIso } from "@/lib/dates";
import { formatDatePl } from "@/lib/format";

type HandoverPageProps = {
  searchParams: Promise<{ dzien?: string }>;
};

export default async function HandoverPage({ searchParams }: HandoverPageProps) {
  const params = await searchParams;
  const day =
    params.dzien && /^\d{4}-\d{2}-\d{2}$/.test(params.dzien) ? params.dzien : warsawDateIso(0);
  const points = await getHandoverPoints();

  return (
    <div>
      <PageHeader title={`Wydawanie · ${formatDatePl(parseDateOnly(day))}`} />
      <div className="mb-6">
        <AdminDayPicker selected={day} basePath="/admin/wydawanie" />
      </div>
      <HandoverScreen day={day} points={points} />
    </div>
  );
}
