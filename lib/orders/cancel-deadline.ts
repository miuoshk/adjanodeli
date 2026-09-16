import { TZDate } from "@date-fns/tz";

import { formatCutoff, parseDateOnly } from "@/lib/dates";
import { formatDatePl } from "@/lib/format";

export function customerCancelDeadline(pickupDate: string, cutoffTime: string): Date {
  const pickup = parseDateOnly(pickupDate);
  pickup.setDate(pickup.getDate() - 1);
  const [hourPart = "20", minutePart = "00"] = cutoffTime.split(":");
  return new TZDate(
    pickup.getFullYear(),
    pickup.getMonth(),
    pickup.getDate(),
    Number.parseInt(hourPart, 10),
    Number.parseInt(minutePart.slice(0, 2), 10),
    0,
    "Europe/Warsaw",
  );
}

export function formatCustomerCancelDeadline(pickupDate: string, cutoffTime: string): string {
  const pickup = parseDateOnly(pickupDate);
  pickup.setDate(pickup.getDate() - 1);
  const iso = `${pickup.getFullYear()}-${String(pickup.getMonth() + 1).padStart(2, "0")}-${String(pickup.getDate()).padStart(2, "0")}`;
  return `${formatDatePl(parseDateOnly(iso))} ${formatCutoff(cutoffTime)}`;
}
