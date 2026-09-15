import { ProfileForm } from "@/components/shop/profile-form";
import { Button } from "@/components/ui/button";
import { getProfile, requireUser } from "@/lib/auth";
import { signOut } from "@/lib/auth-actions";

export default async function AccountPage() {
  await requireUser("/konto");
  const profile = await getProfile();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-semibold">Konto</h1>
      <p className="text-sm text-muted-foreground">{profile?.email}</p>
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
