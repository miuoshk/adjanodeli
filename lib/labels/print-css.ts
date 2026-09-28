import { LABEL_FORMATS, type LabelFormat } from "@/lib/labels/formats";

const TYPE = {
  etykieta: {
    code: "30pt",
    customer: "12pt",
    meta: "10pt",
    items: "10pt",
    itemLines: 4,
    note: "9pt",
    number: "8pt",
    logo: "18mm",
    pad: "3mm",
  },
  a4: {
    code: "34pt",
    customer: "14pt",
    meta: "12pt",
    items: "12pt",
    itemLines: 7,
    note: "11pt",
    number: "9pt",
    logo: "24mm",
    pad: "5mm",
  },
} as const;

export function labelItemLines(format: LabelFormat): number {
  return TYPE[format].itemLines;
}

export function labelPrintCss(format: LabelFormat, cutLines: boolean): string {
  const spec = LABEL_FORMATS[format];
  const type = TYPE[format];
  const sheet =
    format === "a4"
      ? `
        .label-sheet {
          width: calc(${spec.width} * 2);
          height: calc(${spec.height} * 4);
          display: grid;
          grid-template-columns: ${spec.width} ${spec.width};
          grid-template-rows: ${spec.height} ${spec.height} ${spec.height} ${spec.height};
        }
      `
      : `
        .label-sheet {
          width: ${spec.width};
          height: ${spec.height};
        }
      `;
  const cuts =
    format === "a4" && cutLines
      ? `.pack-label { border: 0.3mm dashed #c5c5c5; }`
      : `.pack-label { border: 0; }`;

  return `
    ${sheet}
    .label-sheet {
      box-sizing: border-box;
      break-after: page;
      page-break-after: always;
      background: #fff;
    }
    .label-sheet:last-child {
      break-after: auto;
      page-break-after: auto;
    }
    .pack-label {
      box-sizing: border-box;
      width: ${spec.width};
      height: ${spec.height};
      padding: ${type.pad};
      overflow: hidden;
      display: flex;
      flex-direction: column;
      break-inside: avoid;
      page-break-inside: avoid;
      color: #000;
      background: #fff;
    }
    ${cuts}
    .pack-label-body {
      min-height: 0;
      flex: 1;
      overflow: hidden;
    }
    .pack-label-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 2mm; }
    .pack-label-logo { width: ${type.logo}; height: auto; }
    .pack-label-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: ${type.code};
      font-weight: 700;
      letter-spacing: 0.04em;
      line-height: 1;
      margin: 0;
    }
    .pack-label-name {
      font-size: ${type.customer};
      font-weight: 600;
      line-height: 1.2;
      margin: 1mm 0 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pack-label-meta {
      font-size: ${type.meta};
      line-height: 1.2;
      margin: 0.6mm 0 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pack-label-items {
      margin: 1mm 0 0;
      padding: 0;
      list-style: none;
      font-size: ${type.items};
      line-height: 1.2;
    }
    .pack-label-items li {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pack-label-note {
      font-size: ${type.note};
      line-height: 1.2;
      margin: 1mm 0 0;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }
    .pack-label-number {
      flex: none;
      margin: 1mm 0 0;
      font-size: ${type.number};
      line-height: 1.2;
    }
    @page { size: ${spec.page}; margin: 0; }
    @media screen {
      .label-sheet { margin: 0 auto 8mm; }
      .pack-label { outline: 0.2mm solid #ddd; }
    }
    @media print {
      .label-sheet { margin: 0; }
      .pack-label { outline: none; }
    }
  `;
}
