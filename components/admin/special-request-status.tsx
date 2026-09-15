"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { changeSpecialRequestStatus } from "@/lib/admin/actions";

const STATUSES = [
  { value: "new", label: "Nowe" },
  { value: "contacted", label: "Skontaktowane" },
  { value: "closed", label: "Zamknięte" },
] as const;

export function SpecialRequestStatus({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      className="min-h-12 rounded-md border border-input bg-card px-3 text-base"
      onChange={(event) => {
        const next = event.target.value;
        startTransition(async () => {
          const result = await changeSpecialRequestStatus(id, next);
          if (!result.ok) {
            toast(result.message);
          }
        });
      }}
    >
      {STATUSES.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}
