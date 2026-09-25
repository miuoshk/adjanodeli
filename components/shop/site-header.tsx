import Link from "next/link";
import { UserRound } from "lucide-react";

import { LandingStrip } from "@/components/landing/landing-strip";
import { HeaderCartLink } from "@/components/shop/header-cart-link";
import { HeaderLogo } from "@/components/shop/header-logo";
import { LandingNavLinks } from "@/components/shop/landing-nav-links";
import { SiteHeaderShell } from "@/components/shop/site-header-shell";
import { getProfile } from "@/lib/auth";
import { warsawDateIso } from "@/lib/dates";
import { getLoyaltyStatus } from "@/lib/loyalty/status";
import { getPickupBasics } from "@/lib/shop/landing-data";
import { buildPickupCopy } from "@/lib/shop/pickup-copy";

export async function SiteHeader() {
  const profile = await getProfile();
  const loyalty = profile ? await getLoyaltyStatus(profile.id) : null;
  const pickup = await getPickupBasics();
  const copy = buildPickupCopy(pickup.day, pickup.cutoff, warsawDateIso());
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  const isStaff = profile?.role === "staff" || profile?.role === "owner";

  return (
    <SiteHeaderShell announcement={<LandingStrip copy={copy} cutoff={pickup.cutoff} />}>
      <HeaderLogo />
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href="/sklep"
          className="flex min-h-12 items-center rounded-md px-2 text-sm font-medium hover:bg-black/10"
        >
          Sklep
        </Link>
        <LandingNavLinks />
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
