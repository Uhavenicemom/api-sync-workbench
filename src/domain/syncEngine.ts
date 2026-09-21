import { hashRecord } from "./hash";
import {
  EMPTY_COUNTS,
  type FetchResult,
  type PreviewCounts,
  type ResourceName,
  type SourceRecord,
  type StoredRecord,
  type SyncPreview,
  type SyncPreviewItem,
} from "./types";

export function recordKey(resource: ResourceName, id: number): string {
  return `${resource}:${id}`;
}

export async function buildSyncPreview(
  resource: ResourceName,
  fetched: FetchResult,
  storedRecords: StoredRecord[],
  now = new Date(),
): Promise<SyncPreview> {
  const storedById = new Map(storedRecords.map((record) => [record.id, record]));

  const validItems = await Promise.all(
    fetched.records.map(async (source): Promise<SyncPreviewItem> => {
      const stored = storedById.get(source.id);
      const sourceHash = await hashRecord(source);

      if (!stored) {
        return {
          key: recordKey(resource, source.id),
          resource,
          id: source.id,
          status: "new",
          local: null,
          source,
          base: null,
          localHash: null,
          sourceHash,
          reason: null,
        };
      }

      const localChanged = stored.localHash !== stored.sourceHash;
      const sourceChanged = sourceHash !== stored.sourceHash;

      let status: SyncPreviewItem["status"] = "unchanged";
      if (localChanged && sourceChanged) {
        status = "conflict";
      } else if (localChanged) {
        status = "locally-modified";
      } else if (sourceChanged) {
        status = "updated";
      }

      return {
        key: stored.key,
        resource,
        id: source.id,
        status,
        local: stored.localData,
        source,
        base: stored.sourceData,
        localHash: stored.localHash,
        sourceHash,
        reason: null,
      };
    }),
  );

  const invalidItems: SyncPreviewItem[] = fetched.invalidRecords.map(
    (invalid) => ({
      key: `${resource}:invalid:${invalid.index}`,
      resource,
      id: null,
      status: "invalid",
      local: null,
      source: null,
      base: null,
      localHash: null,
      sourceHash: null,
      reason: invalid.reason,
    }),
  );

  const items = [...validItems, ...invalidItems];
  const counts: PreviewCounts = { ...EMPTY_COUNTS };
  for (const item of items) {
    counts[item.status] += 1;
  }

  return {
    resource,
    items,
    counts,
    sourceTotal: fetched.total,
    fetchedAt: now.toISOString(),
  };
}

export function simulateUpstreamChange(
  records: SourceRecord[],
  storedRecords: StoredRecord[],
  transform: (record: SourceRecord) => SourceRecord,
): { records: SourceRecord[]; simulatedId: number | null } {
  const locallyEdited = storedRecords.find(
    (record) => record.localHash !== record.sourceHash,
  );
  if (!locallyEdited) {
    return { records, simulatedId: null };
  }

  return {
    records: records.map((record) =>
      record.id === locallyEdited.id ? transform(record) : record,
    ),
    simulatedId: locallyEdited.id,
  };
}
