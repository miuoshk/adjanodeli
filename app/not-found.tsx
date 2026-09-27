import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="adj-landing flex min-h-screen flex-col items-center justify-center px-5 py-16 text-center">
      <Image
        src="/brand/janosz.png"
        alt="Janosz"
        width={180}
        height={260}
        className="h-auto w-[180px]"
        priority
      />
      <p className="mt-6 font-heading text-[34px] font-medium">Tej strony nie ma</p>
      <p className="mt-2 text-[var(--adj-ink-soft)]">Kanapki są w sklepie.</p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/sklep">Przejdź do sklepu</Link>
      </Button>
    </div>
  );
}
