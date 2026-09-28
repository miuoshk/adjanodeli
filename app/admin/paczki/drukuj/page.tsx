import { PrintButton } from "@/components/admin/print-button";
import { getNearestOrderDay, getPackagesData } from "@/lib/admin/queries";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl } from "@/lib/format";
import { LABEL_FORMATS, type LabelFormat } from "@/lib/labels/formats";
import { chunkForPages, fitLabelItems } from "@/lib/labels/fit-label";
import { maskCustomerName } from "@/lib/labels/mask-customer-name";
import { labelItemLines, labelPrintCss } from "@/lib/labels/print-css";

type PackageLabelsPageProps = {
  searchParams: Promise<{ dzien?: string; punkt?: string; format?: string; linie?: string }>;
};

function chosenFormat(value: string | undefined): LabelFormat {
  return value === "a4" ? "a4" : "etykieta";
}

function printHref(
  day: string,
  point: string | undefined,
  format: LabelFormat,
  cutLines: boolean,
): string {
  const query = new URLSearchParams({ dzien: day, format });
  if (point) {
    query.set("punkt", point);
  }
  if (format === "a4" && !cutLines) {
    query.set("linie", "0");
  }
  return `/admin/paczki/drukuj?${query.toString()}`;
}

export default async function PackageLabelsPage({ searchParams }: PackageLabelsPageProps) {
  const params = await searchParams;
  const day =
    params.dzien && /^\d{4}-\d{2}-\d{2}$/.test(params.dzien)
      ? params.dzien
      : await getNearestOrderDay();
  const format = chosenFormat(params.format);
  const cutLines = format === "a4" && params.linie !== "0";
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
  const pages = chunkForPages(labels, LABEL_FORMATS[format].perPage);
  const maxItemLines = labelItemLines(format);
  const titlePoint = sections.length === 1 ? sections[0].point.name : "wszystkie punkty";

  return (
    <div>
      <style>{labelPrintCss(format, cutLines)}</style>
      <div className="print-toolbar">
        <div>
          <h1 className="print-title">Etykiety — {formatDatePl(parseDateOnly(day))}</h1>
          <p>{titlePoint}</p>
          <p className="print-hint">
            W oknie druku: skala 100%, marginesy: brak, bez nagłówków i stopek.
          </p>
        </div>
        <div>
          <div className="print-switches">
            <a
              className={`print-switch${format === "etykieta" ? " is-active" : ""}`}
              href={printHref(day, params.punkt, "etykieta", true)}
            >
              Etykieciarka 7,5 × 6 cm
            </a>
            <a
              className={`print-switch${format === "a4" ? " is-active" : ""}`}
              href={printHref(day, params.punkt, "a4", true)}
            >
              A4 (8 na stronie)
            </a>
            {format === "a4" ? (
              <a
                className={`print-switch${cutLines ? " is-active" : ""}`}
                href={printHref(day, params.punkt, "a4", !cutLines)}
              >
                {cutLines ? "☑" : "☐"} Linie cięcia
              </a>
            ) : null}
          </div>
          <PrintButton label={format === "a4" ? "Drukuj na A4" : "Drukuj na etykieciarce"} />
        </div>
      </div>

      {labels.length === 0 ? (
        <p>Brak paczek do etykiet.</p>
      ) : (
        <div>
          {pages.map((page, pageIndex) => (
            <section key={page[0]?.id ?? pageIndex} className="label-sheet">
              {page.map((item) => {
                const lines = fitLabelItems(item.items, maxItemLines);
                return (
                  <article key={item.id} className="pack-label">
                    <div className="pack-label-body">
                      <div className="pack-label-head">
                        <p className="pack-label-code">{item.pickupCode}</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/brand/logo/adjano-deli-tusz.svg" alt="" className="pack-label-logo" />
                      </div>
                      <p className="pack-label-name">{maskCustomerName(item.customerName)}</p>
                      <p className="pack-label-meta">
                        {item.pointName} · {formatDatePl(parseDateOnly(day))}
                      </p>
                      <ul className="pack-label-items">
                        {lines.shown.map((line) => (
                          <li key={`${item.id}-${line.name}`}>
                            {line.qty}× {line.name}
                          </li>
                        ))}
                        {lines.more > 0 ? <li>+ {lines.more} pozycji więcej</li> : null}
                      </ul>
                      {item.note?.trim() ? (
                        <p className="pack-label-note">Uwaga: {item.note.trim()}</p>
                      ) : null}
                    </div>
                    <p className="pack-label-number">#{item.orderNumber}</p>
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
