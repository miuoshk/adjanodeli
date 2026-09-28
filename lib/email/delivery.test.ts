import { describe, expect, it } from "vitest";

import { decideEmailSend } from "./delivery";

describe("decideEmailSend", () => {
  it("sends when this kind has not gone out yet", () => {
    expect(decideEmailSend(false)).toBe("send");
    expect(decideEmailSend(false, true)).toBe("send");
  });

  it("skips a second send of the same kind", () => {
    expect(decideEmailSend(true)).toBe("skip");
  });

  it("sends again when forced, even if a sent row exists", () => {
    expect(decideEmailSend(true, true)).toBe("send");
  });
});
