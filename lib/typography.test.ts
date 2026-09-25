import { describe, expect, it } from "vitest";

import { nbsp } from "./typography";

describe("nbsp", () => {
  it("skleja jednoliterowe słowa z następnym", () => {
    expect(nbsp("Deserki w kubeczkach")).toBe("Deserki w\u00A0kubeczkach");
    expect(nbsp("sałatka z serkiem i rukolą")).toBe("sałatka z\u00A0serkiem i\u00A0rukolą");
    expect(nbsp("chleb i w domu")).toBe("chleb i\u00A0w\u00A0domu");
    expect(nbsp("W pracy")).toBe("W\u00A0pracy");
  });

  it("nie rusza liter w środku słów ani skrótów", () => {
    expect(nbsp("Keto & Fit")).toBe("Keto & Fit");
    expect(nbsp("bajgiel drwala")).toBe("bajgiel drwala");
    expect(nbsp("KETO murzynek")).toBe("KETO murzynek");
  });
});
