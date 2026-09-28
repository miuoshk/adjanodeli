import { describe, expect, it } from "vitest";

import { arrivalConfirmLines, noticesFromLogs, stepsToArrived } from "./delivery-notices";

describe("stepsToArrived", () => {
  it("walks paid through production before delivered", () => {
    expect(stepsToArrived("paid")).toEqual(["in_production", "delivered"]);
    expect(stepsToArrived("in_production")).toEqual(["delivered"]);
    expect(stepsToArrived("delivered")).toEqual([]);
  });
});

describe("arrivalConfirmLines", () => {
  it("warns when production was not started", () => {
    expect(arrivalConfirmLines("Sąd", 2, "9:00", 2)).toEqual([
      "Klienci z punktu Sąd (2) dostaną maila, że paczki czekają do 9:00.",
      "2 z nich nie miało rozpoczętej produkcji, oznaczę je przy okazji.",
    ]);
  });
});

describe("noticesFromLogs", () => {
  it("keeps a sent row ahead of a later failure", () => {
    const notices = noticesFromLogs([
      { order_id: "a", status: "sent", created_at: "2026-09-29T06:00:00.000Z" },
      { order_id: "a", status: "failed", created_at: "2026-09-29T07:00:00.000Z" },
      { order_id: "b", status: "failed", created_at: "2026-09-29T07:00:00.000Z" },
    ]);

    expect(notices.get("a")).toEqual({
      sent: true,
      sentAt: "2026-09-29T06:00:00.000Z",
      failed: false,
    });
    expect(notices.get("b")?.failed).toBe(true);
  });
});
