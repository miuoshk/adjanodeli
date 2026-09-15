import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders/status-labels";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OrdersFiltersProps = {
  dates: string[];
  points: { id: string; name: string }[];
  day: string;
  pointId: string;
  statuses: string[];
  q: string;
};

const STATUS_OPTIONS = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export function OrdersFilters({
  dates,
  points,
  day,
  pointId,
  statuses,
  q,
}: OrdersFiltersProps) {
  return (
    <form method="get" className="space-y-4 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="dzien">Dzień</Label>
          <select
            id="dzien"
            name="dzien"
            defaultValue={day}
            className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 text-base"
          >
            <option value="wszystkie">Wszystkie</option>
            {dates.map((value) => (
              <option key={value} value={value}>
                {formatDatePl(parseDateOnly(value))}
              </option>
            ))}
            {day !== "wszystkie" && !dates.includes(day) ? (
              <option value={day}>{formatDatePl(parseDateOnly(day))}</option>
            ) : null}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="punkt">Punkt</Label>
          <select
            id="punkt"
            name="punkt"
            defaultValue={pointId}
            className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 text-base"
          >
            <option value="">Wszystkie</option>
            {points.map((point) => (
              <option key={point.id} value={point.id}>
                {point.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="q">Szukaj</Label>
          <Input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="numer, nazwisko, telefon, kod"
            className="h-12"
          />
        </div>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Status</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {STATUS_OPTIONS.map((status) => (
            <label key={status} className="flex min-h-10 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="status"
                value={status}
                defaultChecked={statuses.includes(status)}
                className="size-4"
              />
              {ORDER_STATUS_LABELS[status].label}
            </label>
          ))}
        </div>
      </fieldset>
      <Button type="submit" className="min-h-12">
        Pokaż
      </Button>
    </form>
  );
}
