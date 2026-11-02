import { describe, expect, it } from "vitest";

import { contactComplete, hasFullName, normalizePhone } from "./contact";

describe("contact", () => {
  it("accepts a first and last name", () => {
    expect(hasFullName("Anna Kowalska")).toBe(true);
    expect(hasFullName("Anna")).toBe(false);
    expect(hasFullName("A Kowalska")).toBe(false);
  });

  it("stores a Polish mobile as +48 and nine digits", () => {
    expect(normalizePhone("500 123 456")).toBe("+48500123456");
    expect(normalizePhone("+48500123456")).toBe("+48500123456");
    expect(normalizePhone("12345")).toBe(null);
    expect(normalizePhone("")).toBe(null);
  });

  it("requires both fields only for customers", () => {
    expect(
      contactComplete({ role: "customer", full_name: "Anna Kowalska", phone: "500123456" }),
    ).toBe(true);
    expect(contactComplete({ role: "customer", full_name: "Anna", phone: "500123456" })).toBe(
      false,
    );
    expect(contactComplete({ role: "customer", full_name: "Anna Kowalska", phone: null })).toBe(
      false,
    );
    expect(contactComplete({ role: "owner", full_name: "Justyna", phone: null })).toBe(true);
  });
});
