import { describe, expect, it } from "vitest";

import {
  STAFF_PERMISSIONS,
  STAFF_PRESETS,
  canAccessSection,
  firstAllowedSection,
  generateTempPassword,
  landingAfterLogin,
  tempPasswordCharsetOk,
} from "@/lib/admin/staff-access";

const staff = {
  role: "staff",
  is_active: true,
  staff_permissions: ["dashboard", "production", "packages"],
};

describe("canAccessSection", () => {
  it("lets an owner into every section", () => {
    const owner = { role: "owner", is_active: true, staff_permissions: [] };
    for (const permission of STAFF_PERMISSIONS) {
      expect(canAccessSection(owner, permission)).toBe(true);
    }
  });

  it("lets staff in only with the permission", () => {
    expect(canAccessSection(staff, "production")).toBe(true);
    expect(canAccessSection(staff, "handover")).toBe(false);
  });

  it("blocks an inactive account", () => {
    expect(canAccessSection({ ...staff, is_active: false }, "production")).toBe(false);
    expect(
      canAccessSection({ role: "owner", is_active: false, staff_permissions: [] }, "dashboard"),
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
      staff_permissions: ["packages", "handover"],
    };
    expect(landingAfterLogin(driver, "/admin")).toBe("/admin/paczki");
    expect(firstAllowedSection(driver)).toBe("/admin/paczki");
  });
});

describe("presets and temporary passwords", () => {
  it("stores only the six section keys", () => {
    for (const preset of STAFF_PRESETS) {
      expect(preset.permissions.every((item) => STAFF_PERMISSIONS.includes(item))).toBe(true);
    }
  });

  it("builds a 12-character password without confusing glyphs", () => {
    const password = generateTempPassword();
    expect(tempPasswordCharsetOk(password)).toBe(true);
  });
});
