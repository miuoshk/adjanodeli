"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-12"
      onClick={() => router.refresh()}
    >
      Odśwież
    </Button>
  );
}
