import Link from "next/link";

import { SectionHeading } from "@/components/brand/section-heading";
import { LoginForm } from "@/components/shop/login-form";
import { safeNextPath } from "@/lib/safe-next";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  return (
    <div className="mx-auto max-w-[440px]">
      <SectionHeading
        as="h1"
        eyebrow="Logowanie"
        title="Zaloguj się kodem"
        description="Podaj adres e‑mail. Wyślemy na niego kod do wpisania poniżej."
      />
      <LoginForm next={next} />
      <p className="mt-8 text-center text-sm">
        <Link href="/admin/logowanie" className="adj-link">
          Logowanie dla pracowników piekarni
        </Link>
      </p>
    </div>
  );
}
