import { describe, expect, it } from "vitest";
import type { StoredRecord } from "../domain/types";
import { recordsToCsv, recordsToJson } from "./exportData";

const record: StoredRecord = {
  key: "products:1",
  resource: "products",
  id: 1,
  localData: {
    id: 1,
    title: "=HYPERLINK(\"https://example.com\")",
    dimensions: { width: 10, height: 20 },
    tags: ["desk", "light"],
  },
  sourceData: { id: 1 },
  localHash: "local",
  sourceHash: "source",
  lastSyncedAt: "2026-09-20T10:00:00.000Z",
  localModifiedAt: null,
};

describe("exportData", () => {
  it("flattens nested fields and neutralizes spreadsheet formulas", () => {
    const csv = recordsToCsv([record]);

    expect(csv).toContain('"dimensions.width"');
    expect(csv).toContain('"[""desk"",""light""]"');
    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"")"');
  });

  it("exports only the local data with provenance metadata", () => {
    const json = JSON.parse(
      recordsToJson("products", [record], new Date("2026-09-20T12:00:00.000Z")),
    ) as Record<string, unknown>;

    expect(json).toMatchObject({
      application: "API Sync Workbench",
      resource: "products",
      count: 1,
      exportedAt: "2026-09-20T12:00:00.000Z",
    });
    expect(json.records).toEqual([record.localData]);
  });
});
