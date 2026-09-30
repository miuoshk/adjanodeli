"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAdmin } from "@/lib/auth-actions";
import type { StaffPermission } from "@/lib/admin/staff-access";
import { cn } from "@/lib/utils";

type AdminNavProps = {
  isOwner: boolean;
  firstName: string;
  roleLabel: string;
  permissions: StaffPermission[];
  onNavigate?: () => void;
};

const staffLinks: { href: string; label: string; permission: StaffPermission; exact?: boolean }[] = [
  { href: "/admin", label: "Dziś", permission: "dashboard", exact: true },
  { href: "/admin/zamowienia", label: "Zamówienia", permission: "orders" },
  { href: "/admin/produkcja", label: "Produkcja", permission: "production" },
  { href: "/admin/paczki", label: "Paczki", permission: "packages" },
  { href: "/admin/wydawanie", label: "Wydawanie", permission: "handover" },
  { href: "/admin/zamowienia-specjalne", label: "Zamówienia specjalne", permission: "special_requests" },
];

const catalogLinks = [
  { href: "/admin/kategorie", label: "Kategorie" },
  { href: "/admin/produkty", label: "Produkty" },
  { href: "/admin/limity", label: "Limity" },
  { href: "/admin/kody-rabatowe", label: "Promocje i kody" },
  { href: "/admin/punkty-odbioru", label: "Punkty odbioru" },
  { href: "/admin/slowniki", label: "Słowniki" },
  { href: "/admin/statystyki", label: "Statystyki" },
  { href: "/admin/zespol", label: "Zespół" },
  { href: "/admin/ustawienia", label: "Ustawienia" },
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

export function AdminNav({ isOwner, firstName, roleLabel, permissions, onNavigate }: AdminNavProps) {
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
        {staffLinks
          .filter((item) => permissions.includes(item.permission))
          .map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActive(item.href, item.exact)}
              onNavigate={onNavigate}
            />
          ))}
        <div className="my-2 h-px bg-[var(--adj-gold)]" aria-hidden />
        {isOwner
          ? catalogLinks.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActive(item.href)}
              onNavigate={onNavigate}
            />
          ))
          : null}
        <NavLink
          href="/admin/pomoc"
          label="Pomoc"
          active={isActive("/admin/pomoc")}
          onNavigate={onNavigate}
        />
      </nav>
      <div className="space-y-2 border-t border-[var(--adj-gold)] px-3 py-4">
        <p className="truncate text-sm font-medium">{firstName}</p>
        <p className="text-sm text-[var(--adj-cream)]/80">{roleLabel}</p>
        <Link
          href="/admin/konto"
          onClick={onNavigate}
          className="flex min-h-12 items-center text-base underline-offset-4 hover:underline"
        >
          Zmień hasło
        </Link>
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
