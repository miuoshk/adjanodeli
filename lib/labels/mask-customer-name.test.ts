import { describe, expect, it } from "vitest";

import { maskCustomerName } from "./mask-customer-name";

describe("maskCustomerName", () => {
  it("keeps the first two letters of the given name and the surname", () => {
    expect(maskCustomerName("Anna Kowalska")).toBe("An** Ko******");
  });

  it("masks every word, including a middle name, and counts Polish letters as one", () => {
    expect(maskCustomerName("Stanisława Rurza Janosz")).toBe("St******** Ru*** Ja****");
  });

  it("leaves a one- or two-letter part unchanged", () => {
    expect(maskCustomerName("Li Wu")).toBe("Li Wu");
    expect(maskCustomerName("A Nowak")).toBe("A No***");
  });

  it("collapses extra spaces", () => {
    expect(maskCustomerName("  Jan   Kowalski  ")).toBe("Ja* Ko******");
  });
});
