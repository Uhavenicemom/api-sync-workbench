import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { hashRecord } from "../domain/hash";
import {
  EMPTY_COUNTS,
  type ConflictResolution,
  type PreviewCounts,
  type ResourceName,
  type SourceRecord,
  type StoredRecord,
  type SyncPreview,
  type SyncRun,
} from "../domain/types";

interface WorkbenchDatabase extends DBSchema {
  records: {
    key: string;
    value: StoredRecord;
    indexes: { "by-resource": ResourceName };
  };
  history: {
    key: string;
    value: SyncRun;
    indexes: { "by-started-at": string };
  };
}

const DATABASE_NAME = "api-sync-workbench";
const DATABASE_VERSION = 1;

let databasePromise: Promise<IDBPDatabase<WorkbenchDatabase>> | null = null;

function getDatabase(): Promise<IDBPDatabase<WorkbenchDatabase>> {
  databasePromise ??= openDB<WorkbenchDatabase>(
    DATABASE_NAME,
    DATABASE_VERSION,
    {
      upgrade(database) {
        const records = database.createObjectStore("records", {
          keyPath: "key",
        });
        records.createIndex("by-resource", "resource");

        const history = database.createObjectStore("history", {
          keyPath: "id",
        });
        history.createIndex("by-started-at", "startedAt");
      },
    },
  );
  return databasePromise;
}

export async function getStoredRecords(
  resource: ResourceName,
): Promise<StoredRecord[]> {
  const database = await getDatabase();
  return database.getAllFromIndex("records", "by-resource", resource);
}

export async function getSyncHistory(): Promise<SyncRun[]> {
  const database = await getDatabase();
  const history = await database.getAll("history");
  return history.sort((left, right) =>
    right.startedAt.localeCompare(left.startedAt),
  );
}

export async function saveLocalEdit(
  key: string,
  localData: SourceRecord,
  now = new Date(),
): Promise<StoredRecord> {
  const database = await getDatabase();
  const existing = await database.get("records", key);
  if (!existing) {
    throw new Error("The local record no longer exists.");
  }

  const updated: StoredRecord = {
    ...existing,
    localData,
    localHash: await hashRecord(localData),
    localModifiedAt: now.toISOString(),
  };
  await database.put("records", updated);
  return updated;
}

export interface ApplyPreviewOptions {
  preview: SyncPreview;
  resolutions: ReadonlyMap<string, ConflictResolution>;
  startedAt: Date;
  completedAt?: Date;
}

export async function applySyncPreview({
  preview,
  resolutions,
  startedAt,
  completedAt = new Date(),
}: ApplyPreviewOptions): Promise<SyncRun> {
  const database = await getDatabase();
  const transaction = database.transaction(["records", "history"], "readwrite");

  try {
    for (const item of preview.items) {
      if (
        item.status === "unchanged" ||
        item.status === "locally-modified" ||
        item.status === "invalid"
      ) {
        continue;
      }

      if (item.id === null || item.source === null || item.sourceHash === null) {
        throw new Error(`Preview item ${item.key} is missing source data.`);
      }

      if (item.status === "conflict" && !resolutions.has(item.key)) {
        throw new Error("Every conflict must be resolved before applying the sync.");
      }

      const resolution = resolutions.get(item.key);
      const keepLocal = item.status === "conflict" && resolution === "keep-local";
      const localData = keepLocal ? item.local : item.source;
      if (localData === null) {
        throw new Error(`Preview item ${item.key} is missing local data.`);
      }

      const stored: StoredRecord = {
        key: item.key,
        resource: item.resource,
        id: item.id,
        localData,
        sourceData: item.source,
        localHash: keepLocal
          ? (item.localHash ?? (await hashRecord(localData)))
          : item.sourceHash,
        sourceHash: item.sourceHash,
        lastSyncedAt: completedAt.toISOString(),
        localModifiedAt: keepLocal ? completedAt.toISOString() : null,
      };

      await transaction.objectStore("records").put(stored);
    }

    const run: SyncRun = {
      id: crypto.randomUUID(),
      resource: preview.resource,
      outcome: "success",
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
      counts: { ...preview.counts },
      message: "Sync applied to IndexedDB.",
    };
    await transaction.objectStore("history").put(run);
    await transaction.done;
    return run;
  } catch (error) {
    transaction.abort();
    throw error;
  }
}

export async function recordFailedSync(
  resource: ResourceName,
  startedAt: Date,
  message: string,
  completedAt = new Date(),
): Promise<SyncRun> {
  const database = await getDatabase();
  const run: SyncRun = {
    id: crypto.randomUUID(),
    resource,
    outcome: "failed",
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
    counts: { ...EMPTY_COUNTS },
    message,
  };
  await database.put("history", run);
  return run;
}

export async function clearResource(resource: ResourceName): Promise<void> {
  const database = await getDatabase();
  const transaction = database.transaction("records", "readwrite");
  let cursor = await transaction.store.index("by-resource").openCursor(resource);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await transaction.done;
}

export async function clearAllWorkbenchData(): Promise<void> {
  const database = await getDatabase();
  const transaction = database.transaction(["records", "history"], "readwrite");
  await Promise.all([
    transaction.objectStore("records").clear(),
    transaction.objectStore("history").clear(),
  ]);
  await transaction.done;
}

export function resetDatabaseConnectionForTests(): void {
  databasePromise = null;
}

export function countAppliedChanges(counts: PreviewCounts): number {
  return counts.new + counts.updated + counts.conflict;
}
