import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Brak dostępu</h1>
      <p className="text-sm leading-relaxed">Nie masz dostępu do tej strony.</p>
      <Button asChild size="lg" className="min-h-12">
        <Link href="/">Wróć do menu</Link>
      </Button>
    </div>
  );
}
