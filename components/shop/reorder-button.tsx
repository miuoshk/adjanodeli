"use client";

import { useRouter } from "next/navigation";

import { useCart, type CartItem } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";

type ReorderButtonProps = {
  firstDay: string | null;
  items: CartItem[];
};

export function ReorderButton({ firstDay, items }: ReorderButtonProps) {
  const router = useRouter();
  const clear = useCart((state) => state.clear);
  const add = useCart((state) => state.add);
  const setDay = useCart((state) => state.setDay);

  return (
    <Button
      type="button"
      size="lg"
      className="min-h-12"
      disabled={!firstDay || items.length === 0}
      onClick={() => {
        if (!firstDay) {
          return;
        }
        clear();
        for (const item of items) {
          add(item, firstDay);
        }
        setDay(firstDay);
        router.push("/koszyk");
      }}
    >
      Zamów ponownie
    </Button>
  );
}
