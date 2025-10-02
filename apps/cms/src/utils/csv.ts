// FILE: apps/cms/src/utils/csv.ts
// Language: TypeScript

/**
 * Tiny zero-dependency CSV parser with quote handling.
 * - Supports commas, double quotes, escaped quotes ("")
 * - Handles CRLF / LF newlines
 * - Trims a UTF-8 BOM if present
 */
export type ParsedCSV = { headers: string[]; rows: string[][] };

export function parseCSV(inputRaw: string): ParsedCSV {
  const input = stripBOM(inputRaw);
  const rows: string[][] = [];

  let inQuotes = false;
  let cell = "";
  const pushCell = (row: string[]) => {
    row.push(cell);
    cell = "";
  };

  let row: string[] = [];
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    const next = i + 1 < input.length ? input[i + 1] : null;

    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          cell += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      pushCell(row);
      continue;
    }

    if (ch === "\r") {
      // normalize CRLF or single CR
      if (next === "\n") i++;
      pushCell(row);
      rows.push(row);
      row = [];
      continue;
    }

    if (ch === "\n") {
      pushCell(row);
      rows.push(row);
      row = [];
      continue;
    }

    cell += ch;
  }

  // flush last cell/row
  pushCell(row);
  // Avoid adding a trailing empty row if file ends with newline
  if (!(row.length === 1 && row[0] === "")) {
    rows.push(row);
  }

  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0]!;
  const dataRows = rows.slice(1);

  return { headers, rows: dataRows };
}

export function normalizeHeader(h: string): string {
  return h.trim().replace(/\s+/g, " ").toLowerCase();
}

function stripBOM(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}
