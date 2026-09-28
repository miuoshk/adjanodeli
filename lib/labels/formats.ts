export const LABEL_FORMATS = {
  etykieta: { name: "Etykieciarka", page: "75mm 60mm", width: "75mm", height: "60mm", perPage: 1 },
  a4: { name: "A4, 8 na stronie", page: "A4", width: "105mm", height: "74.25mm", perPage: 8 },
} as const;

export type LabelFormat = keyof typeof LABEL_FORMATS;
