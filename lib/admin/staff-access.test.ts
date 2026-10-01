import { describe, expect, it } from "vitest";

import {
  STAFF_PERMISSIONS,
  STAFF_PRESETS,
  accessLevel,
  canAccessSection,
  encodeStaffPermissions,
  firstAllowedSection,
  generateTempPassword,
  landingAfterLogin,
  tempPasswordCharsetOk,
} from "@/lib/admin/staff-access";

const staff = {
  role: "staff",
  is_active: true,
  staff_permissions: ["dashboard:manage", "production:manage", "packages:manage"],
};

describe("canAccessSection", () => {
  it("lets an owner into every section at both levels", () => {
    const owner = { role: "owner", is_active: true, staff_permissions: [] as string[] };
    for (const permission of STAFF_PERMISSIONS) {
      expect(canAccessSection(owner, permission, "view")).toBe(true);
      expect(canAccessSection(owner, permission, "manage")).toBe(true);
    }
  });

  it("treats a key without a level as full access", () => {
    const legacy = {
      role: "staff",
      is_active: true,
      staff_permissions: ["dashboard", "production", "packages"],
    };
    expect(canAccessSection(legacy, "production", "manage")).toBe(true);
    expect(canAccessSection(legacy, "handover", "view")).toBe(false);
    expect(encodeStaffPermissions(legacy.staff_permissions)).toEqual([
      "dashboard:manage",
      "production:manage",
      "packages:manage",
    ]);
  });

  it("lets view open the section and blocks changes", () => {
    const preview = {
      role: "staff",
      is_active: true,
      staff_permissions: ["orders:view", "handover:manage"],
    };
    expect(canAccessSection(preview, "orders", "view")).toBe(true);
    expect(canAccessSection(preview, "orders", "manage")).toBe(false);
    expect(canAccessSection(preview, "handover", "view")).toBe(true);
    expect(canAccessSection(preview, "handover", "manage")).toBe(true);
    expect(canAccessSection(preview, "production", "view")).toBe(false);
  });

  it("lets manage satisfy a view check", () => {
    expect(accessLevel(staff.staff_permissions, "production")).toBe("manage");
    expect(canAccessSection(staff, "production", "view")).toBe(true);
    expect(canAccessSection(staff, "production", "manage")).toBe(true);
  });

  it("blocks an inactive account", () => {
    expect(canAccessSection({ ...staff, is_active: false }, "production", "view")).toBe(false);
    expect(canAccessSection({ ...staff, is_active: false }, "production", "manage")).toBe(false);
    expect(
      canAccessSection({ role: "owner", is_active: false, staff_permissions: [] }, "dashboard", "view"),
    ).toBe(false);
  });
});

describe("landing", () => {
  it("sends a new password to the account page", () => {
    expect(landingAfterLogin({ ...staff, must_change_password: true }, "/admin/paczki")).toBe(
      "/admin/konto",
    );
  });

  it("opens the first allowed section when Dziś is missing", () => {
    const driver = {
      role: "staff",
      is_active: true,
      staff_permissions: ["packages:view", "handover:manage"],
    };
    expect(landingAfterLogin(driver, "/admin")).toBe("/admin/paczki");
    expect(firstAllowedSection(driver)).toBe("/admin/paczki");
  });
});

describe("presets and temporary passwords", () => {
  it("keeps one level per section", () => {
    for (const preset of STAFF_PRESETS) {
      const sections = preset.grants.map((grant) => grant.section);
      expect(new Set(sections).size).toBe(sections.length);
      expect(preset.grants.every((grant) => STAFF_PERMISSIONS.includes(grant.section))).toBe(true);
    }
    const preview = STAFF_PRESETS.find((preset) => preset.id === "podglad");
    expect(preview?.grants.find((grant) => grant.section === "handover")?.level).toBe("manage");
    expect(preview?.grants.find((grant) => grant.section === "orders")?.level).toBe("view");
  });

  it("builds a 12-character password without confusing glyphs", () => {
    const password = generateTempPassword();
    expect(tempPasswordCharsetOk(password)).toBe(true);
  });
});
