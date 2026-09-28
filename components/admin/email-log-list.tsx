import type { OrderEmailLogRow } from "@/lib/admin/queries";
import { emailKindLabel, emailStatusLabel } from "@/lib/email/labels";

function formatMailTime(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Warsaw",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function EmailLogList({ rows }: { rows: OrderEmailLogRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Jeszcze żadnego maila.</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li
          key={row.id}
          className="rounded-xl border border-[var(--adj-cream-dark)] bg-card px-4 py-3 text-sm leading-relaxed"
        >
          <p className="font-medium">{emailKindLabel(row.kind)}</p>
          <p>{row.recipient}</p>
          <p>{formatMailTime(row.createdAt)}</p>
          <p>{emailStatusLabel(row.status)}</p>
          {row.status === "failed" && row.error ? (
            <p className="text-muted-foreground">{row.error}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
