import { format } from "date-fns";
import { pl } from "date-fns/locale";

export function parseDateOnly(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function warsawDateIso(offsetDays = 0): string {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  if (offsetDays === 0) {
    return today;
  }

  const [year, month, day] = today.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + offsetDays)).toISOString().slice(0, 10);
}

export function formatDayChip(isoDate: string): string {
  const short = format(parseDateOnly(isoDate), "EEE d LLL", { locale: pl }).replaceAll(
    ".",
    "",
  );
  if (isoDate === warsawDateIso(1)) {
    return `jutro, ${short}`;
  }
  return short;
}

export function formatCutoff(time: string): string {
  const [hour = "00", minute = "00"] = time.split(":");
  return `${hour}:${minute.slice(0, 2)}`;
}

export function isoWeekday(isoDate: string): number {
  const weekday = parseDateOnly(isoDate).getDay();
  return weekday === 0 ? 7 : weekday;
}
