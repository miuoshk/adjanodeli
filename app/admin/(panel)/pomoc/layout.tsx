export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .print-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 16px;
          border: 0;
          border-radius: 6px;
          background: var(--adj-red);
          color: #fff;
          font-size: 16px;
          cursor: pointer;
        }
        .help-sheet,
        .route-sheet {
          color: var(--adj-ink);
        }
        .help-sheet h2,
        .route-sheet h1 {
          font-family: var(--font-heading), serif;
        }
        .help-section ol,
        .route-sheet ol {
          padding-left: 1.25rem;
        }
        .help-section li + li,
        .route-sheet li + li {
          margin-top: 0.65rem;
        }
        @media print {
          @page { size: A4; margin: 14mm; }
          html, body {
            background: #fff !important;
            color: #000 !important;
          }
          aside, header, .no-print, .print-action {
            display: none !important;
          }
          main {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .help-sheet, .route-sheet, .help-sheet a, .route-sheet a {
            color: #000 !important;
            background: #fff !important;
          }
          .help-section {
            display: block;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .help-section ol,
          .help-section ul,
          .route-sheet ol,
          .route-sheet li {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .help-section h2 {
            break-after: avoid;
            page-break-after: avoid;
          }
          .route-sheet {
            font-size: 18pt;
            line-height: 1.35;
          }
          .route-sheet h1 {
            font-size: 28pt;
            margin-bottom: 8mm;
          }
          .route-sheet li + li {
            margin-top: 6mm;
          }
        }
      `}</style>
      {children}
    </>
  );
}
