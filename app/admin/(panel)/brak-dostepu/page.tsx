import Link from "next/link";

import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/lib/auth";

export default async function NoAccessPage() {
  await requireRole("staff", "/admin/brak-dostepu");

  return (
    <div className="space-y-4">
      <PageHeader title="Brak dostępu" />
      <p className="max-w-md text-base leading-relaxed">
        Nie masz dostępu do tej części panelu. Poproś właścicielkę o dodanie uprawnienia.
      </p>
      <Link href="/admin/pomoc" className="inline-flex min-h-12 items-center underline-offset-4 hover:underline">
        Pomoc
      </Link>
    </div>
  );
}
