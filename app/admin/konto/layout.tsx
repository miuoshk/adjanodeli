import { requireRole } from "@/lib/auth";
import { permissionsForNav } from "@/lib/admin/staff-access";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireRole("staff", "/admin/konto");
  const firstName = profile.full_name?.trim().split(/\s+/)[0] || profile.email || "Konto";
  const isOwner = profile.role === "owner";

  return (
    <AdminShell
      isOwner={isOwner}
      firstName={firstName}
      roleLabel={isOwner ? "Właścicielka" : "Pracownik"}
      permissions={permissionsForNav(profile)}
    >
      {children}
    </AdminShell>
  );
}
