import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { landingAfterLogin } from "@/lib/admin/staff-access";
import { getProfile } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-next";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextRaw = safeNextPath(params.next);
  const next =
    nextRaw === "/admin" || (nextRaw.startsWith("/admin/") && nextRaw !== "/admin/logowanie")
      ? nextRaw
      : "/admin";

  const profile = await getProfile();
  if (profile?.role === "staff" || profile?.role === "owner") {
    if (!profile.is_active) {
      const supabase = await createServerClient();
      await supabase.auth.signOut();
    } else {
      redirect(landingAfterLogin(profile, next));
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div className="space-y-6">
        <h1 className="font-heading text-3xl font-semibold">Panel</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">Login i hasło do zaplecza. Nie kod z maila.</p>
        <AdminLoginForm next={next} />
      </div>
    </div>
  );
}
