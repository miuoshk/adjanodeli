import Image from "next/image";
import Link from "next/link";
import { UserRound } from "lucide-react";

import { getProfile } from "@/lib/auth";
import { getLoyaltyStatus } from "@/lib/loyalty/status";
import { HeaderCartLink } from "@/components/shop/header-cart-link";

export async function SiteHeader() {
  const profile = await getProfile();
  const loyalty = profile ? await getLoyaltyStatus(profile.id) : null;
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
          {loyalty ? (
            <Link
              href="/konto"
              className="flex min-h-12 min-w-12 flex-col items-center justify-center rounded-md px-1 text-xs font-medium hover:bg-black/10"
              aria-label={`Pieczątki ${loyalty.active_stamps} z ${loyalty.next_threshold}`}
            >
              <span className="text-sm font-semibold leading-none">{loyalty.active_stamps}</span>
              <span className="leading-none text-[10px] opacity-80">/{loyalty.next_threshold}</span>
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
