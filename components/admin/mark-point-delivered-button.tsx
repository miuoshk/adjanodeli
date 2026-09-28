"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { rememberArrivedPoint } from "@/lib/admin/arrived-point";
import { markPointDelivered } from "@/lib/admin/actions";
import { arrivalConfirmLines } from "@/lib/admin/delivery-notices";
import { resendOrderDeliveredMail } from "@/lib/admin/email-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type MailFailure = {
  orderId: string;
  code: string;
};

type MarkPointDeliveredButtonProps = {
  day: string;
  pointId: string;
  pointName: string;
  readyCount: number;
  unstartedCount: number;
  until: string;
  notifiedCount: number;
  totalCount: number;
  notifiedAt: string | null;
  failedMails: MailFailure[];
};

function formatNotifiedAt(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Warsaw",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function MarkPointDeliveredButton({
  day,
  pointId,
  pointName,
  readyCount,
  unstartedCount,
  until,
  notifiedCount,
  totalCount,
  notifiedAt,
  failedMails,
}: MarkPointDeliveredButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const alreadyTold = readyCount === 0;
  const lines = alreadyTold
    ? [
        `Powiadomiono ${notifiedCount} z ${totalCount}.${
          notifiedAt ? ` ${formatNotifiedAt(notifiedAt)}.` : ""
        } Kolejnego maila nie wyślę.`,
      ]
    : arrivalConfirmLines(pointName, readyCount, until, unstartedCount);

  return (
    <div className="space-y-3">
      <Button
        type="button"
        className="min-h-14 w-full sm:w-auto"
        onClick={() => setOpen(true)}
      >
        Jestem na miejscu — powiadom klientów
      </Button>
      {notifiedCount > 0 || alreadyTold ? (
        <p className="text-sm">
          Powiadomiono {notifiedCount} z {totalCount}
          {notifiedAt ? ` · ${formatNotifiedAt(notifiedAt)}` : ""}
        </p>
      ) : null}
      {failedMails.length > 0 ? (
        <ul className="space-y-2">
          {failedMails.map((failure) => (
            <li key={failure.orderId} className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-lg">{failure.code}</span>
              <ResendWaitingMail orderId={failure.orderId} />
            </li>
          ))}
        </ul>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jestem na miejscu</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-base text-[var(--adj-ink-soft)]">
                {lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-12" onClick={() => setOpen(false)}>
              {alreadyTold ? "Zamknij" : "Anuluj"}
            </Button>
            {alreadyTold ? null : (
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
                    rememberArrivedPoint(window.localStorage, day, pointId);
                    toast(
                      `Powiadomiono ${result.notified} z ${result.total}${
                        result.notifiedAt ? ` · ${formatNotifiedAt(result.notifiedAt)}` : ""
                      }.`,
                    );
                    if (result.statusErrors.length > 0) {
                      toast(`Nie udało się zmienić: ${result.statusErrors.join(", ")}.`);
                    }
                    if (result.mailErrors.length > 0) {
                      toast(`Mail nie poszedł: ${result.mailErrors.map((item) => item.code).join(", ")}.`);
                    }
                    setOpen(false);
                  });
                }}
              >
                Powiadom
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResendWaitingMail({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-12"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await resendOrderDeliveredMail(orderId);
          toast(result.message);
        });
      }}
    >
      Wyślij ponownie
    </Button>
  );
}
