import Link from "next/link";
import { redirect } from "next/navigation";

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
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-3xl font-semibold">Punkt odbioru</h1>
      <p className="text-base leading-relaxed">{result.message}</p>
      <p>
        <Link href="/sklep" className="underline underline-offset-4">
          Wróć do sklepu
        </Link>
      </p>
    </div>
  );
}
