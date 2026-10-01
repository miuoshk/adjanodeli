import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = join(process.cwd(), "supabase/migrations");

function productionSummarySql(): string {
  return [
    readFileSync(join(root, "0024_product_options.sql"), "utf8"),
    readFileSync(join(root, "0025_production_summary_jsonb.sql"), "utf8"),
  ].join("\n");
}

describe("production_summary SQL", () => {
  it("does not aggregate jsonb with max()", () => {
    const sql = productionSummarySql();
    expect(sql).not.toMatch(/max\s*\(\s*oa\.by_option\s*\)/);
    expect(sql).toMatch(/max\(oa\.by_option::text\)/);
  });
});
