import { ProfileForm } from "@/components/shop/profile-form";
import { getProfile, requireUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-next";

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await requireUser("/konto/uzupelnij");
  const profile = await getProfile();
  const params = await searchParams;
  const next = safeNextPath(params.next);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-semibold">Uzupełnij konto</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Imię i nazwisko na zamówieniu. Telefon, gdyby trzeba było zadzwonić.
      </p>
      <ProfileForm
        fullName={profile?.full_name}
        phone={profile?.phone}
        marketingConsent={profile?.marketing_consent}
        next={next}
        submitLabel="Zapisz i dalej"
      />
    </div>
  );
}
