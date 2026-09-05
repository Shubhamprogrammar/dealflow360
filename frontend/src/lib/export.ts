function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown): string {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/** Exports rows as a .csv file, which Excel/Sheets opens natively. */
export function exportToXls(filename: string, columns: string[], rows: (string | number)[][]) {
  const lines = [columns, ...rows].map((row) => row.map(csvEscape).join(','));
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/** Opens the browser print dialog scoped to the current page's print styles, so the user can Save as PDF. */
export function exportToPdf() {
  window.print();
}
