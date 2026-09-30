import { describe, expect, it } from "vitest";

import { buildAdminOrderDays } from "./order-days";

describe("buildAdminOrderDays", () => {
  it("keeps today and tomorrow even when no order falls on them", () => {
    expect(buildAdminOrderDays("2026-09-30", "2026-10-01", [])).toEqual([
      { day: "2026-09-30", count: 0 },
      { day: "2026-10-01", count: 0 },
    ]);
  });

  it("counts orders, merges duplicates, and sorts ascending", () => {
    expect(
      buildAdminOrderDays("2026-09-30", "2026-10-01", [
        "2026-10-02",
        "2026-09-20",
        "2026-10-01",
        "2026-10-01",
        "2026-09-20",
      ]),
    ).toEqual([
      { day: "2026-09-20", count: 2 },
      { day: "2026-09-30", count: 0 },
      { day: "2026-10-01", count: 2 },
      { day: "2026-10-02", count: 1 },
    ]);
  });
});
