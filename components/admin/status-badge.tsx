import { orderStatusMeta } from "@/lib/orders/status-labels";

export function StatusBadge({ status }: { status: string }) {
  const meta = orderStatusMeta(status);
  return (
    <span
      className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{ color: meta.color, borderColor: meta.color }}
    >
      {meta.label}
    </span>
  );
}
