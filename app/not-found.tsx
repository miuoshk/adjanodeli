import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-12 text-center">
      <Image
        src="/brand/janosz.png"
        alt="Janosz"
        width={220}
        height={320}
        className="h-auto w-[min(100%,220px)]"
        priority
      />
      <p className="max-w-md font-heading text-2xl font-semibold text-foreground">
        Tej strony nie ma. Ale kanapki są.
      </p>
      <Button asChild size="lg" className="min-h-12">
        <Link href="/sklep">Wróć do menu</Link>
      </Button>
    </div>
  );
}
