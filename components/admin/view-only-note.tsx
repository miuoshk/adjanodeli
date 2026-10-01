export function ViewOnlyNote({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }
  return <p className="text-sm text-muted-foreground">Tylko podgląd</p>;
}
