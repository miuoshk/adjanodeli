"use client";

import { useMemo, useState } from "react";

import { formatPrice } from "@/lib/format";
import {
  missingRequiredGroupName,
  optionDeltaGrosze,
  type ShopOptionGroup,
} from "@/lib/orders/item-options";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ProductOptionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  basePriceGrosze: number;
  groups: ShopOptionGroup[];
  initialOptionIds?: string[];
  onConfirm: (optionIds: string[]) => void;
};

export function ProductOptionSheet({
  open,
  onOpenChange,
  productName,
  basePriceGrosze,
  groups,
  initialOptionIds = [],
  onConfirm,
}: ProductOptionSheetProps) {
  const [selected, setSelected] = useState<string[]>(initialOptionIds);

  const activeGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          options: group.options.filter((option) => option.isActive),
        }))
        .filter((group) => group.options.length > 0),
    [groups],
  );

  const missing = missingRequiredGroupName(activeGroups, selected);
  const price = basePriceGrosze + optionDeltaGrosze(activeGroups, selected);

  function toggle(group: ShopOptionGroup, optionId: string) {
    const inGroup = new Set(group.options.map((option) => option.id));
    const current = selected.filter((id) => inGroup.has(id));
    if (group.maxChoices <= 1) {
      setSelected([...selected.filter((id) => !inGroup.has(id)), optionId]);
      return;
    }
    if (current.includes(optionId)) {
      setSelected(selected.filter((id) => id !== optionId));
      return;
    }
    if (current.length >= group.maxChoices) {
      return;
    }
    setSelected([...selected, optionId]);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setSelected(initialOptionIds);
        }
        onOpenChange(next);
      }}
    >
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl bg-[var(--adj-cream)]">
        <SheetHeader>
          <SheetTitle>{productName}</SheetTitle>
          <SheetDescription>Wybierz dodatki, zanim dodasz do koszyka.</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4">
          {activeGroups.map((group) => (
            <fieldset key={group.id} className="space-y-2">
              <legend className="text-base font-medium">
                {group.name}
                {group.isRequired ? <span className="text-[var(--adj-ink-soft)]"> · wymagane</span> : null}
              </legend>
              {group.options.map((option) => {
                const checked = selected.includes(option.id);
                return (
                  <label key={option.id} className="flex min-h-12 items-center justify-between gap-3">
                    <span className="flex items-center gap-3">
                      <input
                        type={group.maxChoices <= 1 ? "radio" : "checkbox"}
                        name={group.id}
                        className="size-5"
                        checked={checked}
                        onChange={() => toggle(group, option.id)}
                      />
                      {option.name}
                    </span>
                    <span className="text-sm text-[var(--adj-ink-soft)]">
                      {option.priceDeltaGrosze > 0 ? `+${formatPrice(option.priceDeltaGrosze)}` : "0 zł"}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          ))}
        </div>
        <SheetFooter>
          <Button
            type="button"
            className="min-h-12 w-full"
            disabled={Boolean(missing)}
            onClick={() => {
              onConfirm(selected);
              onOpenChange(false);
            }}
          >
            {missing ? `Wybierz: ${missing}` : `Dodaj · ${formatPrice(price)}`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
