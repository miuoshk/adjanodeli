import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";

import { TestMail } from "@/lib/email/templates/test-mail";

describe("react-email render", () => {
  it("turns a mail template into html", async () => {
    const html = await render(TestMail({ ownerPhone: "32 000 00 00" }));

    expect(html).toContain("To jest testowy mail z panelu.");
    expect(html).toContain("tel. 32 000 00 00");
  });
});
