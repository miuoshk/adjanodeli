import { create } from "zustand";
import { persist } from "zustand/middleware";

import { cartLineKey } from "@/lib/orders/item-options";

export type CartOption = {
  groupName: string;
  optionName: string;
};

export type CartItem = {
  productId: string;
  name: string;
  unitPriceGrosze: number;
  qty: number;
  optionIds: string[];
  options: CartOption[];
};

type CartState = {
  day: string | null;
  pickupPointId: string | null;
  items: CartItem[];
  note: string;
  entrySource: "przypomnienie" | null;
  add: (item: CartItem, day: string) => void;
  remove: (lineKey: string) => void;
  setQty: (lineKey: string, qty: number) => void;
  setDay: (day: string | null) => void;
  setPickupPoint: (pickupPointId: string | null) => void;
  setNote: (note: string) => void;
  setEntrySource: (entrySource: "przypomnienie" | null) => void;
  clear: () => void;
};

const emptyCart = {
  day: null as string | null,
  pickupPointId: null as string | null,
  items: [] as CartItem[],
  note: "",
  entrySource: null as "przypomnienie" | null,
};

function normalizeItem(item: Partial<CartItem> & Pick<CartItem, "productId" | "name" | "unitPriceGrosze" | "qty">): CartItem {
  return {
    productId: item.productId,
    name: item.name,
    unitPriceGrosze: item.unitPriceGrosze,
    qty: item.qty,
    optionIds: Array.isArray(item.optionIds) ? item.optionIds : [],
    options: Array.isArray(item.options) ? item.options : [],
  };
}

export function lineKeyOf(item: Pick<CartItem, "productId" | "optionIds">): string {
  return cartLineKey(item.productId, item.optionIds ?? []);
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      ...emptyCart,
      add: (item, day) => {
        const next = normalizeItem(item);
        const key = lineKeyOf(next);
        const { items, day: currentDay } = get();
        const existing = items.find((entry) => lineKeyOf(entry) === key);
        const nextItems = existing
          ? items.map((entry) =>
              lineKeyOf(entry) === key ? { ...entry, qty: entry.qty + next.qty, unitPriceGrosze: next.unitPriceGrosze } : entry,
            )
          : [...items, next];
        set({ items: nextItems, day: currentDay ?? day });
      },
      remove: (lineKey) => {
        const items = get().items.filter((item) => lineKeyOf(item) !== lineKey);
        if (items.length === 0) {
          set(emptyCart);
          return;
        }
        set({ items });
      },
      setQty: (lineKey, qty) => {
        if (qty <= 0) {
          get().remove(lineKey);
          return;
        }
        set({
          items: get().items.map((item) => (lineKeyOf(item) === lineKey ? { ...item, qty } : item)),
        });
      },
      setDay: (day) => set({ day }),
      setPickupPoint: (pickupPointId) => set({ pickupPointId }),
      setNote: (note) => set({ note }),
      setEntrySource: (entrySource) => set({ entrySource }),
      clear: () => set(emptyCart),
    }),
    {
      name: "adjanodeli-cart",
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<CartState>;
        return {
          ...current,
          ...saved,
          items: (saved.items ?? []).map((item) => normalizeItem(item)),
          entrySource: saved.entrySource === "przypomnienie" ? "przypomnienie" : null,
        };
      },
    },
  ),
);

export function selectTotalQty(state: Pick<CartState, "items">): number {
  return state.items.reduce((sum, item) => sum + item.qty, 0);
}

export function selectSubtotal(state: Pick<CartState, "items">): number {
  return state.items.reduce((sum, item) => sum + item.unitPriceGrosze * item.qty, 0);
}
