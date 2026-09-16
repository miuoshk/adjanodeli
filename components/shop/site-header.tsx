import Image from "next/image";
import Link from "next/link";
import { UserRound } from "lucide-react";

import { getProfile } from "@/lib/auth";
import { getLoyaltyStatus } from "@/lib/loyalty/status";
import { HeaderCartLink } from "@/components/shop/header-cart-link";
import { SiteHeaderShell } from "@/components/shop/site-header-shell";

export async function SiteHeader() {
  const profile = await getProfile();
  const loyalty = profile ? await getLoyaltyStatus(profile.id) : null;
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  const isStaff = profile?.role === "staff" || profile?.role === "owner";

  return (
    <SiteHeaderShell>
      <Link href="/" className="relative block h-9 w-[120px] shrink-0">
        <Image
          src="/brand/adjano-logo.png"
          alt="Adjano"
          fill
          className="object-contain object-left"
          priority
        />
      </Link>
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href="/sklep"
          className="flex min-h-12 items-center rounded-md px-2 text-sm font-medium hover:bg-black/10"
        >
          Sklep
        </Link>
        {profile ? (
          <Link
            href="/moje-zamowienia"
            className="hidden min-h-12 items-center rounded-md px-2 text-sm font-medium hover:bg-black/10 sm:flex"
          >
            Zamówienia
          </Link>
        ) : null}
        {isStaff ? (
          <Link
            href="/admin"
            className="hidden min-h-12 items-center rounded-md px-2 text-sm font-medium hover:bg-black/10 sm:flex"
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
            <span className="hidden max-w-28 truncate sm:inline">{firstName || "Konto"}</span>
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
    </SiteHeaderShell>
  );
}
