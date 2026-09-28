function maskPart(part: string): string {
  const chars = Array.from(part);
  if (chars.length <= 2) {
    return part;
  }
  return `${chars.slice(0, 2).join("")}${"*".repeat(chars.length - 2)}`;
}

/** First two letters of each name part, then one asterisk per remaining character. */
export function maskCustomerName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .map(maskPart)
    .join(" ");
}
