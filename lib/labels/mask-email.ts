/** First two characters of the local part, then bullets, then @domain. Shorter than 3: first character. */
export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0 || at === trimmed.length - 1) {
    return trimmed;
  }
  const local = Array.from(trimmed.slice(0, at));
  const domain = trimmed.slice(at);
  const head = local.length < 3 ? local.slice(0, 1) : local.slice(0, 2);
  return `${head.join("")}•••${domain}`;
}
