export function tagBadgeClass(color: string): string {
  if (color === "khaki") {
    return "bg-[var(--adj-khaki)] text-[var(--adj-cream)]";
  }
  if (color === "red") {
    return "bg-[var(--adj-red)] text-white";
  }
  return "bg-[var(--adj-gold)] text-[var(--adj-ink)]";
}
