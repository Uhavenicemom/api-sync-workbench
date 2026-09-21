import { beforeEach, describe, expect, it } from "vitest";
import { buildSyncPreview } from "../domain/syncEngine";
import type { SourceRecord } from "../domain/types";
import {
  applySyncPreview,
  clearAllWorkbenchData,
  getStoredRecords,
  resetDatabaseConnectionForTests,
  saveLocalEdit,
} from "./database";

const product: SourceRecord = {
  id: 1,
  title: "Desk lamp",
  description: "A focused lamp",
  category: "lighting",
  price: 42,
  stock: 12,
  thumbnail: "https://example.com/lamp.png",
};

beforeEach(async () => {
  resetDatabaseConnectionForTests();
  await clearAllWorkbenchData();
});

describe("IndexedDB repository", () => {
  it("applies a preview atomically and persists local edits", async () => {
    const preview = await buildSyncPreview(
      "products",
      { records: [product], invalidRecords: [], total: 1 },
      [],
      new Date("2026-09-20T10:00:00.000Z"),
    );

    await applySyncPreview({
      preview,
      resolutions: new Map(),
      startedAt: new Date("2026-09-20T10:00:00.000Z"),
      completedAt: new Date("2026-09-20T10:00:01.000Z"),
    });

    const [stored] = await getStoredRecords("products");
    expect(stored?.localData).toEqual(product);
    expect(stored?.localHash).toBe(stored?.sourceHash);

    await saveLocalEdit(
      "products:1",
      { ...product, title: "My lamp" },
      new Date("2026-09-20T10:05:00.000Z"),
    );
    const [edited] = await getStoredRecords("products");
    expect(edited?.localData.title).toBe("My lamp");
    expect(edited?.localHash).not.toBe(edited?.sourceHash);
  });

  it("keeps local data while advancing the source baseline after conflict resolution", async () => {
    const first = await buildSyncPreview(
      "products",
      { records: [product], invalidRecords: [], total: 1 },
      [],
    );
    await applySyncPreview({
      preview: first,
      resolutions: new Map(),
      startedAt: new Date("2026-09-20T10:00:00.000Z"),
    });
    await saveLocalEdit("products:1", { ...product, title: "My lamp" });

    const storedBefore = await getStoredRecords("products");
    const sourceUpdate = { ...product, stock: 77 };
    const conflict = await buildSyncPreview(
      "products",
      { records: [sourceUpdate], invalidRecords: [], total: 1 },
      storedBefore,
    );
    expect(conflict.items[0]?.status).toBe("conflict");

    await applySyncPreview({
      preview: conflict,
      resolutions: new Map([["products:1", "keep-local"]]),
      startedAt: new Date("2026-09-20T10:10:00.000Z"),
    });

    const [resolved] = await getStoredRecords("products");
    expect(resolved?.localData.title).toBe("My lamp");
    expect(resolved?.sourceData.stock).toBe(77);
    expect(resolved?.localHash).not.toBe(resolved?.sourceHash);
  });
});
