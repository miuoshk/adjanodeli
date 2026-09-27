import Link from "next/link";

import { SectionHeading } from "@/components/brand/section-heading";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div>
      <SectionHeading
        as="h1"
        eyebrow="Konto"
        title="Brak dostępu"
        description="Ta strona jest dostępna tylko dla pracowników piekarni."
      />
      <Button asChild size="lg" className="mt-8">
        <Link href="/sklep">Przejdź do sklepu</Link>
      </Button>
    </div>
  );
}
