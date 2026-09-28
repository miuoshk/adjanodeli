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
          cursor: pointer;
        }
        .print-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }
        .print-title {
          font-family: var(--font-heading), serif;
          font-size: 20pt;
          font-weight: 600;
          margin: 0;
        }
        .print-switches {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        .print-switch {
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          padding: 0 14px;
          border: 1px solid #000;
          background: #fff;
          color: #000;
          text-decoration: none;
          font-size: 13pt;
        }
        .print-switch.is-active {
          background: #000;
          color: #fff;
        }
        .print-hint {
          margin: 8px 0 0;
          font-size: 11pt;
        }
        @media print {
          .print-root { min-height: 0; padding: 0; }
          .no-print, .print-toolbar { display: none !important; }
        }
      `}</style>
      {children}
    </div>
  );
}
