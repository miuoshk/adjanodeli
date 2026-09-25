import { describe, expect, it } from "vitest";

import { buildPickupCopy, formatWeekdays, shiftIsoDate } from "./pickup-copy";

describe("buildPickupCopy", () => {
  it("piątek przed 20:00 → odbiór w poniedziałek, zamówienie do niedzieli", () => {
    const copy = buildPickupCopy("2026-09-28", "20:00", "2026-09-25");
    expect(copy.longDate).toBe("poniedziałek, 28 września");
    expect(copy.shortDate).toBe("pon., 28 września");
    expect(copy.cta).toBe("Zamów na poniedziałek");
    expect(copy.menuHeading).toBe("Co pieczemy na poniedziałek");
    expect(copy.featuredHeading).toBe("Polecamy na poniedziałek");
    expect(copy.deadline).toBe("Na poniedziałek zamówisz do niedzieli, 20:00.");
  });

  it("wtorek przed cutoff → na jutro, dziś do 20:00", () => {
    const copy = buildPickupCopy("2026-09-30", "20:00", "2026-09-29");
    expect(copy.cta).toBe("Zamów na jutro");
    expect(copy.menuHeading).toBe("Co pieczemy na jutro");
    expect(copy.featuredHeading).toBe("Polecamy na jutro");
    expect(copy.deadline).toBe("Na jutro zamówisz dziś do 20:00.");
  });

  it("wtorek po cutoff → na czwartek, do jutra", () => {
    const copy = buildPickupCopy("2026-10-01", "20:00", "2026-09-29");
    expect(copy.cta).toBe("Zamów na czwartek");
    expect(copy.deadline).toBe("Na czwartek zamówisz do jutra, 20:00.");
  });

  it("odmienia środę, sobotę i niedzielę", () => {
    expect(buildPickupCopy("2026-09-30", "20:00", "2026-09-25").cta).toBe("Zamów na środę");
    expect(buildPickupCopy("2026-10-03", "20:00", "2026-09-29").cta).toBe("Zamów na sobotę");
    expect(buildPickupCopy("2026-10-01", "20:00", "2026-09-28").deadline).toBe(
      "Na czwartek zamówisz do środy, 20:00.",
    );
  });

  it("bez dnia z bazy → teksty ogólne", () => {
    const copy = buildPickupCopy(null, "20:00", "2026-09-25");
    expect(copy.cta).toBe("Przejdź do sklepu");
    expect(copy.menuHeading).toBe("Co pieczemy");
    expect(copy.featuredHeading).toBe("Polecamy");
    expect(copy.longDate).toBeNull();
  });
});

describe("formatWeekdays", () => {
  it("zwija ciągi od trzech dni", () => {
    expect(formatWeekdays([1, 2, 3, 4, 5])).toBe("pn\u2013pt");
    expect(formatWeekdays([6, 1, 2, 3, 4, 5])).toBe("pn\u2013sob");
    expect(formatWeekdays([1, 3, 5])).toBe("pn, śr, pt");
    expect(formatWeekdays([1, 2])).toBe("pn, wt");
  });
});

describe("shiftIsoDate", () => {
  it("przesuwa daty przez granice miesiąca", () => {
    expect(shiftIsoDate("2026-09-30", 1)).toBe("2026-10-01");
    expect(shiftIsoDate("2026-03-01", -1)).toBe("2026-02-28");
  });
});
