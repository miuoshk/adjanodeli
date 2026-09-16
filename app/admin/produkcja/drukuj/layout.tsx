import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth";

export default async function ProductionPrintLayout({ children }: { children: ReactNode }) {
  await requireRole("staff", "/admin/produkcja/drukuj");
  return (
    <div className="print-root">
      <style>{`
        .print-root {
          min-height: 100vh;
          background: #fff;
          color: #000;
          font-size: 14pt;
          line-height: 1.35;
          padding: 24px;
        }
        .print-action {
          min-height: 48px;
          border: 1px solid #000;
          background: #000;
          color: #fff;
          padding: 0 16px;
          font-size: 14pt;
        }
        .print-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }
        .print-title {
          font-family: var(--font-heading), serif;
          font-size: 22pt;
          font-weight: 600;
          margin: 0;
        }
        .production-print-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14pt;
        }
        .production-print-table th,
        .production-print-table td {
          border: 1px solid #000;
          padding: 6pt 8pt;
          text-align: left;
        }
        .production-print-table .num {
          text-align: right;
        }
        .production-print-table .category-row th {
          background: #eee;
          font-size: 12pt;
          text-transform: uppercase;
        }
        .production-print-table .sum-row td {
          font-weight: 700;
          border-top: 2px solid #000;
        }
        .print-notes {
          margin-top: 28px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .print-notes h2 {
          font-size: 16pt;
          margin: 0 0 8px;
        }
        .print-notes li {
          margin: 0 0 6px;
        }
        .print-block {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        @media print {
          .print-root {
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          thead {
            display: table-header-group;
          }
        }
      `}</style>
      {children}
    </div>
  );
}
