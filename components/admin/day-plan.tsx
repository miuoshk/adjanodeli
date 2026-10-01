import type { ReactNode } from "react";
import Link from "next/link";

import { StartProductionButton } from "@/components/admin/start-production-button";
import { Button } from "@/components/ui/button";
import type { DashboardPointRow } from "@/lib/admin/queries";

type DayPlanProps = {
  day: string;
  paidReadyCount: number;
  points: DashboardPointRow[];
  access: {
    production: boolean;
    productionManage: boolean;
    packages: boolean;
    handover: boolean;
  };
};

function ordersPhrase(count: number): string {
  if (count === 1) {
    return "1 zamówienie";
  }
  const rest10 = count % 10;
  const rest100 = count % 100;
  if (rest10 >= 2 && rest10 <= 4 && (rest100 < 12 || rest100 > 14)) {
    return `${count} zamówienia`;
  }
  return `${count} zamówień`;
}

function Step({
  index,
  title,
  done,
  children,
}: {
  index: number;
  title: string;
  done: boolean;
  children: ReactNode;
}) {
  return (
    <li className={`rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4 ${done ? "opacity-70" : ""}`}>
      <p className="text-sm font-medium">
        {done ? <span className="text-[var(--adj-red)]">✓ </span> : null}
        {index}. {title}
      </p>
      <div className={`mt-3 space-y-3 ${done ? "text-muted-foreground" : ""}`}>{children}</div>
    </li>
  );
}

export function DayPlan({ day, paidReadyCount, points, access }: DayPlanProps) {
  const active = points.filter((point) => point.orderCount > 0);
  const startedCount = active.reduce(
    (sum, point) => sum + point.inProductionCount + point.deliveredCount + point.pickedUpCount,
    0,
  );
  const productionDone = active.length > 0 && paidReadyCount === 0 && startedCount > 0;
  const labelsDone = productionDone;
  const deliveriesDone =
    active.length > 0 &&
    active.every((point) => point.paidCount + point.inProductionCount === 0);
  const handoverDone =
    active.length > 0 && active.every((point) => point.pickedUpCount === point.orderCount);

  return (
    <ol className="mt-6 grid grid-cols-1 gap-3">
      <Step index={1} title="Produkcja" done={productionDone}>
        {paidReadyCount > 0 ? (
          access.productionManage ? (
            <StartProductionButton day={day} paidCount={paidReadyCount} label="Rozpocznij produkcję" />
          ) : (
            <p>Opłacone: {ordersPhrase(paidReadyCount)}</p>
          )
        ) : startedCount > 0 ? (
          <p>Rozpoczęta: {ordersPhrase(startedCount)}</p>
        ) : (
          <p>Brak opłaconych zamówień.</p>
        )}
        {access.production ? (
          <Button asChild variant="outline" className="min-h-12 w-full sm:w-auto">
            <Link href={`/admin/produkcja?dzien=${day}`}>Lista do pieczenia</Link>
          </Button>
        ) : null}
      </Step>
      <Step index={2} title="Etykiety" done={labelsDone}>
        {access.packages ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="min-h-12 w-full sm:w-auto">
              <Link href={`/admin/paczki/drukuj?dzien=${day}&format=etykieta`}>Etykiety: etykieciarka</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-12 w-full sm:w-auto">
              <Link href={`/admin/paczki/drukuj?dzien=${day}&format=a4`}>Etykiety: A4</Link>
            </Button>
          </div>
        ) : null}
      </Step>
      <Step index={3} title="Dostawy" done={deliveriesDone}>
        {active.length === 0 ? (
          <p>Brak paczek na ten dzień.</p>
        ) : (
          <ul className="space-y-2">
            {active.map((point) => {
              const onSite = point.paidCount + point.inProductionCount === 0;
              return (
                <li key={point.pointId}>
                  {point.name}
                  {": "}
                  {onSite
                    ? `na miejscu, powiadomiono ${point.notifiedCount} z ${point.orderCount}`
                    : "w drodze"}
                </li>
              );
            })}
          </ul>
        )}
        {access.packages ? (
          <Button asChild variant="outline" className="min-h-12 w-full sm:w-auto">
            <Link href={`/admin/paczki?dzien=${day}`}>Paczki</Link>
          </Button>
        ) : null}
      </Step>
      <Step index={4} title="Wydawanie" done={handoverDone}>
        {active.length === 0 ? (
          <p>Brak paczek na ten dzień.</p>
        ) : (
          <ul className="space-y-2">
            {active.map((point) => (
              <li key={point.pointId}>
                {point.name}: wydane {point.pickedUpCount} z {point.orderCount}
              </li>
            ))}
          </ul>
        )}
        {access.handover ? (
          <Button asChild variant="outline" className="min-h-12 w-full sm:w-auto">
            <Link href={`/admin/wydawanie?dzien=${day}`}>Wydawanie</Link>
          </Button>
        ) : null}
      </Step>
    </ol>
  );
}
