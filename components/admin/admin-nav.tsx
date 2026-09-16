"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAdmin } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";

type AdminNavProps = {
  isOwner: boolean;
  firstName: string;
  roleLabel: string;
  onNavigate?: () => void;
};

const staffLinks = [
  { href: "/admin", label: "Dziś", exact: true },
  { href: "/admin/zamowienia", label: "Zamówienia" },
  { href: "/admin/produkcja", label: "Produkcja" },
  { href: "/admin/paczki", label: "Paczki" },
  { href: "/admin/wydawanie", label: "Wydawanie" },
] as const;

const catalogLinks = [
  { href: "/admin/kategorie", label: "Kategorie", ownerOnly: true },
  { href: "/admin/produkty", label: "Produkty", ownerOnly: true },
  { href: "/admin/limity", label: "Limity", ownerOnly: true },
  { href: "/admin/kody-rabatowe", label: "Promocje i kody", ownerOnly: true },
  { href: "/admin/punkty-odbioru", label: "Punkty odbioru", ownerOnly: true },
  { href: "/admin/slowniki", label: "Słowniki", ownerOnly: true },
  { href: "/admin/zamowienia-specjalne", label: "Zamówienia specjalne", ownerOnly: false },
  { href: "/admin/statystyki", label: "Statystyki", ownerOnly: true },
  { href: "/admin/ustawienia", label: "Ustawienia", ownerOnly: true },
] as const;

function NavLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex min-h-12 items-center rounded-md px-3 text-base",
        active ? "bg-black/20 font-medium" : "hover:bg-black/10",
      )}
    >
      {label}
    </Link>
  );
}

export function AdminNav({ isOwner, firstName, roleLabel, onNavigate }: AdminNavProps) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex h-full flex-col">
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {staffLinks.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={isActive(item.href, "exact" in item && item.exact)}
            onNavigate={onNavigate}
          />
        ))}
        <div className="my-2 h-px bg-[var(--adj-gold)]" aria-hidden />
        {catalogLinks
          .filter((item) => !item.ownerOnly || isOwner)
          .map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActive(item.href)}
              onNavigate={onNavigate}
            />
          ))}
      </nav>
      <div className="space-y-2 border-t border-[var(--adj-gold)] px-3 py-4">
        <p className="truncate text-sm font-medium">{firstName}</p>
        <p className="text-sm text-[var(--adj-cream)]/80">{roleLabel}</p>
        <form action={signOutAdmin}>
          <button
            type="submit"
            className="flex min-h-12 w-full items-center rounded-md px-0 text-left text-base underline-offset-4 hover:underline"
          >
            Wyloguj
          </button>
        </form>
        <Link
          href="/sklep"
          onClick={onNavigate}
          className="flex min-h-12 items-center text-base underline-offset-4 hover:underline"
        >
          Sklep
        </Link>
      </div>
    </div>
  );
}
