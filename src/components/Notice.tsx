import {
  CheckCircle,
  Info,
  Warning,
  XCircle,
} from "@phosphor-icons/react";

export type NoticeTone = "info" | "success" | "warning" | "error";

interface NoticeProps {
  tone: NoticeTone;
  title: string;
  message: string;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
}

export function Notice({
  tone,
  title,
  message,
  actionLabel,
  onAction,
}: NoticeProps) {
  const Icon =
    tone === "success"
      ? CheckCircle
      : tone === "warning"
        ? Warning
        : tone === "error"
          ? XCircle
          : Info;

  return (
    <div
      className={`notice notice-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" size={21} weight="fill" />
      <div className="notice-copy">
        <strong>{title}</strong>
        <span>{message}</span>
      </div>
      {actionLabel && onAction ? (
        <button className="button button-quiet notice-action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
