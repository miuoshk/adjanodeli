export const ARRIVED_POINT_KEY = "adjanodeli-arrived-point";

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export function rememberArrivedPoint(storage: StorageLike, day: string, pointId: string): void {
  try {
    storage.setItem(ARRIVED_POINT_KEY, JSON.stringify({ day, pointId }));
  } catch {
    // Tryb prywatny albo pełny dysk. Wydawanie wróci do pierwszego punktu.
  }
}

export function readArrivedPoint(storage: StorageLike, day: string): string | null {
  try {
    const raw = storage.getItem(ARRIVED_POINT_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const pointId = "pointId" in parsed ? parsed.pointId : null;
    const storedDay = "day" in parsed ? parsed.day : null;
    if (storedDay !== day || typeof pointId !== "string" || pointId.length === 0) {
      return null;
    }
    return pointId;
  } catch {
    return null;
  }
}
