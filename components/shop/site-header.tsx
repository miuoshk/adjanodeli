import Image from "next/image";
import Link from "next/link";
import { UserRound } from "lucide-react";

import { getProfile } from "@/lib/auth";
import { HeaderCartLink } from "@/components/shop/header-cart-link";

export async function SiteHeader() {
  const profile = await getProfile();
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  const isStaff = profile?.role === "staff" || profile?.role === "owner";

  return (
    <header className="sticky top-0 z-50 bg-secondary text-secondary-foreground">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="relative block h-9 w-[120px] shrink-0">
          <Image
            src="/brand/adjano-logo.png"
            alt="Adjano"
            fill
            className="object-contain object-left"
            priority
          />
        </Link>
        <div className="flex items-center gap-2">
          {profile ? (
            <Link
              href="/moje-zamowienia"
              className="flex min-h-12 items-center rounded-md px-2 text-sm font-medium hover:bg-black/10"
            >
              Zamówienia
            </Link>
          ) : null}
          {isStaff ? (
            <Link
              href="/admin"
              className="flex min-h-12 items-center rounded-md px-2 text-sm font-medium hover:bg-black/10"
            >
              Panel
            </Link>
          ) : null}
          <HeaderCartLink />
          {profile ? (
            <Link
              href="/konto"
              className="flex min-h-12 items-center gap-2 rounded-md px-2 text-sm font-medium hover:bg-black/10"
            >
              <span className="max-w-28 truncate">{firstName || "Konto"}</span>
              <span className="flex size-9 items-center justify-center rounded-full bg-secondary-foreground/15">
                <UserRound className="size-5" strokeWidth={1.75} />
              </span>
            </Link>
          ) : (
            <Link
              href="/logowanie"
              className="flex min-h-12 items-center gap-2 rounded-md px-2 text-sm font-medium hover:bg-black/10"
            >
              <span className="hidden sm:inline">Zaloguj</span>
              <span className="flex size-9 items-center justify-center rounded-full bg-secondary-foreground/15">
                <UserRound className="size-5" strokeWidth={1.75} />
              </span>
            </Link>
          )}
        </div>
      </div>
      <div className="h-px bg-[var(--adj-gold)]" aria-hidden />
    </header>
  );
}
