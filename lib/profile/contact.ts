const PHONE_DIGITS = /^(?:\+48)?\d{9}$/;

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) {
    return null;
  }
  const compact = phone.replace(/\s+/g, "");
  if (!PHONE_DIGITS.test(compact)) {
    return null;
  }
  return compact.startsWith("+48") ? compact : `+48${compact}`;
}

export function hasFullName(name: string | null | undefined): boolean {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2 && parts.every((part) => part.length >= 2);
}

export function contactComplete(profile: {
  role: string;
  full_name: string | null;
  phone: string | null;
}): boolean {
  if (profile.role !== "customer") {
    return true;
  }
  return hasFullName(profile.full_name) && normalizePhone(profile.phone) !== null;
}
