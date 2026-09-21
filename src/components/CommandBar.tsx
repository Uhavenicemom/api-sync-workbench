import {
  ArrowClockwise,
  Flask,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import type { ResourceName } from "../domain/types";

interface CommandBarProps {
  resource: ResourceName;
  onResourceChange: (resource: ResourceName) => void;
  delayMs: number;
  onDelayChange: (delayMs: number) => void;
  failNextRequest: boolean;
  onFailNextRequestChange: (checked: boolean) => void;
  simulateUpstream: boolean;
  onSimulateUpstreamChange: (checked: boolean) => void;
  onFetch: () => void;
  busy: boolean;
  hasLocalEdits: boolean;
}

export function CommandBar({
  resource,
  onResourceChange,
  delayMs,
  onDelayChange,
  failNextRequest,
  onFailNextRequestChange,
  simulateUpstream,
  onSimulateUpstreamChange,
  onFetch,
  busy,
  hasLocalEdits,
}: CommandBarProps) {
  return (
    <div className="command-bar">
      <fieldset className="resource-picker">
        <legend>Source resource</legend>
        <div className="segmented-control">
          {(["products", "users"] as const).map((name) => (
            <label key={name}>
              <input
                type="radio"
                name="resource"
                value={name}
                checked={resource === name}
                onChange={() => onResourceChange(name)}
                disabled={busy}
              />
              <span>{name === "products" ? "Products" : "Users"}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="compact-field">
        <span>
          <SlidersHorizontal aria-hidden="true" size={17} />
          API delay
        </span>
        <select
          value={delayMs}
          onChange={(event) => onDelayChange(Number(event.target.value))}
          disabled={busy}
        >
          <option value={0}>No delay</option>
          <option value={800}>0.8 seconds</option>
          <option value={2000}>2 seconds</option>
          <option value={4000}>4 seconds</option>
        </select>
      </label>

      <details className="demo-controls">
        <summary>
          <Flask aria-hidden="true" size={17} />
          Demo controls
        </summary>
        <div className="demo-popover">
          <strong>Failure and conflict simulations</strong>
          <label className="check-field">
            <input
              type="checkbox"
              checked={failNextRequest}
              onChange={(event) => {
                onFailNextRequestChange(event.target.checked);
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}
              disabled={busy}
            />
            <span>
              Fail the next request once
              <small>Use retry to recover without losing context.</small>
            </span>
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={simulateUpstream}
              onChange={(event) => {
                onSimulateUpstreamChange(event.target.checked);
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}
              disabled={busy || !hasLocalEdits}
            />
            <span>
              Change the source copy
              <small>
                {hasLocalEdits
                  ? "Creates a conflict for the first locally edited record."
                  : "Edit a local record before enabling this simulation."}
              </small>
            </span>
          </label>
        </div>
      </details>

      <button className="button button-primary fetch-button" onClick={onFetch} disabled={busy}>
        <ArrowClockwise
          aria-hidden="true"
          size={18}
          className={busy ? "spin" : undefined}
        />
        {busy ? "Working" : "Fetch changes"}
      </button>
    </div>
  );
}
