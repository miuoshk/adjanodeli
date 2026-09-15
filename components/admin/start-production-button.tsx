"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { startDayProduction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type StartProductionButtonProps = {
  day: string;
  paidCount: number;
};

export function StartProductionButton({ day, paidCount }: StartProductionButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button
        type="button"
        className="min-h-12"
        disabled={paidCount === 0}
        onClick={() => setOpen(true)}
      >
        Start produkcji dnia
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start produkcji</DialogTitle>
            <DialogDescription>
              Przenieść {paidCount}{" "}
              {paidCount === 1 ? "opłacone zamówienie" : "opłaconych zamówień"} do produkcji?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-12" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button
              type="button"
              className="min-h-12"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const result = await startDayProduction(day);
                  if (!result.ok) {
                    toast(result.message);
                    return;
                  }
                  toast(
                    result.count === 1
                      ? "1 zamówienie w produkcji."
                      : `${result.count} zamówień w produkcji.`,
                  );
                  setOpen(false);
                });
              }}
            >
              Start
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
