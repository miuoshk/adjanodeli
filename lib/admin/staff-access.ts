export const STAFF_PERMISSIONS = [
  "dashboard",
  "orders",
  "production",
  "packages",
  "handover",
  "special_requests",
] as const;

export type StaffPermission = (typeof STAFF_PERMISSIONS)[number];

export const STAFF_PERMISSION_LABELS: Record<StaffPermission, string> = {
  dashboard: "Dziś",
  orders: "Zamówienia",
  production: "Produkcja",
  packages: "Paczki i etykiety",
  handover: "Wydawanie",
  special_requests: "Zamówienia specjalne",
};

const SECTION_HREFS: Record<StaffPermission, string> = {
  dashboard: "/admin",
  orders: "/admin/zamowienia",
  production: "/admin/produkcja",
  packages: "/admin/paczki",
  handover: "/admin/wydawanie",
  special_requests: "/admin/zamowienia-specjalne",
};

export const STAFF_PRESETS = [
  {
    id: "produkcja",
    label: "Produkcja i pakowanie",
    permissions: ["dashboard", "production", "packages"] as const,
  },
  {
    id: "kierowca",
    label: "Kierowca",
    permissions: ["packages", "handover"] as const,
  },
  {
    id: "pelny",
    label: "Pełny dostęp pracownika",
    permissions: STAFF_PERMISSIONS,
  },
] as const;

export const TEMP_PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

const FORBIDDEN_PASSWORD_CHARS = ["0", "O", "l", "1", "I"] as const;

export type SectionAccess = {
  role: string;
  is_active: boolean;
  staff_permissions: readonly string[];
  must_change_password?: boolean;
};

export function isStaffPermission(value: string): value is StaffPermission {
  return (STAFF_PERMISSIONS as readonly string[]).includes(value);
}

export function normalizePermissions(values: readonly string[]): StaffPermission[] {
  const selected = new Set(values.filter(isStaffPermission));
  return STAFF_PERMISSIONS.filter((item) => selected.has(item));
}

export function canAccessSection(
  profile: SectionAccess | null | undefined,
  permission: StaffPermission,
): boolean {
  if (!profile?.is_active) {
    return false;
  }
  if (profile.role === "owner") {
    return true;
  }
  return profile.role === "staff" && profile.staff_permissions.includes(permission);
}

export function permissionsForNav(profile: SectionAccess | null | undefined): StaffPermission[] {
  if (!profile?.is_active) {
    return [];
  }
  if (profile.role === "owner") {
    return [...STAFF_PERMISSIONS];
  }
  return normalizePermissions(profile.staff_permissions);
}

export function firstAllowedSection(profile: SectionAccess | null | undefined): string {
  for (const permission of STAFF_PERMISSIONS) {
    if (canAccessSection(profile, permission)) {
      return SECTION_HREFS[permission];
    }
  }
  return "/admin/brak-dostepu";
}

export function landingAfterLogin(profile: SectionAccess, requestedPath: string): string {
  if (profile.must_change_password) {
    return "/admin/konto";
  }
  if (requestedPath === "/admin" && !canAccessSection(profile, "dashboard")) {
    return firstAllowedSection(profile);
  }
  return requestedPath;
}

export function generateTempPassword(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => TEMP_PASSWORD_ALPHABET[byte % TEMP_PASSWORD_ALPHABET.length]).join(
    "",
  );
}

export function tempPasswordCharsetOk(password: string): boolean {
  if (password.length !== 12) {
    return false;
  }
  for (const char of password) {
    if (!TEMP_PASSWORD_ALPHABET.includes(char) || FORBIDDEN_PASSWORD_CHARS.some((item) => item === char)) {
      return false;
    }
  }
  return true;
}
