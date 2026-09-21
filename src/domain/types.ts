export const RESOURCE_NAMES = ["products", "users"] as const;

export type ResourceName = (typeof RESOURCE_NAMES)[number];

export type SourceRecord = Record<string, unknown> & { id: number };

export type PreviewStatus =
  | "new"
  | "updated"
  | "unchanged"
  | "locally-modified"
  | "conflict"
  | "invalid";

export type ConflictResolution = "keep-local" | "use-source";

export interface InvalidSourceRecord {
  index: number;
  reason: string;
}

export interface FetchResult {
  records: SourceRecord[];
  invalidRecords: InvalidSourceRecord[];
  total: number;
}

export interface StoredRecord {
  key: string;
  resource: ResourceName;
  id: number;
  localData: SourceRecord;
  sourceData: SourceRecord;
  localHash: string;
  sourceHash: string;
  lastSyncedAt: string;
  localModifiedAt: string | null;
}

export interface SyncPreviewItem {
  key: string;
  resource: ResourceName;
  id: number | null;
  status: PreviewStatus;
  local: SourceRecord | null;
  source: SourceRecord | null;
  base: SourceRecord | null;
  localHash: string | null;
  sourceHash: string | null;
  reason: string | null;
}

export type PreviewCounts = Record<PreviewStatus, number>;

export interface SyncPreview {
  resource: ResourceName;
  items: SyncPreviewItem[];
  counts: PreviewCounts;
  sourceTotal: number;
  fetchedAt: string;
}

export interface SyncRun {
  id: string;
  resource: ResourceName;
  outcome: "success" | "failed";
  startedAt: string;
  completedAt: string;
  durationMs: number;
  counts: PreviewCounts;
  message: string;
}

export interface EditableField {
  key: string;
  label: string;
  type: "text" | "email" | "number" | "textarea";
}

export interface ResourceDefinition {
  name: ResourceName;
  label: string;
  collectionKey: ResourceName;
  editableFields: EditableField[];
  columns: Array<{ key: string; label: string }>;
  parseRecord: (value: unknown) =>
    | { success: true; data: SourceRecord }
    | { success: false; reason: string };
  getTitle: (record: SourceRecord) => string;
  getSubtitle: (record: SourceRecord) => string;
  getImage: (record: SourceRecord) => string | null;
  simulateSourceChange: (record: SourceRecord) => SourceRecord;
}

export const EMPTY_COUNTS: PreviewCounts = {
  new: 0,
  updated: 0,
  unchanged: 0,
  "locally-modified": 0,
  conflict: 0,
  invalid: 0,
};
