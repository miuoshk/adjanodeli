import { describe, expect, it } from "vitest";

import { isValidNip, normalizeNip } from "./nip";

describe("normalizeNip", () => {
  it("keeps only digits", () => {
    expect(normalizeNip("123-456-32-18")).toBe("1234563218");
    expect(normalizeNip("PL 123 456 32 18")).toBe("1234563218");
  });
});

describe("isValidNip", () => {
  it("accepts 10 digits with a valid checksum", () => {
    expect(isValidNip("1234563218")).toBe(true);
    expect(isValidNip("123-456-32-18")).toBe(true);
  });

  it("rejects wrong length", () => {
    expect(isValidNip("123456321")).toBe(false);
    expect(isValidNip("12345632180")).toBe(false);
    expect(isValidNip("")).toBe(false);
  });

  it("rejects a bad checksum", () => {
    expect(isValidNip("1234563217")).toBe(false);
  });

  it("rejects when modulo 11 is 10", () => {
    expect(isValidNip("1234567890")).toBe(false);
  });
});
