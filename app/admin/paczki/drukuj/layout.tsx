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
          display: flex;
          flex-wrap: wrap;
          gap: 8mm;
        }
        .pack-label {
          box-sizing: border-box;
          width: 75mm;
          height: 60mm;
          border: 1px solid #000;
          padding: 2mm 2.5mm;
          overflow: hidden;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .pack-label-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 2mm; }
        .pack-label-logo { width: 22mm; height: auto; }
        .pack-label-code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 18pt;
          font-weight: 700;
          letter-spacing: 0.04em;
          line-height: 1;
          margin: 0;
        }
        .pack-label-name {
          font-size: 8pt;
          font-weight: 600;
          line-height: 1.2;
          margin: 1.5mm 0 0;
        }
        .pack-label-email {
          font-size: 7pt;
          line-height: 1.2;
          margin: 0.4mm 0 0;
          word-break: break-all;
        }
        .pack-label-meta,
        .pack-label-items,
        .pack-label-note {
          font-size: 8pt;
          line-height: 1.2;
          margin: 1mm 0 0;
        }
        .pack-label-items {
          padding-left: 3.5mm;
        }
        @page {
          size: 75mm 60mm;
          margin: 0;
        }
        @media print {
          .print-root {
            min-height: 0;
            padding: 0;
          }
          .no-print,
          .print-toolbar {
            display: none !important;
          }
          .label-grid {
            display: block;
          }
          .pack-label {
            border: 0;
            break-after: page;
            page-break-after: always;
          }
          .pack-label:last-child {
            break-after: auto;
            page-break-after: auto;
          }
        }
      `}</style>
      {children}
    </div>
  );
}
