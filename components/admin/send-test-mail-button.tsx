"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { sendTestMail } from "@/lib/admin/email-actions";

export function SendTestMailButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      const result = await sendTestMail();
      toast(result.message);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" disabled={pending} onClick={onClick}>
      {pending ? "Wysyłam…" : "Wyślij testowy mail"}
    </Button>
  );
}
