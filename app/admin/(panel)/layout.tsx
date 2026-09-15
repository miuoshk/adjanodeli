import { requireRole } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireRole("staff", "/admin");
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || profile?.email || "Konto";
  const isOwner = profile?.role === "owner";
  const roleLabel = isOwner ? "Właścicielka" : "Pracownik";

  return (
    <AdminShell isOwner={isOwner} firstName={firstName} roleLabel={roleLabel}>
      {children}
    </AdminShell>
  );
}
