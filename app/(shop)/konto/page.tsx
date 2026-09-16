import Link from "next/link";

import { AccountPickupPoints } from "@/components/shop/account-pickup-points";
import { LoyaltySection } from "@/components/shop/loyalty-section";
import { ProfileForm } from "@/components/shop/profile-form";
import { Button } from "@/components/ui/button";
import { getProfile, requireUser } from "@/lib/auth";
import { signOut } from "@/lib/auth-actions";
import { getLoyaltyStatus } from "@/lib/loyalty/status";
import { createServerClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const session = await requireUser("/konto");
  const supabase = await createServerClient();
  const [profile, loyalty, accessResult] = await Promise.all([
    getProfile(),
    getLoyaltyStatus(session.user.id),
    supabase
      .from("pickup_point_access")
      .select("granted_at, pickup_points(name)")
      .eq("user_id", session.user.id)
      .order("granted_at", { ascending: false }),
  ]);

  const accesses = (accessResult.data ?? []).flatMap((row) => {
    const point = row.pickup_points as { name: string } | { name: string }[] | null;
    const name = Array.isArray(point) ? point[0]?.name : point?.name;
    if (!name) {
      return [];
    }
    return [{ name, grantedAt: row.granted_at }];
  });

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-semibold">Konto</h1>
      <p className="text-sm text-muted-foreground">{profile?.email}</p>
      {loyalty ? <LoyaltySection status={loyalty} /> : null}
      <AccountPickupPoints accesses={accesses} />
      <p>
        <Link href="/konto/stale-zamowienia" className="text-sm underline underline-offset-4">
          Stałe zamówienia
        </Link>
      </p>
      <ProfileForm
        fullName={profile?.full_name}
        phone={profile?.phone}
        marketingConsent={profile?.marketing_consent}
        next="/konto"
        submitLabel="Zapisz"
      />
      <form action={signOut}>
        <Button type="submit" variant="secondary" size="lg" className="min-h-12 w-full">
          Wyloguj
        </Button>
      </form>
    </div>
  );
}
