import { PrintButton } from "@/components/admin/print-button";
import { getNearestOrderDay, getPackagesData } from "@/lib/admin/queries";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl } from "@/lib/format";

type PackageLabelsPageProps = {
  searchParams: Promise<{ dzien?: string; punkt?: string }>;
};

export default async function PackageLabelsPage({ searchParams }: PackageLabelsPageProps) {
  const params = await searchParams;
  const day =
    params.dzien && /^\d{4}-\d{2}-\d{2}$/.test(params.dzien)
      ? params.dzien
      : await getNearestOrderDay();
  const data = await getPackagesData(day);
  const sections = params.punkt
    ? data.sections.filter((section) => section.point.id === params.punkt)
    : data.sections;
  const labels = sections.flatMap((section) =>
    section.packages.map((item) => ({
      ...item,
      pointName: section.point.name,
    })),
  );

  const titlePoint = sections.length === 1 ? sections[0].point.name : "wszystkie punkty";

  return (
    <div>
      <div className="print-toolbar">
        <div>
          <h1 className="print-title">
            Etykiety — {formatDatePl(parseDateOnly(day))}
          </h1>
          <p>{titlePoint}</p>
        </div>
        <PrintButton label="Drukuj etykiety" />
      </div>

      {labels.length === 0 ? (
        <p>Brak paczek do etykiet.</p>
      ) : (
        <div className="label-grid">
          {labels.map((item) => (
            <article key={item.id} className="pack-label">
              <p className="pack-label-code">{item.pickupCode}</p>
              <p className="pack-label-name">{item.customerName}</p>
              <p className="pack-label-meta">
                {item.pointName} · {formatDatePl(parseDateOnly(day))}
              </p>
              <ul className="pack-label-items">
                {item.items.map((line) => (
                  <li key={`${item.id}-${line.name}`}>
                    {line.qty}× {line.name}
                  </li>
                ))}
              </ul>
              {item.note?.trim() ? <p className="pack-label-note">Uwaga: {item.note.trim()}</p> : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
