export const WEEKDAYS = [
  { value: 1, label: "pon" },
  { value: 2, label: "wt" },
  { value: 3, label: "śr" },
  { value: 4, label: "czw" },
  { value: 5, label: "pt" },
  { value: 6, label: "sob" },
  { value: 7, label: "niedz" },
] as const;

export const PRICE_RE = /^\d+,\d{2}$/;

export function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replaceAll("ł", "l")
    .replaceAll("Ł", "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function priceToGrosze(value: string): number {
  const [zloty, grosze] = value.split(",");
  return Number(zloty) * 100 + Number(grosze);
}

export function groszeToPriceInput(grosze: number): string {
  return (grosze / 100).toFixed(2).replace(".", ",");
}

export function timeInputValue(time: string): string {
  const [hour = "00", minute = "00"] = time.split(":");
  return `${hour.padStart(2, "0")}:${minute.slice(0, 2)}`;
}
