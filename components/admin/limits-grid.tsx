"use client";

import { Fragment, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteDayOverride, upsertDayOverride } from "@/lib/admin/owner-actions";
import type { LimitCell, LimitsGrid } from "@/lib/admin/owner-queries";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl } from "@/lib/format";
import { cn } from "@/lib/utils";

function weekdayLabel(iso: string): string {
  return formatDatePl(parseDateOnly(iso)).split(",")[0] ?? iso;
}

function dayNumber(iso: string): string {
  const date = parseDateOnly(iso);
  return `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function LimitsGridView({ grid }: { grid: LimitsGrid }) {
  const [openCell, setOpenCell] = useState<LimitCell | null>(null);
  const productName = grid.products.find((product) => product.id === openCell?.productId)?.name ?? "";

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--adj-cream-dark)] bg-card">
      <table className="w-full min-w-[860px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--adj-cream-dark)]">
            <th className="sticky left-0 bg-card px-3 py-3 font-medium">Produkt</th>
            {grid.days.map((day) => (
              <th key={day} className="px-2 py-3 text-center font-medium">
                <div className="capitalize">{weekdayLabel(day)}</div>
                <div className="text-xs font-normal text-muted-foreground">{dayNumber(day)}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.products.map((product, index) => {
            const prev = grid.products[index - 1];
            const showCategory = !prev || prev.categoryName !== product.categoryName;
            return (
              <Fragment key={product.id}>
                {showCategory ? (
                  <tr className="bg-[var(--adj-cream)]">
                    <th colSpan={8} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">
                      {product.categoryName}
                    </th>
                  </tr>
                ) : null}
                <tr className="border-b border-[var(--adj-cream-dark)] last:border-0">
                  <td className="sticky left-0 bg-card px-3 py-2 font-medium">{product.name}</td>
                  {grid.days.map((day) => {
                    const cell = grid.cells[`${product.id}:${day}`];
                    if (!cell) {
                      return <td key={day} />;
                    }
                    if (!cell.onSaleDay) {
                      return (
                        <td key={day} className="px-1 py-1">
                          <div className="flex min-h-14 w-full items-center justify-center rounded-md bg-[var(--adj-cream)] text-muted-foreground opacity-60">
                            —
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td key={day} className="px-1 py-1">
                        <button
                          type="button"
                          onClick={() => setOpenCell(cell)}
                          className={cn(
                            "flex min-h-14 w-full flex-col items-center justify-center rounded-md px-1 py-1",
                            cell.hasOverride
                              ? "bg-amber-50 ring-2 ring-[var(--adj-gold)]"
                              : "hover:bg-[var(--adj-cream)]",
                            !cell.isAvailable && "opacity-60",
                          )}
                        >
                          <span
                            className={cn(
                              "text-base",
                              cell.hasOverride ? "font-semibold" : "text-muted-foreground",
                            )}
                          >
                            {cell.effectiveCap}
                          </span>
                          <span className="text-xs text-muted-foreground">rez. {cell.reserved}</span>
                          {!cell.isAvailable ? (
                            <span className="text-[10px] font-medium text-red-700">off</span>
                          ) : null}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>

      <LimitPopover
        cell={openCell}
        productName={productName}
        onClose={() => setOpenCell(null)}
      />
    </div>
  );
}

function LimitPopover({
  cell,
  productName,
  onClose,
}: {
  cell: LimitCell | null;
  productName: string;
  onClose: () => void;
}) {
  const [cap, setCap] = useState("");
  const [available, setAvailable] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!cell) {
      return;
    }
    setCap(cell.overrideCap != null ? String(cell.overrideCap) : "");
    setAvailable(cell.isAvailable);
  }, [cell]);

  return (
    <Dialog
      open={Boolean(cell)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent>
        {cell ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {productName} · {formatDatePl(parseDateOnly(cell.day))}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Domyślny limit: {cell.defaultCap}</p>
              <div className="space-y-1">
                <Label htmlFor="day-cap">Limit na ten dzień</Label>
                <Input
                  id="day-cap"
                  type="number"
                  min={0}
                  value={cap}
                  onChange={(event) => setCap(event.target.value)}
                  placeholder="puste = domyślny"
                  className="min-h-12 text-base"
                />
              </div>
              <label className="flex min-h-12 items-center gap-2">
                <input
                  type="checkbox"
                  checked={!available}
                  onChange={(event) => setAvailable(!event.target.checked)}
                />
                Niedostępny tego dnia
              </label>
            </div>
            <DialogFooter className="gap-2">
              {cell.hasOverride ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-12"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await deleteDayOverride(cell.productId, cell.day);
                      if (!result.ok) {
                        toast(result.message);
                        return;
                      }
                      toast("Przywrócono domyślny.");
                      onClose();
                    });
                  }}
                >
                  Przywróć domyślny
                </Button>
              ) : null}
              <Button
                type="button"
                className="min-h-12"
                disabled={pending}
                onClick={() => {
                  const trimmed = cap.trim();
                  if (trimmed !== "" && !/^\d+$/.test(trimmed)) {
                    toast("Limit ma być pusty albo liczbą.");
                    return;
                  }
                  startTransition(async () => {
                    const result = await upsertDayOverride({
                      productId: cell.productId,
                      day: cell.day,
                      cap: trimmed === "" ? null : Number(trimmed),
                      isAvailable: available,
                    });
                    if (!result.ok) {
                      toast(result.message);
                      return;
                    }
                    toast("Zapisane.");
                    onClose();
                  });
                }}
              >
                Zapisz
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
