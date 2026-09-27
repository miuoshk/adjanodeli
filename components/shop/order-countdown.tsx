"use client";

import { useEffect, useState } from "react";

type OrderCountdownProps = {
  expiresAt: string;
};

function formatRemain(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function OrderCountdown({ expiresAt }: OrderCountdownProps) {
  const [remain, setRemain] = useState(() =>
    formatRemain(new Date(expiresAt).getTime() - Date.now()),
  );

  useEffect(() => {
    function tick() {
      setRemain(formatRemain(new Date(expiresAt).getTime() - Date.now()));
    }
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  return (
    <p className="adj-ui inline-flex border border-[var(--adj-red)] px-3 py-1.5 text-[15px] text-[var(--adj-red)]">
      Czas na płatność: <span className="ml-2 font-medium tabular-nums">{remain}</span>
    </p>
  );
}
