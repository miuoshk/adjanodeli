import Link from "next/link";

import { OrderActions } from "@/components/admin/order-actions";
import { OrdersFilters } from "@/components/admin/orders-filters";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminFilterOptions, getAdminOrderList } from "@/lib/admin/queries";
import { getProfile, requireRole } from "@/lib/auth";
import { parseDateOnly } from "@/lib/dates";
import { formatDatePl, formatPrice } from "@/lib/format";
import { isOrderStatus } from "@/lib/orders/status-labels";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Search = {
  dzien?: string;
  punkt?: string;
  status?: string | string[];
  q?: string;
  strona?: string;
  faktura?: string;
};

type PageProps = {
  searchParams: Promise<Search>;
};

function parseStatuses(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value : value ? value.split(",") : [];
  return raw.filter((item) => isOrderStatus(item));
}

function buildExportHref(params: Search, day: string): string {
  const next = new URLSearchParams();
  next.set("dzien", day);
  if (params.punkt) {
    next.set("punkt", params.punkt);
  }
  for (const status of parseStatuses(params.status)) {
    next.append("status", status);
  }
  if (params.q) {
    next.set("q", params.q);
  }
  if (params.faktura === "1") {
    next.set("faktura", "1");
  }
  return `/api/admin/orders/export?${next.toString()}`;
}

function buildPageHref(params: Search, page: number): string {
  const next = new URLSearchParams();
  if (params.dzien) {
    next.set("dzien", params.dzien);
  }
  if (params.punkt) {
    next.set("punkt", params.punkt);
  }
  const statuses = parseStatuses(params.status);
  for (const status of statuses) {
    next.append("status", status);
  }
  if (params.q) {
    next.set("q", params.q);
  }
  if (params.faktura === "1") {
    next.set("faktura", "1");
  }
  if (page > 1) {
    next.set("strona", String(page));
  }
  const query = next.toString();
  return query ? `/admin/zamowienia?${query}` : "/admin/zamowienia";
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  await requireRole("staff", "/admin/zamowienia");
  const params = await searchParams;
  const profile = await getProfile();
  const isOwner = profile?.role === "owner";

  const { dates, points } = await getAdminFilterOptions();
  const defaultDay = dates[0] ?? "wszystkie";
  const day =
    params.dzien === "wszystkie"
      ? "wszystkie"
      : params.dzien && /^\d{4}-\d{2}-\d{2}$/.test(params.dzien)
        ? params.dzien
        : defaultDay;
  const statuses = parseStatuses(params.status);
  const page = Math.max(1, Number.parseInt(params.strona ?? "1", 10) || 1);

  const invoiceOnly = params.faktura === "1";
  const list = await getAdminOrderList({
    day,
    pointId: params.punkt || null,
    statuses,
    q: params.q ?? "",
    page,
    invoiceOnly,
  });

  const pageCount = Math.max(1, Math.ceil(list.total / list.pageSize));
  const from = list.total === 0 ? 0 : (list.page - 1) * list.pageSize + 1;
  const to = Math.min(list.page * list.pageSize, list.total);

  return (
    <div className="space-y-6">
      <PageHeader title="Zamówienia">
        {isOwner ? (
          <Link href={buildExportHref(params, day)} className="min-h-12 underline-offset-4 hover:underline">
            Eksport CSV
          </Link>
        ) : null}
      </PageHeader>
      <OrdersFilters
        dates={dates}
        points={points}
        day={day}
        pointId={params.punkt ?? ""}
        statuses={statuses}
        q={params.q ?? ""}
        invoiceOnly={invoiceOnly}
      />

      {list.total === 0 ? (
        <p className="text-sm text-muted-foreground">Brak zamówień dla tych filtrów.</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {from}–{to} z {list.total}
          </p>
          <div className="rounded-xl border border-[var(--adj-cream-dark)] bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead>Punkt</TableHead>
                  <TableHead>Dzień</TableHead>
                  <TableHead>Pozycje</TableHead>
                  <TableHead>Suma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kod</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.rows.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/admin/zamowienia/${order.id}`} className="font-medium underline-offset-4 hover:underline">
                        #{order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p>{order.customerName}</p>
                      {order.customerPhone ? (
                        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>{order.pointName}</TableCell>
                    <TableCell>{formatDatePl(parseDateOnly(order.pickupDate))}</TableCell>
                    <TableCell className="max-w-56 whitespace-normal">{order.itemsSummary}</TableCell>
                    <TableCell>{formatPrice(order.totalGrosze)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="font-heading tracking-widest">
                      {order.pickupCode ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <OrderActions
                        orderId={order.id}
                        status={order.status}
                        isOwner={isOwner}
                        variant="menu"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3">
              {page > 1 ? (
                <Link href={buildPageHref(params, page - 1)} className="min-h-12 underline-offset-4 hover:underline">
                  Poprzednia
                </Link>
              ) : (
                <span />
              )}
              <p className="text-sm">
                {page} / {pageCount}
              </p>
              {page < pageCount ? (
                <Link href={buildPageHref(params, page + 1)} className="min-h-12 underline-offset-4 hover:underline">
                  Następna
                </Link>
              ) : (
                <span />
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
