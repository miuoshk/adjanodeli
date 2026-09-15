import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  name: string;
  unitPriceGrosze: number;
  qty: number;
};

type CartState = {
  day: string | null;
  pickupPointId: string | null;
  items: CartItem[];
  note: string;
  add: (item: CartItem, day: string) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  setDay: (day: string | null) => void;
  setPickupPoint: (pickupPointId: string | null) => void;
  setNote: (note: string) => void;
  clear: () => void;
};

const emptyCart = {
  day: null as string | null,
  pickupPointId: null as string | null,
  items: [] as CartItem[],
  note: "",
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      ...emptyCart,
      add: (item, day) => {
        const { items, day: currentDay } = get();
        const existing = items.find((entry) => entry.productId === item.productId);
        const nextItems = existing
          ? items.map((entry) =>
              entry.productId === item.productId
                ? { ...entry, qty: entry.qty + item.qty }
                : entry,
            )
          : [...items, item];
        set({ items: nextItems, day: currentDay ?? day });
      },
      remove: (productId) => {
        const items = get().items.filter((item) => item.productId !== productId);
        if (items.length === 0) {
          set(emptyCart);
          return;
        }
        set({ items });
      },
      setQty: (productId, qty) => {
        if (qty <= 0) {
          get().remove(productId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.productId === productId ? { ...item, qty } : item,
          ),
        });
      },
      setDay: (day) => set({ day }),
      setPickupPoint: (pickupPointId) => set({ pickupPointId }),
      setNote: (note) => set({ note }),
      clear: () => set(emptyCart),
    }),
    { name: "adjanodeli-cart" },
  ),
);

export function selectTotalQty(state: Pick<CartState, "items">): number {
  return state.items.reduce((sum, item) => sum + item.qty, 0);
}

export function selectSubtotal(state: Pick<CartState, "items">): number {
  return state.items.reduce((sum, item) => sum + item.unitPriceGrosze * item.qty, 0);
}
