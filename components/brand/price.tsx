import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Price({
  grosze,
  regularGrosze,
  size = "md",
}: {
  grosze: number;
  regularGrosze?: number;
  size?: "md" | "lg";
}) {
  const promo = regularGrosze != null && regularGrosze > grosze;

  return (
    <span
      className={cn(
        "adj-ui font-semibold tabular-nums",
        size === "lg" ? "text-[22px]" : "text-[17px]",
      )}
    >
      <span className={promo ? "text-[var(--adj-red)]" : undefined}>{formatPrice(grosze)}</span>
      {promo && regularGrosze != null ? (
        <span className="ml-2 font-normal text-[var(--adj-ink-soft)] line-through">
          {formatPrice(regularGrosze)}
        </span>
      ) : null}
    </span>
  );
}
