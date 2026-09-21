import {
  Check,
  CloudArrowDown,
  Database,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import type { SyncPreview } from "../domain/types";

export type OperationPhase =
  | "idle"
  | "fetching"
  | "preview"
  | "applying"
  | "success"
  | "error";

interface SyncRailProps {
  phase: OperationPhase;
  preview: SyncPreview | null;
  localCount: number;
}

export function SyncRail({ phase, preview, localCount }: SyncRailProps) {
  const sourceState = phase === "fetching" ? "active" : preview ? "complete" : "idle";
  const reviewState =
    phase === "preview" || phase === "applying"
      ? "active"
      : phase === "success"
        ? "complete"
        : "idle";
  const localState = phase === "applying" ? "active" : phase === "success" ? "complete" : "idle";

  const stations = [
    {
      label: "DummyJSON source",
      detail:
        phase === "fetching"
          ? "Fetching and validating"
          : preview
            ? `${preview.sourceTotal} source records`
            : "Ready for a secure fetch",
      state: sourceState,
      Icon: CloudArrowDown,
    },
    {
      label: "Review changes",
      detail: preview
        ? `${preview.counts.conflict} conflicts, ${preview.counts.invalid} invalid`
        : "Preview before any write",
      state: reviewState,
      Icon: MagnifyingGlass,
    },
    {
      label: "IndexedDB destination",
      detail: `${localCount} local records`,
      state: localState,
      Icon: Database,
    },
  ] as const;

  return (
    <ol className="sync-rail" aria-label="Synchronization stages">
      {stations.map(({ label, detail, state, Icon }) => (
        <li className={`rail-station rail-${state}`} key={label}>
          <span className="rail-icon" aria-hidden="true">
            {state === "complete" ? (
              <Check size={18} weight="bold" />
            ) : (
              <Icon size={20} weight="duotone" />
            )}
          </span>
          <span className="rail-copy">
            <strong>{label}</strong>
            <small>{detail}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}
