export const STAFF_PERMISSIONS = [
  "dashboard",
  "orders",
  "production",
  "packages",
  "handover",
  "special_requests",
] as const;

export type StaffPermission = (typeof STAFF_PERMISSIONS)[number];

export const ACCESS_LEVELS = ["view", "manage"] as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export type SectionChoice = "none" | AccessLevel;

export type SectionGrant = {
  section: StaffPermission;
  level: AccessLevel;
};

export const STAFF_PERMISSION_LABELS: Record<StaffPermission, string> = {
  dashboard: "Dziś",
  orders: "Zamówienia",
  production: "Produkcja",
  packages: "Paczki i etykiety",
  handover: "Wydawanie",
  special_requests: "Zamówienia specjalne",
};

const LEVEL_LABELS: Record<AccessLevel, string> = {
  view: "podgląd",
  manage: "pełny",
};

const SECTION_HREFS: Record<StaffPermission, string> = {
  dashboard: "/admin",
  orders: "/admin/zamowienia",
  production: "/admin/produkcja",
  packages: "/admin/paczki",
  handover: "/admin/wydawanie",
  special_requests: "/admin/zamowienia-specjalne",
};

function grantsFor(
  pairs: readonly (readonly [StaffPermission, AccessLevel])[],
): SectionGrant[] {
  return pairs.map(([section, level]) => ({ section, level }));
}

export const STAFF_PRESETS: readonly {
  id: string;
  label: string;
  grants: readonly SectionGrant[];
}[] = [
  {
    id: "podglad",
    label: "Podgląd i wydawanie",
    grants: grantsFor([
      ["dashboard", "view"],
      ["orders", "view"],
      ["production", "view"],
      ["packages", "view"],
      ["handover", "manage"],
    ]),
  },
  {
    id: "produkcja",
    label: "Produkcja i pakowanie",
    grants: grantsFor([
      ["dashboard", "view"],
      ["production", "manage"],
      ["packages", "manage"],
    ]),
  },
  {
    id: "kierowca",
    label: "Kierowca",
    grants: grantsFor([
      ["packages", "manage"],
      ["handover", "manage"],
    ]),
  },
  {
    id: "pelny",
    label: "Pełny dostęp pracownika",
    grants: grantsFor(STAFF_PERMISSIONS.map((section) => [section, "manage"] as const)),
  },
];

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

export function isAccessLevel(value: string): value is AccessLevel {
  return (ACCESS_LEVELS as readonly string[]).includes(value);
}

/** Bare keys from before levels count as full access. One entry per section; manage wins. */
export function encodeStaffPermissions(values: readonly string[]): string[] {
  const levels = new Map<StaffPermission, AccessLevel>();
  for (const value of values) {
    const [rawSection, rawLevel] = value.split(":");
    if (!rawSection || !isStaffPermission(rawSection)) {
      continue;
    }
    const level: AccessLevel = rawLevel === undefined ? "manage" : isAccessLevel(rawLevel) ? rawLevel : "view";
    if (rawLevel !== undefined && !isAccessLevel(rawLevel)) {
      continue;
    }
    const current = levels.get(rawSection);
    if (!current || level === "manage") {
      levels.set(rawSection, level);
    }
  }
  return STAFF_PERMISSIONS.flatMap((section) => {
    const level = levels.get(section);
    return level ? [`${section}:${level}`] : [];
  });
}

export function accessLevel(
  values: readonly string[],
  section: StaffPermission,
): AccessLevel | null {
  const encoded = encodeStaffPermissions(values);
  if (encoded.includes(`${section}:manage`)) {
    return "manage";
  }
  if (encoded.includes(`${section}:view`)) {
    return "view";
  }
  return null;
}

export function grantsFromPermissions(values: readonly string[]): SectionGrant[] {
  return STAFF_PERMISSIONS.flatMap((section) => {
    const level = accessLevel(values, section);
    return level ? [{ section, level }] : [];
  });
}

export function sectionsFromPermissions(values: readonly string[]): StaffPermission[] {
  return grantsFromPermissions(values).map((grant) => grant.section);
}

export function emptyChoices(): Record<StaffPermission, SectionChoice> {
  return {
    dashboard: "none",
    orders: "none",
    production: "none",
    packages: "none",
    handover: "none",
    special_requests: "none",
  };
}

export function choicesFromPermissions(
  values: readonly string[],
): Record<StaffPermission, SectionChoice> {
  const choices = emptyChoices();
  for (const grant of grantsFromPermissions(values)) {
    choices[grant.section] = grant.level;
  }
  return choices;
}

export function choicesFromGrants(grants: readonly SectionGrant[]): Record<StaffPermission, SectionChoice> {
  const choices = emptyChoices();
  for (const grant of grants) {
    choices[grant.section] = grant.level;
  }
  return choices;
}

export function permissionsFromChoices(choices: Record<StaffPermission, SectionChoice>): string[] {
  return STAFF_PERMISSIONS.flatMap((section) => {
    const choice = choices[section];
    return choice === "none" ? [] : [`${section}:${choice}`];
  });
}

export function permissionChip(section: StaffPermission, level: AccessLevel): string {
  return `${STAFF_PERMISSION_LABELS[section]}: ${LEVEL_LABELS[level]}`;
}

function levelCovers(held: AccessLevel, required: AccessLevel): boolean {
  if (held === "manage") {
    return true;
  }
  return required === "view";
}

export function canAccessSection(
  profile: SectionAccess | null | undefined,
  permission: StaffPermission,
  level: AccessLevel = "view",
): boolean {
  if (!profile?.is_active) {
    return false;
  }
  if (profile.role === "owner") {
    return true;
  }
  if (profile.role !== "staff") {
    return false;
  }
  const held = accessLevel(profile.staff_permissions, permission);
  return held !== null && levelCovers(held, level);
}

export function isViewOnly(
  profile: SectionAccess | null | undefined,
  permission: StaffPermission,
): boolean {
  return canAccessSection(profile, permission, "view") && !canAccessSection(profile, permission, "manage");
}

export function permissionsForNav(profile: SectionAccess | null | undefined): StaffPermission[] {
  if (!profile?.is_active) {
    return [];
  }
  if (profile.role === "owner") {
    return [...STAFF_PERMISSIONS];
  }
  return sectionsFromPermissions(profile.staff_permissions);
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
