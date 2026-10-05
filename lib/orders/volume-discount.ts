export type VolumeTier = {
  minQty: number;
  pct: number;
};

export type DiscountSource = "voucher" | "code" | "volume";

export function parseVolumeTiers(value: unknown): VolumeTier[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const tiers: VolumeTier[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const minQty = Number((row as { min_qty?: unknown }).min_qty);
    const pct = Number((row as { pct?: unknown }).pct);
    if (!Number.isInteger(minQty) || !Number.isInteger(pct)) {
      continue;
    }
    tiers.push({ minQty, pct });
  }
  return tiers.sort((a, b) => a.minQty - b.minQty);
}

export function volumeTiersError(tiers: VolumeTier[]): string | null {
  if (tiers.length > 3) {
    return "Najwyżej trzy progi.";
  }
  let previous = 0;
  for (const tier of tiers) {
    if (!Number.isInteger(tier.minQty) || tier.minQty < 1) {
      return "Liczba sztuk ma być liczbą od 1.";
    }
    if (!Number.isInteger(tier.pct) || tier.pct < 1 || tier.pct > 50) {
      return "Procent ma być od 1 do 50.";
    }
    if (tier.minQty <= previous) {
      return "Progi mają iść od mniejszej liczby sztuk do większej.";
    }
    previous = tier.minQty;
  }
  return null;
}

export function volumePercent(qty: number, tiers: VolumeTier[], enabled: boolean): number | null {
  if (!enabled) {
    return null;
  }
  let bestQty = -1;
  let pct: number | null = null;
  for (const tier of tiers) {
    if (qty >= tier.minQty && tier.minQty >= bestQty) {
      bestQty = tier.minQty;
      pct = tier.pct;
    }
  }
  return pct;
}

/** Same rounding as create_order: integer division, floor for positive amounts. */
export function volumeDiscountGrosze(subtotalGrosze: number, pct: number): number {
  return Math.floor((subtotalGrosze * pct) / 100);
}

export function chooseOrderDiscount(input: {
  offerGrosze: number;
  offerSource: DiscountSource | null;
  offerPct: number | null;
  volumeGrosze: number;
  volumePct: number | null;
}): { grosze: number; source: DiscountSource | null; pct: number | null } {
  if (input.volumeGrosze > input.offerGrosze) {
    return { grosze: input.volumeGrosze, source: "volume", pct: input.volumePct };
  }
  if (input.offerGrosze > 0 && input.offerSource) {
    return { grosze: input.offerGrosze, source: input.offerSource, pct: input.offerPct };
  }
  return { grosze: 0, source: null, pct: null };
}

function piecesLeft(count: number): string {
  if (count === 1) {
    return "1 sztuka";
  }
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} sztuki`;
  }
  return `${count} sztuk`;
}

export function volumeShopLine(tiers: VolumeTier[]): string {
  const parts = [...tiers]
    .sort((a, b) => a.minQty - b.minQty)
    .map((tier) => `${tier.minQty === 1 ? "1 sztuki" : `${tier.minQty} sztuk`} −${tier.pct}%`);
  if (parts.length === 0) {
    return "";
  }
  return `Od ${parts.join(", od ")}`;
}

export function volumeProgressLine(qty: number, tiers: VolumeTier[], enabled: boolean): string | null {
  if (!enabled) {
    return null;
  }
  const next = [...tiers].sort((a, b) => a.minQty - b.minQty).find((tier) => tier.minQty > qty);
  if (!next) {
    return null;
  }
  const left = next.minQty - qty;
  return `Jeszcze ${piecesLeft(left)} do rabatu ${next.pct}%`;
}

export function volumeComparisonLine(input: {
  enabled: boolean;
  volumeGrosze: number;
  offerGrosze: number;
  offerKind: "voucher" | "code" | null;
}): string | null {
  if (!input.enabled || !input.offerKind || input.volumeGrosze <= 0 || input.offerGrosze <= 0) {
    return null;
  }
  if (input.volumeGrosze > input.offerGrosze) {
    if (input.offerKind === "voucher") {
      return "Rabat za ilość jest dla Ciebie lepszy. Voucher zostaje na następne zamówienie.";
    }
    return "Rabat za ilość jest dla Ciebie lepszy. Kod zostaje na następne zamówienie.";
  }
  if (input.offerGrosze > input.volumeGrosze) {
    if (input.offerKind === "voucher") {
      return "Voucher jest dla Ciebie lepszy. Rabat za ilość nie wchodzi.";
    }
    return "Kod jest dla Ciebie lepszy. Rabat za ilość nie wchodzi.";
  }
  return null;
}

export function discountKindLabel(source: string | null, pct: number | null): string {
  if (source === "volume") {
    return pct ? `Rabat za ilość −${pct}%` : "Rabat za ilość";
  }
  if (source === "voucher") {
    return pct ? `Voucher −${pct}%` : "Voucher";
  }
  if (source === "code") {
    return pct ? `Kod −${pct}%` : "Kod";
  }
  return "Rabat";
}

export function stripeCouponName(
  source: string | null,
  pct: number | null,
  code: string | null,
): string {
  if (source === "volume" && pct) {
    return `Rabat za ilość ${pct}%`;
  }
  if (source === "voucher") {
    return "Voucher Adjano Deli";
  }
  if (source === "code" && code) {
    return code;
  }
  return "Rabat Adjano Deli";
}
