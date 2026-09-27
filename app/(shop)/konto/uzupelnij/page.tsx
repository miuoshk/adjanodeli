import { SectionHeading } from "@/components/brand/section-heading";
import { ProfileForm } from "@/components/shop/profile-form";
import { getProfile, requireUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-next";

const cardClass =
  "mt-8 rounded-[4px] border border-[rgba(43,42,31,0.18)] bg-[var(--adj-paper-light)] px-5 py-5 lg:px-6";

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
    <div>
      <SectionHeading
        as="h1"
        eyebrow="Konto"
        title="Jak się do Ciebie zwracać?"
        description="Imię trafi na etykietę paczki. Telefon przyda się, gdyby coś się zmieniło z odbiorem."
      />
      <div className={cardClass}>
        <ProfileForm
          fullName={profile?.full_name}
          phone={profile?.phone}
          marketingConsent={profile?.marketing_consent}
          next={next}
          submitLabel="Zapisz i dalej"
        />
      </div>
    </div>
  );
}
