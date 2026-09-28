import { describe, expect, it } from "vitest";

import { LABEL_FORMATS } from "./formats";
import { chunkForPages, fitLabelItems } from "./fit-label";
import { labelPrintCss } from "./print-css";

describe("fitLabelItems", () => {
  it("keeps a short list and folds a long one into the last line", () => {
    const names = Array.from({ length: 10 }, (_, index) => `p${index + 1}`);
    expect(fitLabelItems(names, 4)).toEqual({
      shown: ["p1", "p2", "p3"],
      more: 7,
    });
    expect(fitLabelItems(names.slice(0, 4), 4).more).toBe(0);
  });
});

describe("chunkForPages", () => {
  it("puts the ninth label on the second A4 sheet and one label on a roll page", () => {
    const labels = Array.from({ length: 9 }, (_, index) => index + 1);
    const a4 = chunkForPages(labels, LABEL_FORMATS.a4.perPage);
    expect(a4).toHaveLength(2);
    expect(a4[0]).toHaveLength(8);
    expect(a4[1]).toEqual([9]);
    expect(chunkForPages(labels.slice(0, 1), LABEL_FORMATS.etykieta.perPage)).toEqual([[1]]);
  });
});

describe("labelPrintCss", () => {
  it("emits only the selected page size", () => {
    const roll = labelPrintCss("etykieta", false);
    const sheet = labelPrintCss("a4", true);
    const plain = labelPrintCss("a4", false);

    expect(roll).toContain("size: 75mm 60mm");
    expect(roll).not.toContain("size: A4");
    expect(sheet).toContain("size: A4");
    expect(sheet).not.toContain("size: 75mm 60mm");
    expect(sheet).toContain("0.3mm dashed");
    expect(plain).not.toContain("0.3mm dashed");
  });
});
