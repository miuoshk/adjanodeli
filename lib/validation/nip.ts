const WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7] as const;

export function normalizeNip(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidNip(raw: string): boolean {
  const nip = normalizeNip(raw);
  if (!/^\d{10}$/.test(nip)) {
    return false;
  }

  const sum = WEIGHTS.reduce((total, weight, index) => total + weight * Number(nip[index]), 0);
  const check = sum % 11;
  return check !== 10 && check === Number(nip[9]);
}
