"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  grantPickupPointAccess,
  revokePickupPointAccess,
  revokePickupPointCodeAccess,
} from "@/lib/admin/owner-actions";
import type { OwnerPointAccess } from "@/lib/admin/owner-queries";
import { formatDatePl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const viaLabel = {
  code: "kod",
  domain: "domena",
  admin: "ręcznie",
} as const;

export function PickupPointAccessPanel({
  pointId,
  accesses,
}: {
  pointId: string;
  accesses: OwnerPointAccess[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="mt-10 space-y-4">
      <h2 className="text-xl font-semibold">Osoby z dostępem</h2>

      {accesses.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nikt jeszcze nie ma dostępu.</p>
      ) : (
        <>
        <ul className="space-y-3 md:hidden">
          {accesses.map((access) => (
            <li
              key={access.userId}
              className="space-y-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4"
            >
              <p className="font-medium">{access.fullName ?? "—"}</p>
              <p className="break-all text-sm">{access.email}</p>
              <p className="text-sm text-muted-foreground">
                {viaLabel[access.grantedVia]} · {formatDatePl(access.grantedAt)}
              </p>
              <Button
                type="button"
                variant="outline"
                className="min-h-12 w-full"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await revokePickupPointAccess(pointId, access.userId);
                    toast(result.ok ? "Dostęp cofnięty." : result.message);
                    if (result.ok) {
                      router.refresh();
                    }
                  });
                }}
              >
                Cofnij
              </Button>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-xl border border-[var(--adj-cream-dark)] bg-card md:block">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--adj-cream-dark)]">
                <th className="px-4 py-3 font-medium">Imię</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Przez</th>
                <th className="px-4 py-3 font-medium">Kiedy</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {accesses.map((access) => (
                <tr key={access.userId} className="border-b border-[var(--adj-cream-dark)] last:border-0">
                  <td className="px-4 py-3">{access.fullName ?? "—"}</td>
                  <td className="px-4 py-3">{access.email}</td>
                  <td className="px-4 py-3">{viaLabel[access.grantedVia]}</td>
                  <td className="px-4 py-3">{formatDatePl(access.grantedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-10"
                      disabled={isPending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await revokePickupPointAccess(pointId, access.userId);
                          toast(result.ok ? "Dostęp cofnięty." : result.message);
                          if (result.ok) {
                            router.refresh();
                          }
                        });
                      }}
                    >
                      Cofnij
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="e-mail"
          className="min-h-12 text-base sm:max-w-xs"
        />
        <Button
          type="button"
          variant="outline"
          className="min-h-12"
          disabled={isPending || email.trim().length === 0}
          onClick={() => {
            startTransition(async () => {
              const result = await grantPickupPointAccess(pointId, email);
              toast(result.ok ? "Dostęp nadany." : result.message);
              if (result.ok) {
                setEmail("");
                router.refresh();
              }
            });
          }}
        >
          Nadaj dostęp
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" className="min-h-12">
            Cofnij wszystkim z kodu
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cofnąć wszystkim z kodu?</DialogTitle>
            <DialogDescription>
              Znikną tylko osoby, które weszły kodem. Dostęp z domeny i ręczny zostaje.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" className="min-h-12" onClick={() => setOpen(false)}>
              Zostaw
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-12"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const result = await revokePickupPointCodeAccess(pointId);
                  toast(result.ok ? "Dostępy z kodu cofnięte." : result.message);
                  if (result.ok) {
                    setOpen(false);
                    router.refresh();
                  }
                });
              }}
            >
              Cofnij wszystkim z kodu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
