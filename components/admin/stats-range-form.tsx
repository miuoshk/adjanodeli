import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StatsRangeFormProps = {
  from: string;
  to: string;
};

export function StatsRangeForm({ from, to }: StatsRangeFormProps) {
  return (
    <form method="get" className="flex flex-col gap-4 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4 sm:flex-row sm:items-end">
      <div className="space-y-2">
        <Label htmlFor="od">Od</Label>
        <Input id="od" name="od" type="date" defaultValue={from} className="h-12 min-h-12" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="do">Do</Label>
        <Input id="do" name="do" type="date" defaultValue={to} className="h-12 min-h-12" />
      </div>
      <Button type="submit" className="min-h-12">
        Pokaż
      </Button>
    </form>
  );
}
