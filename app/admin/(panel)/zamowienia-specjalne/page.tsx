import { PageHeader } from "@/components/admin/page-header";
import { SpecialRequestStatus } from "@/components/admin/special-request-status";
import { ViewOnlyNote } from "@/components/admin/view-only-note";
import { isViewOnly } from "@/lib/admin/staff-access";
import { requireStaffPermission } from "@/lib/auth";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl } from "@/lib/format";
import { createServerClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  new: "Nowe",
  contacted: "Skontaktowane",
  closed: "Zamknięte",
};

export default async function SpecialRequestsAdminPage() {
  const profile = await requireStaffPermission("special_requests", "/admin/zamowienia-specjalne");
  const canManage = !isViewOnly(profile, "special_requests");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("special_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("special_requests", error.message);
  }

  const rows = data ?? [];

  return (
    <div>
      <PageHeader title="Zamówienia specjalne" />
      <ViewOnlyNote show={!canManage} />
      {error ? (
        <p className="text-sm">Nie udało się wczytać zapytań. Odśwież stronę.</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nie ma jeszcze zapytań.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li
              key={row.id}
              className="space-y-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.name?.trim() || "Bez nazwy"}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(row.created_at).toLocaleString("pl-PL", {
                      timeZone: "Europe/Warsaw",
                    })}
                    {row.wanted_date
                      ? ` · na ${formatDatePl(parseDateOnly(row.wanted_date.slice(0, 10)))}`
                      : ""}
                  </p>
                </div>
                {canManage ? <SpecialRequestStatus id={row.id} status={row.status ?? "new"} /> : null}
              </div>
              <p className="whitespace-pre-wrap">{row.description}</p>
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {row.phone ? (
                  <a href={`tel:${row.phone}`} className="underline underline-offset-4">
                    {row.phone}
                  </a>
                ) : null}
                {row.email ? (
                  <a href={`mailto:${row.email}`} className="underline underline-offset-4">
                    {row.email}
                  </a>
                ) : null}
                <span className="text-muted-foreground">
                  {STATUS_LABEL[row.status ?? "new"] ?? row.status}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
