/**
 * Minimal RFC 4180 CSV serialization — no library needed for a handful of
 * columns. A field is quoted only when it contains a comma, quote, or
 * newline; an embedded quote is doubled, per spec.
 */
export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((fields) =>
    fields.map(escapeCsvField).join(","),
  );
  return lines.join("\r\n") + "\r\n";
}

function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
