import { Minus, Plus } from "lucide-react";

export function QtyStepper({
  value,
  onDecrease,
  onIncrease,
  label,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  label?: string;
}) {
  return (
    <div
      className="inline-flex items-center rounded-[6px] border border-[var(--adj-ink)]/30"
      aria-label={label}
    >
      <button
        type="button"
        className="inline-flex size-12 items-center justify-center"
        onClick={onDecrease}
        aria-label="Zmniejsz ilość"
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span className="adj-ui min-w-9 text-center text-lg font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="inline-flex size-12 items-center justify-center"
        onClick={onIncrease}
        aria-label="Zwiększ ilość"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
