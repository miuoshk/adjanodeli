"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyCodeButton({ code }: { code: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-10"
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        toast("Skopiowane.");
      }}
    >
      Kopiuj
    </Button>
  );
}
