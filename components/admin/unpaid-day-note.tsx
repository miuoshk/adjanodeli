import { unpaidDayLabel } from "@/lib/admin/order-days";

export function UnpaidDayNote({ count }: { count: number }) {
  const label = unpaidDayLabel(count);
  if (!label) {
    return null;
  }
  return <p className="text-sm">{label}</p>;
}
