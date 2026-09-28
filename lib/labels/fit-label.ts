export function fitLabelItems<T>(items: T[], maxLines: number): { shown: T[]; more: number } {
  if (maxLines < 1) {
    return { shown: [], more: items.length };
  }
  if (items.length <= maxLines) {
    return { shown: items, more: 0 };
  }
  const shown = items.slice(0, maxLines - 1);
  return { shown, more: items.length - shown.length };
}

export function chunkForPages<T>(items: T[], perPage: number): T[][] {
  if (perPage < 1) {
    return [];
  }
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += perPage) {
    pages.push(items.slice(index, index + perPage));
  }
  return pages;
}
