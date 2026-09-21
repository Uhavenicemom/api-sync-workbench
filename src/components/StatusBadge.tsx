import {
  CheckCircle,
  CircleNotch,
  MinusCircle,
  PlusCircle,
  Warning,
} from "@phosphor-icons/react";
import type { PreviewStatus } from "../domain/types";

const LABELS: Record<PreviewStatus, string> = {
  new: "New",
  updated: "Updated",
  unchanged: "Unchanged",
  "locally-modified": "Local edit",
  conflict: "Conflict",
  invalid: "Invalid",
};

export function StatusBadge({ status }: { status: PreviewStatus }) {
  const Icon =
    status === "new"
      ? PlusCircle
      : status === "updated"
        ? CircleNotch
        : status === "unchanged"
          ? CheckCircle
          : status === "locally-modified"
            ? MinusCircle
            : Warning;

  return (
    <span className={`status-badge status-${status}`}>
      <Icon aria-hidden="true" size={15} weight="bold" />
      {LABELS[status]}
    </span>
  );
}
