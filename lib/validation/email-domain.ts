const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

export function normalizeEmailDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^@/, "");
}

export function isValidEmailDomain(value: string): boolean {
  const domain = normalizeEmailDomain(value);
  return DOMAIN_RE.test(domain);
}

export function parseEmailDomains(values: string[]): { ok: true; domains: string[] } | { ok: false } {
  const domains: string[] = [];
  for (const raw of values) {
    const domain = normalizeEmailDomain(raw);
    if (!domain) {
      continue;
    }
    if (!isValidEmailDomain(domain)) {
      return { ok: false };
    }
    if (!domains.includes(domain)) {
      domains.push(domain);
    }
  }
  return { ok: true, domains };
}
