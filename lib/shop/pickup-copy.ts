import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { isoWeekday, parseDateOnly } from "@/lib/dates";

// Indeks = ISO dzień tygodnia (1 = poniedziałek … 7 = niedziela).
const ACCUSATIVE = ["", "poniedziałek", "wtorek", "środę", "czwartek", "piątek", "sobotę", "niedzielę"];
const GENITIVE = ["", "poniedziałku", "wtorku", "środy", "czwartku", "piątku", "soboty", "niedzieli"];
const SHORT = ["", "pn", "wt", "śr", "czw", "pt", "sob", "nd"];

export function shiftIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export type PickupCopy = {
  /** Najbliższy dzień odbioru (YYYY-MM-DD) albo null, gdy baza nic nie zwróciła. */
  day: string | null;
  /** „poniedziałek, 28 września” */
  longDate: string | null;
  /** „pon., 28 września” */
  shortDate: string | null;
  /** „Zamów na poniedziałek” / „Zamów na jutro” / „Przejdź do sklepu” */
  cta: string;
  /** „Co pieczemy na poniedziałek” / „Co pieczemy” */
  menuHeading: string;
  /** „Polecamy na poniedziałek” / „Polecamy na jutro” / „Polecamy” */
  featuredHeading: string;
  /** „Na poniedziałek zamówisz do niedzieli, 20:00.” */
  deadline: string;
};

/**
 * Teksty landingu zależne od najbliższego dnia odbioru.
 * Dzień liczy baza (available_pickup_dates) — tu tylko go opisujemy.
 * Zamówienie na dzień D przyjmujemy do cutoff w dniu D-1 (tak liczy SQL dla lead_days = 1).
 */
export function buildPickupCopy(day: string | null, cutoff: string, todayIso: string): PickupCopy {
  if (!day) {
    return {
      day: null,
      longDate: null,
      shortDate: null,
      cta: "Przejdź do sklepu",
      menuHeading: "Co pieczemy",
      featuredHeading: "Polecamy",
      deadline: `Zamówienia przyjmujemy do ${cutoff} dzień przed odbiorem.`,
    };
  }

  const tomorrowIso = shiftIsoDate(todayIso, 1);
  const target = day === tomorrowIso ? "jutro" : ACCUSATIVE[isoWeekday(day)];
  const dayBefore = shiftIsoDate(day, -1);
  const until =
    dayBefore === todayIso
      ? `dziś do ${cutoff}`
      : dayBefore === tomorrowIso
        ? `do jutra, ${cutoff}`
        : `do ${GENITIVE[isoWeekday(dayBefore)]}, ${cutoff}`;
  const date = parseDateOnly(day);

  return {
    day,
    longDate: format(date, "EEEE, d MMMM", { locale: pl }),
    shortDate: format(date, "EEE, d MMMM", { locale: pl }),
    cta: `Zamów na ${target}`,
    menuHeading: `Co pieczemy na ${target}`,
    featuredHeading: `Polecamy na ${target}`,
    deadline: `Na ${target} zamówisz ${until}.`,
  };
}

/** [1,2,3,4,5] → „pn–pt”, [1,3,5] → „pn, śr, pt”, [1,2,3,4,5,6] → „pn–sob”. */
export function formatWeekdays(days: number[]): string {
  const sorted = [...new Set(days)].filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const d of sorted) {
    const last = groups.at(-1);
    if (last && d === last[last.length - 1] + 1) {
      last.push(d);
    } else {
      groups.push([d]);
    }
  }
  return groups
    .flatMap((g) =>
      g.length >= 3 ? [`${SHORT[g[0]]}\u2013${SHORT[g[g.length - 1]]}`] : g.map((d) => SHORT[d]),
    )
    .join(", ");
}
