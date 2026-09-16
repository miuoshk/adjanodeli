"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function UnlockPointToast({ name }: { name: string | null }) {
  useEffect(() => {
    if (name) {
      toast(`Odblokowano punkt: ${name}`);
    }
  }, [name]);

  return null;
}
