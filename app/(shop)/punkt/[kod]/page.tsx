import Link from "next/link";
import { redirect } from "next/navigation";

import { SectionHeading } from "@/components/brand/section-heading";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { unlockPickupPoint } from "@/lib/pickup/unlock-point";

type InvitePageProps = {
  params: Promise<{ kod: string }>;
};

export default async function InvitePointPage({ params }: InvitePageProps) {
  const { kod } = await params;
  const path = `/punkt/${kod}`;
  await requireUser(path);

  const result = await unlockPickupPoint(kod);
  if (result.ok) {
    redirect(`/sklep?odblokowano=${encodeURIComponent(result.name)}`);
  }

  return (
    <div>
      <SectionHeading as="h1" eyebrow="Punkt odbioru" title={result.message} />
      <Button asChild size="lg" className="mt-8">
        <Link href="/sklep">Przejdź do sklepu</Link>
      </Button>
    </div>
  );
}
