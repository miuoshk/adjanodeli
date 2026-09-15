import { format } from "date-fns";
import { pl } from "date-fns/locale";

function formatHourMinute(time: string): string {
  const [hourPart, minutePart] = time.split(":");
  const hour = Number.parseInt(hourPart, 10);
  const minute = minutePart?.slice(0, 2) ?? "00";
  return `${hour}:${minute}`;
}

export function formatPrice(grosze: number): string {
  const zloty = grosze / 100;
  return `${zloty.toFixed(2).replace(".", ",")} zł`;
}

export function formatDatePl(date: string | Date): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const formatted = format(value, "EEEE, d MMMM", { locale: pl });
  return formatted.charAt(0).toLowerCase() + formatted.slice(1);
}

export function formatTimeRange(from: string, to: string): string {
  return `${formatHourMinute(from)}–${formatHourMinute(to)}`;
}
