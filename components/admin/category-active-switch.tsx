"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { ActiveSwitch } from "@/components/admin/active-switch";
import { setCategoryActive } from "@/lib/admin/owner-actions";

export function CategoryActiveSwitch({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <ActiveSwitch
      checked={isActive}
      disabled={pending}
      onCheckedChange={(next) => {
        startTransition(async () => {
          const result = await setCategoryActive(id, next);
          if (!result.ok) {
            toast(result.message);
          }
        });
      }}
    />
  );
}
