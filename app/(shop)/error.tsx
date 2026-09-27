"use client";

import Link from "next/link";

import { SectionHeading } from "@/components/brand/section-heading";
import { Button } from "@/components/ui/button";

export default function ShopError() {
  return (
    <div>
      <SectionHeading
        as="h1"
        eyebrow="Błąd"
        title="Coś poszło nie tak"
        description="Odśwież stronę albo wróć za chwilę."
      />
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button type="button" size="lg" onClick={() => location.reload()}>
          Odśwież
        </Button>
        <Button asChild variant="link">
          <Link href="/sklep">Przejdź do sklepu</Link>
        </Button>
      </div>
    </div>
  );
}
