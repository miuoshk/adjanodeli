"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

import { ActiveSwitch } from "@/components/admin/active-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/format";
import { PRICE_RE, priceToGrosze } from "@/lib/admin/catalog";
import type { ProductOptionDraft, ProductOptionGroupDraft } from "@/lib/admin/product-option-drafts";

type ProductOptionsEditorProps = {
  groups: ProductOptionGroupDraft[];
  onChange: (groups: ProductOptionGroupDraft[]) => void;
};

function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const next = index + direction;
  if (next < 0 || next >= items.length) {
    return items;
  }
  const copy = [...items];
  const current = copy[index];
  const target = copy[next];
  if (!current || !target) {
    return items;
  }
  copy[index] = target;
  copy[next] = current;
  return copy;
}

export function ProductOptionsEditor({ groups, onChange }: ProductOptionsEditorProps) {
  function updateGroup(index: number, patch: Partial<ProductOptionGroupDraft>) {
    onChange(groups.map((group, groupIndex) => (groupIndex === index ? { ...group, ...patch } : group)));
  }

  function updateOption(groupIndex: number, optionIndex: number, patch: Partial<ProductOptionDraft>) {
    const group = groups[groupIndex];
    if (!group) {
      return;
    }
    updateGroup(groupIndex, {
      options: group.options.map((option, index) => (index === optionIndex ? { ...option, ...patch } : option)),
    });
  }

  return (
    <section className="space-y-4 rounded-xl border border-[var(--adj-cream-dark)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Opcje do wyboru</h2>
        <Button
          type="button"
          variant="outline"
          className="min-h-12"
          onClick={() =>
            onChange([
              ...groups,
              { id: null, name: "", isRequired: true, maxChoices: 1, options: [] },
            ])
          }
        >
          Dodaj grupę
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">Bez opcji klient dodaje produkt jednym kliknięciem.</p>
      ) : null}

      {groups.map((group, groupIndex) => (
        <div key={group.id ?? `nowa-${groupIndex}`} className="space-y-3 rounded-lg bg-[var(--adj-cream)] p-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor={`grupa-${groupIndex}`}>Nazwa grupy</Label>
              <Input
                id={`grupa-${groupIndex}`}
                value={group.name}
                placeholder="Sos"
                className="min-h-12 text-base"
                onChange={(event) => updateGroup(groupIndex, { name: event.target.value })}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-12"
                aria-label="Grupa w górę"
                disabled={groupIndex === 0}
                onClick={() => onChange(move(groups, groupIndex, -1))}
              >
                <ChevronUp />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-12"
                aria-label="Grupa w dół"
                disabled={groupIndex === groups.length - 1}
                onClick={() => onChange(move(groups, groupIndex, 1))}
              >
                <ChevronDown />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <ActiveSwitch
                checked={group.isRequired}
                label="Wymagane"
                onCheckedChange={(isRequired) => updateGroup(groupIndex, { isRequired })}
              />
              <span className="text-sm">Wymagane</span>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`wybor-${groupIndex}`}>Ile można wybrać</Label>
              <Input
                id={`wybor-${groupIndex}`}
                type="number"
                min={1}
                max={10}
                value={group.maxChoices}
                className="min-h-12 w-24 text-base"
                onChange={(event) =>
                  updateGroup(groupIndex, { maxChoices: Math.max(1, Number(event.target.value) || 1) })
                }
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-12"
              onClick={() => {
                const blocked = group.options.some((option) => option.used);
                if (blocked) {
                  return;
                }
                onChange(groups.filter((_, index) => index !== groupIndex));
              }}
              disabled={group.options.some((option) => option.used)}
            >
              Usuń grupę
            </Button>
          </div>

          <ul className="space-y-3">
            {group.options.map((option, optionIndex) => (
              <li key={option.id ?? `opcja-${groupIndex}-${optionIndex}`} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
                <Input
                  value={option.name}
                  placeholder="czosnkowy"
                  aria-label="Nazwa opcji"
                  className="min-h-12 text-base"
                  onChange={(event) => updateOption(groupIndex, optionIndex, { name: event.target.value })}
                />
                <Input
                  value={option.price}
                  placeholder="0,00"
                  aria-label="Dopłata"
                  inputMode="decimal"
                  className="min-h-12 text-base"
                  onChange={(event) => updateOption(groupIndex, optionIndex, { price: event.target.value })}
                />
                <div className="flex items-center gap-2">
                  <ActiveSwitch
                    checked={option.isActive}
                    label="Aktywna"
                    onCheckedChange={(isActive) => updateOption(groupIndex, optionIndex, { isActive })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-12"
                    aria-label="Opcja w górę"
                    disabled={optionIndex === 0}
                    onClick={() =>
                      updateGroup(groupIndex, { options: move(group.options, optionIndex, -1) })
                    }
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-12"
                    aria-label="Opcja w dół"
                    disabled={optionIndex === group.options.length - 1}
                    onClick={() =>
                      updateGroup(groupIndex, { options: move(group.options, optionIndex, 1) })
                    }
                  >
                    <ChevronDown />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-12"
                    disabled={option.used}
                    onClick={() =>
                      updateGroup(groupIndex, {
                        options: group.options.filter((_, index) => index !== optionIndex),
                      })
                    }
                  >
                    Usuń
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <Button
            type="button"
            variant="outline"
            className="min-h-12"
            onClick={() =>
              updateGroup(groupIndex, {
                options: [
                  ...group.options,
                  { id: null, name: "", price: "0,00", isActive: true, used: false },
                ],
              })
            }
          >
            Dodaj opcję
          </Button>

          <div className="rounded-md border border-[var(--adj-cream-dark)] bg-white p-3 text-sm">
            <p className="font-medium">Tak zobaczy to klient</p>
            <p className="mt-2">
              {group.name.trim() || "Grupa"}
              {group.isRequired ? " · wymagane" : ""}
              {group.maxChoices > 1 ? ` · do ${group.maxChoices}` : ""}
            </p>
            <ul className="mt-1 space-y-1">
              {group.options.filter((option) => option.isActive).map((option) => {
                const delta = PRICE_RE.test(option.price) ? priceToGrosze(option.price) : 0;
                return (
                  <li key={`${option.name}-${option.price}`}>
                    {option.name.trim() || "opcja"}
                    {delta > 0 ? ` +${formatPrice(delta)}` : ""}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ))}
    </section>
  );
}
