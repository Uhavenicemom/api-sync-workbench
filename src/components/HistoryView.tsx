import {
  CheckCircle,
  ClockCounterClockwise,
  XCircle,
} from "@phosphor-icons/react";
import { RESOURCE_DEFINITIONS } from "../domain/resources";
import type { SyncRun } from "../domain/types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function HistoryView({ history }: { history: SyncRun[] }) {
  if (history.length === 0) {
    return (
      <div className="history-empty">
        <ClockCounterClockwise aria-hidden="true" size={30} />
        <h3>No sync runs yet</h3>
        <p>Fetch a source snapshot to create the first auditable run.</p>
      </div>
    );
  }

  return (
    <ol className="history-list">
      {history.map((run) => (
        <li key={run.id}>
          <span className={`history-outcome outcome-${run.outcome}`} aria-hidden="true">
            {run.outcome === "success" ? (
              <CheckCircle size={21} weight="fill" />
            ) : (
              <XCircle size={21} weight="fill" />
            )}
          </span>
          <div className="history-main">
            <strong>
              {RESOURCE_DEFINITIONS[run.resource].label} · {run.outcome}
            </strong>
            <span>{run.message}</span>
          </div>
          <dl>
            <div>
              <dt>Changes</dt>
              <dd>{run.counts.new + run.counts.updated + run.counts.conflict}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{run.durationMs} ms</dd>
            </div>
            <div>
              <dt>Completed</dt>
              <dd>{formatDate(run.completedAt)}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ol>
  );
}
