"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useCart, type CartItem } from "@/lib/store/cart";

type ApplyStandingCartProps = {
  day: string;
  pickupPointId: string;
  note: string;
  items: CartItem[];
  skipped: string[];
};

export function ApplyStandingCart({
  day,
  pickupPointId,
  note,
  items,
  skipped,
}: ApplyStandingCartProps) {
  const router = useRouter();
  const clear = useCart((state) => state.clear);
  const add = useCart((state) => state.add);
  const setDay = useCart((state) => state.setDay);
  const setPickupPoint = useCart((state) => state.setPickupPoint);
  const setNote = useCart((state) => state.setNote);

  useEffect(() => {
    clear();
    for (const item of items) {
      add(item, day);
    }
    setDay(day);
    setPickupPoint(pickupPointId);
    setNote(note);
    if (skipped.length > 0) {
      toast(`Pominięte: ${skipped.join(", ")}.`);
    }
    router.replace("/koszyk");
  }, [add, clear, day, items, note, pickupPointId, router, setDay, setNote, setPickupPoint, skipped]);

  return <p className="text-muted-foreground">Składam koszyk…</p>;
}
