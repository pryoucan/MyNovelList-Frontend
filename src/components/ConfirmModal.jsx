import { useScrollLock } from "../hooks/useScrollLock";
import "../design/ConfirmModal.css";

function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Remove all",
  cancelText = "Cancel",
  onConfirm,
  onClose,
}) {
  useScrollLock(open);

  if (!open) return null;

  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="confirm-title">{title}</h2>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn-primary" onClick={onConfirm}>
            {confirmText}
          </button>
          <button className="confirm-btn-secondary" onClick={onClose}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

export { ConfirmModal };
