import Link from "next/link";

import { LoyaltySection } from "@/components/shop/loyalty-section";
import { ProfileForm } from "@/components/shop/profile-form";
import { Button } from "@/components/ui/button";
import { getProfile, requireUser } from "@/lib/auth";
import { signOut } from "@/lib/auth-actions";
import { getLoyaltyStatus } from "@/lib/loyalty/status";

export default async function AccountPage() {
  const session = await requireUser("/konto");
  const [profile, loyalty] = await Promise.all([
    getProfile(),
    getLoyaltyStatus(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-semibold">Konto</h1>
      <p className="text-sm text-muted-foreground">{profile?.email}</p>
      {loyalty ? <LoyaltySection status={loyalty} /> : null}
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
