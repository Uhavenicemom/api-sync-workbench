import { describe, expect, it } from "vitest";
import { hashRecord } from "./hash";
import {
  buildSyncPreview,
  recordKey,
  simulateUpstreamChange,
} from "./syncEngine";
import type { FetchResult, SourceRecord, StoredRecord } from "./types";

const source: SourceRecord = {
  id: 1,
  title: "Desk lamp",
  description: "A focused lamp",
  category: "lighting",
  price: 42,
  stock: 12,
  thumbnail: "https://example.com/lamp.png",
};

async function storedRecord(
  local: SourceRecord,
  base: SourceRecord = source,
): Promise<StoredRecord> {
  return {
    key: recordKey("products", 1),
    resource: "products",
    id: 1,
    localData: local,
    sourceData: base,
    localHash: await hashRecord(local),
    sourceHash: await hashRecord(base),
    lastSyncedAt: "2026-09-20T10:00:00.000Z",
    localModifiedAt: local === base ? null : "2026-09-20T10:10:00.000Z",
  };
}

function fetched(records: SourceRecord[], invalidRecords: FetchResult["invalidRecords"] = []): FetchResult {
  return { records, invalidRecords, total: records.length + invalidRecords.length };
}

describe("buildSyncPreview", () => {
  it("classifies records across the full three-way comparison", async () => {
    const newPreview = await buildSyncPreview("products", fetched([source]), []);
    expect(newPreview.items[0]?.status).toBe("new");

    const unchangedPreview = await buildSyncPreview(
      "products",
      fetched([source]),
      [await storedRecord(source)],
    );
    expect(unchangedPreview.items[0]?.status).toBe("unchanged");

    const remoteUpdate = { ...source, stock: 19 };
    const updatedPreview = await buildSyncPreview(
      "products",
      fetched([remoteUpdate]),
      [await storedRecord(source)],
    );
    expect(updatedPreview.items[0]?.status).toBe("updated");

    const localEdit = { ...source, title: "My desk lamp" };
    const localPreview = await buildSyncPreview(
      "products",
      fetched([source]),
      [await storedRecord(localEdit)],
    );
    expect(localPreview.items[0]?.status).toBe("locally-modified");

    const conflictPreview = await buildSyncPreview(
      "products",
      fetched([remoteUpdate]),
      [await storedRecord(localEdit)],
    );
    expect(conflictPreview.items[0]?.status).toBe("conflict");
  });

  it("keeps invalid source entries visible but excluded", async () => {
    const preview = await buildSyncPreview(
      "users",
      fetched([], [{ index: 3, reason: "email: Invalid email" }]),
      [],
    );

    expect(preview.counts.invalid).toBe(1);
    expect(preview.items[0]).toMatchObject({
      status: "invalid",
      id: null,
      reason: "email: Invalid email",
    });
  });
});

describe("simulateUpstreamChange", () => {
  it("changes only the first locally edited record", async () => {
    const localEdit = { ...source, title: "My desk lamp" };
    const second = { ...source, id: 2, title: "Chair" };
    const result = simulateUpstreamChange(
      [source, second],
      [await storedRecord(localEdit)],
      (record) => ({ ...record, stock: 99 }),
    );

    expect(result.simulatedId).toBe(1);
    expect(result.records[0]?.stock).toBe(99);
    expect(result.records[1]).toEqual(second);
  });
});
