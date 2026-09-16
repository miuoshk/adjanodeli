export type StandingOrderItem = {
  product_id: string;
  qty: number;
};

export const WEEKDAY_LABELS: { id: number; label: string }[] = [
  { id: 1, label: "pon" },
  { id: 2, label: "wt" },
  { id: 3, label: "śr" },
  { id: 4, label: "czw" },
  { id: 5, label: "pt" },
  { id: 6, label: "sob" },
  { id: 7, label: "ndz" },
];
