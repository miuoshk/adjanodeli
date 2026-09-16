import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth";

export default async function PackageLabelsPrintLayout({ children }: { children: ReactNode }) {
  await requireRole("staff", "/admin/paczki/drukuj");
  return (
    <div className="print-root">
      <style>{`
        .print-root {
          min-height: 100vh;
          background: #fff;
          color: #000;
          font-size: 14pt;
          line-height: 1.3;
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
          font-size: 20pt;
          font-weight: 600;
          margin: 0;
        }
        .label-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12pt;
        }
        .pack-label {
          border: 2px solid #000;
          padding: 12pt;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .pack-label-code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 32pt;
          font-weight: 700;
          letter-spacing: 0.06em;
          line-height: 1;
          margin: 0 0 8pt;
        }
        .pack-label-name {
          font-size: 16pt;
          font-weight: 600;
          margin: 0 0 4pt;
        }
        .pack-label-meta,
        .pack-label-items,
        .pack-label-note {
          margin: 0 0 6pt;
        }
        .pack-label-items {
          padding-left: 18pt;
        }
        @media print {
          .print-root {
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      {children}
    </div>
  );
}
