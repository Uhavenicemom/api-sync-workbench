import { Warning, X } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog?.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      className="confirm-dialog"
      ref={dialogRef}
      onClose={onCancel}
      onCancel={(event) => {
        event.preventDefault();
        dialogRef.current?.close();
      }}
      aria-labelledby="confirm-title"
    >
      <button
        className="icon-button confirm-close"
        onClick={() => dialogRef.current?.close()}
        aria-label="Close confirmation"
      >
        <X aria-hidden="true" size={19} />
      </button>
      <span className="confirm-icon" aria-hidden="true">
        <Warning size={24} weight="fill" />
      </span>
      <h2 id="confirm-title">{title}</h2>
      <p>{message}</p>
      <div className="confirm-actions">
        <button className="button button-quiet" onClick={() => dialogRef.current?.close()}>
          Cancel
        </button>
        <button
          className="button button-danger"
          onClick={() => {
            onConfirm();
            dialogRef.current?.close();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
