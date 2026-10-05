"use client";

import { useEffect } from "react";

import { useCart } from "@/lib/store/cart";

export function RememberReminderSource({ src }: { src: string | null }) {
  const setEntrySource = useCart((state) => state.setEntrySource);

  useEffect(() => {
    if (src === "przypomnienie") {
      setEntrySource("przypomnienie");
    }
  }, [setEntrySource, src]);

  return null;
}
