import { describe, expect, it } from "vitest";

import { isValidEmailDomain, normalizeEmailDomain, parseEmailDomains } from "./email-domain";

describe("isValidEmailDomain", () => {
  it("accepts ordinary domains", () => {
    expect(isValidEmailDomain("mikolow.sr.gov.pl")).toBe(true);
    expect(isValidEmailDomain("adjano.pl")).toBe(true);
    expect(isValidEmailDomain("URZAD.MIKOLOW.PL")).toBe(true);
  });

  it("rejects incomplete or junk values", () => {
    expect(isValidEmailDomain("pl")).toBe(false);
    expect(isValidEmailDomain(".gov.pl")).toBe(false);
    expect(isValidEmailDomain("sr.gov.")).toBe(false);
    expect(isValidEmailDomain("not a domain")).toBe(false);
    expect(isValidEmailDomain("user@firma.pl")).toBe(false);
  });
});

describe("parseEmailDomains", () => {
  it("normalizes, skips blanks and de-duplicates", () => {
    expect(parseEmailDomains(["  @MikoLow.SR.gov.PL  ", "", "mikolow.sr.gov.pl"])).toEqual({
      ok: true,
      domains: ["mikolow.sr.gov.pl"],
    });
  });

  it("fails on a bad entry", () => {
    expect(parseEmailDomains(["adjano.pl", "nie"])).toEqual({ ok: false });
  });
});

describe("normalizeEmailDomain", () => {
  it("lowercases and strips a leading @", () => {
    expect(normalizeEmailDomain("  @Firma.PL ")).toBe("firma.pl");
  });
});
