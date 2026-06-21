import { useEffect } from "react";
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
  // Prevent background scrolling when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
