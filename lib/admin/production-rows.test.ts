import { describe, expect, it } from "vitest";

import { buildProductionRows, optionBreakdown } from "./production-rows";

describe("optionBreakdown", () => {
  it("stays empty for null, a non-array, and an empty list", () => {
    expect(optionBreakdown(null)).toBe("");
    expect(optionBreakdown({})).toBe("");
    expect(optionBreakdown([])).toBe("");
  });

  it("joins option combinations", () => {
    expect(
      optionBreakdown([
        { label: "czosnkowy", qty: 3 },
        { label: "pomidorowy", qty: 2 },
      ]),
    ).toBe("czosnkowy 3 · pomidorowy 2");
  });
});

describe("buildProductionRows", () => {
  const products = [
    { id: "bread", sort_order: 1, categoryName: "Pieczywo", categorySort: 1 },
    { id: "sandwich", sort_order: 2, categoryName: "Kanapki", categorySort: 2 },
  ];

  it("keeps a product without options and one with a sauce breakdown", () => {
    const rows = buildProductionRows(
      [
        {
          product_id: "sandwich",
          product_name: "Kanapka z szynką",
          total_qty: 5,
          by_point: { "Piekarnia Adjano": 5 },
          by_option: [
            { label: "czosnkowy", qty: 3 },
            { label: "pomidorowy", qty: 2 },
          ],
        },
        {
          product_id: "bread",
          product_name: "Chleb żytni",
          total_qty: 1,
          by_point: { "Piekarnia Adjano": 1 },
          by_option: [],
        },
      ],
      products,
    );

    expect(rows.map((row) => row.productName)).toEqual(["Chleb żytni", "Kanapka z szynką"]);
    expect(rows[0]?.optionBreakdown).toBe("");
    expect(rows[1]?.optionBreakdown).toBe("czosnkowy 3 · pomidorowy 2");
  });

  it("treats a null breakdown as no options", () => {
    const rows = buildProductionRows(
      [
        {
          product_id: "bread",
          product_name: "Chleb żytni",
          total_qty: 2,
          by_point: null,
          by_option: null,
        },
      ],
      products,
    );

    expect(rows[0]?.optionBreakdown).toBe("");
    expect(rows[0]?.byPoint).toEqual({});
    expect(rows[0]?.categoryName).toBe("Pieczywo");
  });
});
