"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import type { StaffPermission } from "@/lib/admin/staff-access";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type AdminShellProps = {
  isOwner: boolean;
  firstName: string;
  roleLabel: string;
  permissions: StaffPermission[];
  children: ReactNode;
};

export function AdminShell({ isOwner, firstName, roleLabel, permissions, children }: AdminShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--adj-cream)]">
      <aside className="hidden w-[240px] shrink-0 flex-col bg-secondary text-secondary-foreground print:hidden md:flex">
        <Link href="/admin" className="relative mx-4 mt-4 block h-9 w-[132px] shrink-0">
          <Image
            src="/brand/logo/adjano-deli-poziomy-krem.svg"
            alt="Adjano Deli"
            fill
            className="object-contain object-left"
            priority
            unoptimized
          />
        </Link>
        <div className="mt-2 h-px bg-[var(--adj-gold)]" aria-hidden />
        <AdminNav isOwner={isOwner} firstName={firstName} roleLabel={roleLabel} permissions={permissions} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 bg-secondary px-3 text-secondary-foreground print:hidden md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-12 text-secondary-foreground hover:bg-black/10 hover:text-secondary-foreground"
                aria-label="Menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              showCloseButton={false}
              className="w-[240px] bg-secondary p-0 text-secondary-foreground"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <Link href="/admin" className="relative mx-4 mt-4 block h-9 w-[132px] shrink-0">
                <Image
                  src="/brand/logo/adjano-deli-poziomy-krem.svg"
                  alt="Adjano Deli"
                  fill
                  className="object-contain object-left"
                  unoptimized
                />
              </Link>
              <div className="mt-2 h-px bg-[var(--adj-gold)]" aria-hidden />
              <AdminNav
                isOwner={isOwner}
                firstName={firstName}
                roleLabel={roleLabel}
                permissions={permissions}
                onNavigate={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <span className="font-heading text-xl font-semibold">Panel</span>
        </header>
        <div className="h-px bg-[var(--adj-gold)] print:hidden md:hidden" aria-hidden />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
