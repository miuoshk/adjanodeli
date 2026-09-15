"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { markPointDelivered } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type MarkPointDeliveredButtonProps = {
  day: string;
  pointId: string;
  pointName: string;
  count: number;
};

function packLabel(count: number): string {
  if (count === 1) {
    return "1 paczkę";
  }
  const rest10 = count % 10;
  const rest100 = count % 100;
  if (rest10 >= 2 && rest10 <= 4 && (rest100 < 10 || rest100 >= 20)) {
    return `${count} paczki`;
  }
  return `${count} paczek`;
}

export function MarkPointDeliveredButton({
  day,
  pointId,
  pointName,
  count,
}: MarkPointDeliveredButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button
        type="button"
        className="min-h-12"
        disabled={count === 0}
        onClick={() => setOpen(true)}
      >
        Dowiezione do tego punktu
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dowiezione</DialogTitle>
            <DialogDescription>
              Oznaczyć {packLabel(count)} jako dowiezione do {pointName}?
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
                  const result = await markPointDelivered(day, pointId);
                  if (!result.ok) {
                    toast(result.message);
                    return;
                  }
                  toast(
                    result.delivered === 1
                      ? "1 paczka dowieziona."
                      : `${result.delivered} paczek dowiezionych.`,
                  );
                  if (result.statusErrors.length > 0) {
                    toast(`Nie udało się zmienić: ${result.statusErrors.join(", ")}.`);
                  }
                  if (result.mailErrors.length > 0) {
                    toast(`Mail nie poszedł: ${result.mailErrors.join(", ")}.`);
                  }
                  setOpen(false);
                });
              }}
            >
              Dowiezione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
