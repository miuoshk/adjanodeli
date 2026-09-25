/**
 * Polska typografia: jednoliterowe spójniki i przyimki (a, i, o, u, w, z)
 * nie mogą zostać na końcu wiersza — sklejamy je twardą spacją z następnym słowem.
 * Używaj dla tekstów z bazy (nazwy kategorii, produktów). W JSX statycznym pisz &nbsp;.
 */
export function nbsp(text: string): string {
  return text.replace(/(?<=^|[\s\u00A0(„"])([aiouwzAIOUWZ])\s+/g, "$1\u00A0");
}
