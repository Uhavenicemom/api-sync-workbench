import { Check, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { canonicalJson } from "../domain/hash";
import { RESOURCE_DEFINITIONS, formatFieldValue } from "../domain/resources";
import type {
  ConflictResolution,
  SourceRecord,
  StoredRecord,
  SyncPreviewItem,
} from "../domain/types";

type DrawerState =
  | { mode: "edit"; record: StoredRecord }
  | { mode: "conflict"; item: SyncPreviewItem };

interface RecordDrawerProps {
  state: DrawerState | null;
  onClose: () => void;
  onSave: (key: string, record: SourceRecord) => Promise<void>;
  onResolve: (key: string, resolution: ConflictResolution) => void;
}

interface EditRecordFormProps {
  record: StoredRecord;
  onSave: (key: string, record: SourceRecord) => Promise<void>;
  onCancel: () => void;
}

function editableValue(value: unknown): string {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return "";
}

function EditRecordForm({ record, onSave, onCancel }: EditRecordFormProps) {
  const definition = RESOURCE_DEFINITIONS[record.resource];
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      definition.editableFields.map((field) => [
        field.key,
        editableValue(record.localData[field.key]),
      ]),
    ),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextData: SourceRecord = { ...record.localData };
    for (const field of definition.editableFields) {
      const value = draft[field.key] ?? "";
      nextData[field.key] = field.type === "number" ? Number(value) : value.trim();
    }

    const validation = definition.parseRecord(nextData);
    if (!validation.success) {
      setFormError(validation.reason);
      return;
    }

    setSaving(true);
    try {
      await onSave(record.key, validation.data);
      onCancel();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "The local edit could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="drawer-form" onSubmit={(event) => void handleSubmit(event)}>
      <p>
        Changes are stored only in this browser. The next preview will protect this local copy.
      </p>
      <div className="field-grid">
        {definition.editableFields.map((field) => (
          <label className={field.type === "textarea" ? "field-wide" : undefined} key={field.key}>
            <span>{field.label}</span>
            {field.type === "textarea" ? (
              <textarea
                value={draft[field.key] ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
                rows={5}
              />
            ) : (
              <input
                type={field.type}
                value={draft[field.key] ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
                step={field.type === "number" ? "any" : undefined}
              />
            )}
          </label>
        ))}
      </div>
      {formError ? <div className="form-error" role="alert">{formError}</div> : null}
      <div className="drawer-actions">
        <button type="button" className="button button-quiet" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button button-primary" disabled={saving}>
          <Check aria-hidden="true" size={17} />
          {saving ? "Saving" : "Save local copy"}
        </button>
      </div>
    </form>
  );
}

export function RecordDrawer({
  state,
  onClose,
  onSave,
  onResolve,
}: RecordDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (state && dialog && !dialog.open) {
      dialog.showModal();
    }
    if (!state && dialog?.open) {
      dialog.close();
    }
  }, [state]);

  const changedFields = useMemo(() => {
    if (state?.mode !== "conflict" || !state.item.local || !state.item.source) {
      return [];
    }
    return Array.from(
      new Set([
        ...Object.keys(state.item.local),
        ...Object.keys(state.item.source),
      ]),
    ).filter(
      (key) =>
        canonicalJson(state.item.local?.[key]) !==
        canonicalJson(state.item.source?.[key]),
    );
  }, [state]);

  if (!state) {
    return <dialog ref={dialogRef} />;
  }

  const definition =
    RESOURCE_DEFINITIONS[
      state.mode === "edit" ? state.record.resource : state.item.resource
    ];

  const closeDialog = () => dialogRef.current?.close();

  return (
    <dialog
      className="record-drawer"
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      aria-labelledby="drawer-title"
    >
      <div className="drawer-header">
        <div>
          <span>{state.mode === "edit" ? "Local record" : "Conflict review"}</span>
          <h2 id="drawer-title">
            {state.mode === "edit"
              ? definition.getTitle(state.record.localData)
              : definition.getTitle(state.item.source ?? state.item.local ?? { id: 0 })}
          </h2>
        </div>
        <button className="icon-button" onClick={closeDialog} aria-label="Close drawer">
          <X aria-hidden="true" size={20} />
        </button>
      </div>

      {state.mode === "edit" ? (
        <EditRecordForm
          key={`${state.record.key}:${state.record.localHash}`}
          record={state.record}
          onSave={onSave}
          onCancel={closeDialog}
        />
      ) : (
        <div className="conflict-content">
          <p>
            Both copies changed after the previous sync. Choose which complete record should remain local.
          </p>
          <div className="comparison" aria-label="Conflict value comparison">
            <div className="comparison-head">
              <span>Field</span>
              <strong>Local copy</strong>
              <strong>Source copy</strong>
            </div>
            {changedFields.map((key) => (
              <div className="comparison-row" key={key}>
                <span>{key}</span>
                <code>{formatFieldValue(state.item.local?.[key])}</code>
                <code>{formatFieldValue(state.item.source?.[key])}</code>
              </div>
            ))}
          </div>
          <div className="resolution-actions">
            <button
              className="button button-secondary"
              onClick={() => {
                onResolve(state.item.key, "keep-local");
                closeDialog();
              }}
            >
              Keep local
              <small>Preserve your browser edit</small>
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                onResolve(state.item.key, "use-source");
                closeDialog();
              }}
            >
              Use source
              <small>Replace local data</small>
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

export type { DrawerState };
