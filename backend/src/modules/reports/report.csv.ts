/** Minimal RFC 4180 writer; the project has no CSV dependency and needs only this shape. */
const escape = (value: string | number | undefined): string => {
  const text = value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = <T extends Record<string, string | number>>(
  columns: (keyof T & string)[],
  rows: T[],
): string =>
  [columns.join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))]
    .join('\r\n')
    .concat('\r\n');
