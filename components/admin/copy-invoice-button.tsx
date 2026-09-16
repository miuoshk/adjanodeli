"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type CopyInvoiceButtonProps = {
  company: string;
  nip: string;
  address: string;
};

export function CopyInvoiceButton({ company, nip, address }: CopyInvoiceButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-12"
      onClick={async () => {
        const text = `${company}\nNIP: ${nip}\n${address}`;
        try {
          await navigator.clipboard.writeText(text);
          toast("Skopiowane.");
        } catch {
          toast("Nie udało się skopiować.");
        }
      }}
    >
      Kopiuj dane do faktury
    </Button>
  );
}
