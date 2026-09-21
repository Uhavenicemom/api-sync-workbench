import type { PreviewCounts } from "../domain/types";

export function LedgerStrip({ counts }: { counts: PreviewCounts }) {
  const metrics = [
    { label: "New", value: counts.new },
    { label: "Updates", value: counts.updated },
    { label: "Local edits", value: counts["locally-modified"] },
    { label: "Conflicts", value: counts.conflict },
    { label: "Invalid", value: counts.invalid },
    { label: "Unchanged", value: counts.unchanged },
  ];

  return (
    <dl className="ledger-strip" aria-label="Preview summary">
      {metrics.map((metric) => (
        <div key={metric.label}>
          <dt>{metric.label}</dt>
          <dd>{metric.value}</dd>
        </div>
      ))}
    </dl>
  );
}
