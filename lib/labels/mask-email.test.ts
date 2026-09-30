import { describe, expect, it } from "vitest";

import { maskEmail } from "./mask-email";

describe("maskEmail", () => {
  it("keeps two characters, then bullets, then the domain", () => {
    expect(maskEmail("justyna@gmail.com")).toBe("ju•••@gmail.com");
    expect(maskEmail("abc@domena.pl")).toBe("ab•••@domena.pl");
  });

  it("uses one character when the local part is shorter than 3", () => {
    expect(maskEmail("ab@gmail.com")).toBe("a•••@gmail.com");
    expect(maskEmail("a@x.pl")).toBe("a•••@x.pl");
  });

  it("counts a Polish letter as one character", () => {
    expect(maskEmail("żółw@wp.pl")).toBe("żó•••@wp.pl");
  });

  it("leaves a value without a domain unchanged", () => {
    expect(maskEmail("bez-domeny")).toBe("bez-domeny");
    expect(maskEmail("  ju@  ")).toBe("ju@");
  });
});
