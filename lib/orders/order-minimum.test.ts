import { describe, expect, it } from "vitest";

import { belowMinimumMessage, minimumFromOrderError, orderMinimumGrosze } from "./order-minimum";

describe("orderMinimumGrosze", () => {
  it("keeps the shop floor when a point has no higher minimum", () => {
    expect(orderMinimumGrosze(undefined)).toBe(1000);
    expect(orderMinimumGrosze(null)).toBe(1000);
    expect(orderMinimumGrosze(1000)).toBe(1000);
    expect(orderMinimumGrosze(500)).toBe(1000);
  });

  it("uses the point minimum when it is higher", () => {
    expect(orderMinimumGrosze(8000)).toBe(8000);
  });
});

describe("belowMinimumMessage", () => {
  it("asks the office to place one order when the point minimum is higher", () => {
    expect(belowMinimumMessage(8000, false)).toBe(
      "Na ten punkt jedno zamówienie musi mieć min. 80,00 zł. Zbierzcie się i złóżcie je raz.",
    );
    expect(belowMinimumMessage(8000, true)).toBe(
      "Po rabacie na ten punkt zostaje za mało. Jedno zamówienie musi mieć min. 80,00 zł.",
    );
  });

  it("keeps the shop wording at 10 zł", () => {
    expect(belowMinimumMessage(1000, false)).toBe(
      "Dodaj jeszcze coś — zamówienie musi mieć min. 10,00 zł.",
    );
    expect(belowMinimumMessage(1000, true)).toBe(
      "Dodaj jeszcze produkt — po rabacie zamówienie musi mieć min. 10,00 zł.",
    );
  });
});

describe("minimumFromOrderError", () => {
  it("reads the amount from create_order", () => {
    expect(minimumFromOrderError("TOTAL_BELOW_MINIMUM:5000")).toBe(5000);
    expect(minimumFromOrderError("TOTAL_BELOW_MINIMUM")).toBe(1000);
  });
});
