import type { ResourceName, StoredRecord } from "../domain/types";

function flattenRecord(
  record: Record<string, unknown>,
  prefix = "",
): Record<string, string | number | boolean | null> {
  const flattened: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(record)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      flattened[path] = JSON.stringify(value);
    } else if (value !== null && typeof value === "object") {
      Object.assign(
        flattened,
        flattenRecord(value as Record<string, unknown>, path),
      );
    } else if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      flattened[path] = value;
    }
  }

  return flattened;
}

function neutralizeSpreadsheetFormula(value: string): string {
  return /^[\t\r +\-=@]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number | boolean | null | undefined): string {
  const text = neutralizeSpreadsheetFormula(
    value === null || value === undefined ? "" : String(value),
  );
  return `"${text.replaceAll('"', '""')}"`;
}

export function recordsToCsv(records: StoredRecord[]): string {
  const flattened = records.map((record) => flattenRecord(record.localData));
  const columns = Array.from(
    new Set(flattened.flatMap((record) => Object.keys(record))),
  ).sort((left, right) => left.localeCompare(right));

  const rows = [
    columns.map(csvCell).join(","),
    ...flattened.map((record) =>
      columns.map((column) => csvCell(record[column])).join(","),
    ),
  ];
  return `\uFEFF${rows.join("\r\n")}`;
}

export function recordsToJson(
  resource: ResourceName,
  records: StoredRecord[],
  exportedAt = new Date(),
): string {
  return JSON.stringify(
    {
      application: "API Sync Workbench",
      resource,
      exportedAt: exportedAt.toISOString(),
      count: records.length,
      records: records.map((record) => record.localData),
    },
    null,
    2,
  );
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
