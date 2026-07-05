/*
 * toCsvField
 * Quotes a single CSV field per RFC 4180 when it contains a comma, quote,
 * or newline; doubles any embedded quotes. Nullish values become "".
 */
function toCsvField(value: string | null | undefined): string {
  const raw = value ?? "";
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

/*
 * toCsvRow
 * Joins already-stringified field values into one properly escaped CSV line
 * (no trailing newline — callers join rows with "\n").
 */
export function toCsvRow(fields: Array<string | null | undefined>): string {
  return fields.map(toCsvField).join(",");
}

/*
 * buildCsv
 * Builds a full CSV document (header + rows), CRLF-joined per RFC 4180.
 */
export function buildCsv(header: string[], rows: Array<Array<string | null | undefined>>): string {
  return [toCsvRow(header), ...rows.map(toCsvRow)].join("\r\n");
}

/*
 * parseCsv
 * Minimal RFC-4180 CSV parser: handles quoted fields containing commas,
 * newlines, and escaped ("") quotes. Returns one string[] per row (header
 * row included — callers slice it off). Trailing blank lines are dropped.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (char === "\r") {
      i += 1;
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}
