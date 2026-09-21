import {
  CaretRight,
  MagnifyingGlass,
  PencilSimple,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { RESOURCE_DEFINITIONS, formatFieldValue } from "../domain/resources";
import type {
  ConflictResolution,
  PreviewStatus,
  ResourceName,
  StoredRecord,
  SyncPreviewItem,
} from "../domain/types";
import { StatusBadge } from "./StatusBadge";

type TableMode = "preview" | "local";

interface RecordTableProps {
  mode: TableMode;
  resource: ResourceName;
  previewItems: SyncPreviewItem[];
  records: StoredRecord[];
  resolutions: ReadonlyMap<string, ConflictResolution>;
  onEdit: (record: StoredRecord) => void;
  onReviewConflict: (item: SyncPreviewItem) => void;
}

const FILTERS: Array<{ value: "all" | PreviewStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "updated", label: "Updated" },
  { value: "locally-modified", label: "Local edits" },
  { value: "conflict", label: "Conflicts" },
  { value: "invalid", label: "Invalid" },
];

function includesQuery(value: unknown, query: string): boolean {
  return JSON.stringify(value).toLowerCase().includes(query.toLowerCase());
}

export function RecordTable({
  mode,
  resource,
  previewItems,
  records,
  resolutions,
  onEdit,
  onReviewConflict,
}: RecordTableProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PreviewStatus>("all");
  const definition = RESOURCE_DEFINITIONS[resource];

  const filteredPreview = useMemo(
    () =>
      previewItems.filter(
        (item) =>
          (statusFilter === "all" || item.status === statusFilter) &&
          (!query || includesQuery(item.source ?? item.local ?? item.reason, query)),
      ),
    [previewItems, query, statusFilter],
  );

  const filteredRecords = useMemo(
    () => records.filter((record) => !query || includesQuery(record.localData, query)),
    [records, query],
  );

  const hasRows = mode === "preview" ? filteredPreview.length > 0 : filteredRecords.length > 0;

  return (
    <div className="records-region">
      <div className="table-toolbar">
        <label className="search-field">
          <MagnifyingGlass aria-hidden="true" size={18} />
          <span className="sr-only">Search records</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${definition.label.toLowerCase()}`}
          />
        </label>

        {mode === "preview" ? (
          <div className="filter-tabs" role="group" aria-label="Filter preview status">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                className={statusFilter === filter.value ? "is-active" : undefined}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="record-total">{filteredRecords.length} records</span>
        )}
      </div>

      {hasRows ? (
        <div className="table-scroll">
          <table>
            <caption className="sr-only">
              {mode === "preview" ? "Synchronization preview" : "Locally stored records"}
            </caption>
            <thead>
              <tr>
                <th scope="col">Record</th>
                {definition.columns.slice(1).map((column) => (
                  <th scope="col" key={column.key}>
                    {column.label}
                  </th>
                ))}
                <th scope="col">{mode === "preview" ? "Status" : "Local state"}</th>
                <th scope="col" className="action-heading">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {mode === "preview"
                ? filteredPreview.map((item) => {
                    const data = item.source ?? item.local;
                    const resolution = resolutions.get(item.key);
                    if (!data) {
                      return (
                        <tr key={item.key}>
                          <td colSpan={definition.columns.length + 2}>
                            <div className="invalid-record">
                              <StatusBadge status="invalid" />
                              <span>{item.reason}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={item.key}>
                        <td data-label="Record">
                          <div className="record-identity">
                            {definition.getImage(data) ? (
                              <img
                                src={definition.getImage(data) ?? ""}
                                alt=""
                                loading="lazy"
                              />
                            ) : (
                              <span className="record-placeholder" aria-hidden="true" />
                            )}
                            <span>
                              <strong>{definition.getTitle(data)}</strong>
                              <small>
                                <span className="record-id">#{data.id}</span> · {definition.getSubtitle(data)}
                              </small>
                            </span>
                          </div>
                        </td>
                        {definition.columns.slice(1).map((column) => (
                          <td key={column.key} data-label={column.label}>
                            {formatFieldValue(data[column.key])}
                          </td>
                        ))}
                        <td data-label="Status">
                          <div className="status-stack">
                            <StatusBadge status={item.status} />
                            {resolution ? (
                              <small>
                                {resolution === "keep-local" ? "Keeping local" : "Using source"}
                              </small>
                            ) : null}
                          </div>
                        </td>
                        <td data-label="Action" className="row-action">
                          {item.status === "conflict" ? (
                            <button
                              className="button button-quiet button-small"
                              onClick={() => onReviewConflict(item)}
                            >
                              Review
                              <CaretRight aria-hidden="true" size={15} />
                            </button>
                          ) : (
                            <span className="no-action">No action needed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                : filteredRecords.map((record) => (
                    <tr key={record.key}>
                      <td data-label="Record">
                        <div className="record-identity">
                          {definition.getImage(record.localData) ? (
                            <img
                              src={definition.getImage(record.localData) ?? ""}
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <span className="record-placeholder" aria-hidden="true" />
                          )}
                          <span>
                            <strong>{definition.getTitle(record.localData)}</strong>
                            <small>
                              <span className="record-id">#{record.id}</span> · {definition.getSubtitle(record.localData)}
                            </small>
                          </span>
                        </div>
                      </td>
                      {definition.columns.slice(1).map((column) => (
                        <td key={column.key} data-label={column.label}>
                          {formatFieldValue(record.localData[column.key])}
                        </td>
                      ))}
                      <td data-label="Local state">
                        {record.localHash === record.sourceHash ? (
                          <StatusBadge status="unchanged" />
                        ) : (
                          <StatusBadge status="locally-modified" />
                        )}
                      </td>
                      <td data-label="Action" className="row-action">
                        <button
                          className="button button-quiet button-small"
                          onClick={() => onEdit(record)}
                        >
                          <PencilSimple aria-hidden="true" size={15} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-empty">
          <MagnifyingGlass aria-hidden="true" size={26} />
          <strong>No matching records</strong>
          <span>Clear the search or choose a different status.</span>
        </div>
      )}
    </div>
  );
}
