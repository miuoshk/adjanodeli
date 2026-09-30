import { normalizePermissions, type StaffPermission } from "@/lib/admin/staff-access";
import { createClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export type TeamMember = {
  id: string;
  fullName: string;
  email: string;
  role: "staff" | "owner";
  permissions: StaffPermission[];
  isActive: boolean;
  lastSignInLabel: string;
};

function formatSignIn(value: string | null): string {
  if (!value) {
    return "Brak logowania";
  }
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Warsaw",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toMember(
  row: {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    staff_permissions: string[];
    is_active: boolean;
  },
  lastSignInAt: string | null,
): TeamMember | null {
  if (row.role !== "staff" && row.role !== "owner") {
    return null;
  }
  return {
    id: row.id,
    fullName: row.full_name?.trim() || "Bez imienia",
    email: row.email,
    role: row.role,
    permissions: normalizePermissions(row.staff_permissions),
    isActive: row.is_active,
    lastSignInLabel: formatSignIn(lastSignInAt),
  };
}

async function lastSignIns(): Promise<Map<string, string | null>> {
  const admin = createClient();
  const map = new Map<string, string | null>();
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data.users.length) {
      break;
    }
    for (const user of data.users) {
      map.set(user.id, user.last_sign_in_at ?? null);
    }
    if (data.users.length < 200) {
      break;
    }
  }
  return map;
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const columns = "id, full_name, email, role, staff_permissions, is_active";
  try {
    const admin = createClient();
    const signs = await lastSignIns();
    const { data } = await admin
      .from("profiles")
      .select(columns)
      .in("role", ["staff", "owner"])
      .order("full_name", { ascending: true });
    return (data ?? [])
      .map((row) => toMember(row, signs.get(row.id) ?? null))
      .filter((row): row is TeamMember => row !== null)
      .sort((a, b) => Number(b.role === "owner") - Number(a.role === "owner") || a.fullName.localeCompare(b.fullName, "pl"));
  } catch {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from("profiles")
      .select(columns)
      .in("role", ["staff", "owner"])
      .order("full_name", { ascending: true });
    return (data ?? [])
      .map((row) => toMember(row, null))
      .filter((row): row is TeamMember => row !== null);
  }
}
