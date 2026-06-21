import { useState, useEffect, useRef } from "react";
import "../design/AddNovelModal.css";
import { ConfirmModal } from "./ConfirmModal";

function AddNovelModal({
  open,
  novel,
  entry,
  status,
  progress,
  rating,
  startedAt,
  completedAt,
  setStatus,
  setProgress,
  setRating,
  setStartedAt,
  setCompletedAt,
  onClose,
  onSubmit,
  onDelete,
  isEditing,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // BUG 1 FIX: All hooks must be called before any conditional return.
  // BUG 11 FIX: Removed redundant internal fill useEffect — parent already
  //             calls entryForm.fill()/reset() before opening the modal,
  //             which correctly trims ISO date strings via .split("T")[0].
  //             Keeping the internal effect caused a race condition and
  //             date format mismatch (raw ISO string vs trimmed YYYY-MM-DD).

  // Track the status value at the moment the modal opens so we can distinguish
  // "status was already Completed when the modal opened" (no auto-fill — the
  // parent already filled progress via entryForm.fill()) from "user actively
  // changed status TO Completed" (auto-fill progress to chapterCount).
  const statusAtOpenRef = useRef(null);
  useEffect(() => {
    if (open) {
      statusAtOpenRef.current = status;
    } else {
      statusAtOpenRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !novel) return;
    // Only auto-fill when status actively changes TO "Completed" (not on modal open).
    if (status === "Completed" && status !== statusAtOpenRef.current) {
      // Auto-fill progress to chapter count (skip if no chapter count is known).
      if (novel.chapterCount > 0) {
        setProgress(novel.chapterCount);
      }
      // Auto-fill completedAt to today if not already set — the backend requires
      // completedAt when status is Completed, so leaving it blank causes a 400.
      if (!completedAt) {
        setCompletedAt(new Date().toISOString().split("T")[0]);
      }
    }
  }, [status, novel, open, completedAt, setProgress, setCompletedAt]);

  if (!open || !novel) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{isEditing ? "Edit Novel" : "Add Novel"}</div>
            <div className="modal-subtitle">{novel.title}</div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Reading">Reading</option>
              <option value="Completed">Completed</option>
              <option value="Plan To Read">Plan To Read</option>
              <option value="On Hold">On Hold</option>
              <option value="Dropped">Dropped</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Progress <span className="muted">({novel.chapterCount})</span>
            </label>
            <input
              className="form-control"
              type="number"
              min="0"
              disabled={status === "Completed" || status === "Plan To Read"}
              value={progress ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setProgress(val === "" ? "" : Number(val));
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rating</label>
            <select
              className="form-control"
              disabled={status === "Plan To Read"}
              value={rating ?? ""}
              onChange={(e) =>
                setRating(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Select</option>
              {Array.from({ length: 19 }, (_, i) => {
                const value = 1 + i * 0.5;
                return (
                  <option key={i} value={value}>
                    {value}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              className="form-control"
              type="date"
              disabled={status === "Plan To Read"}
              value={startedAt ?? ""}
              onChange={(e) => setStartedAt(e.target.value || null)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Finish Date</label>
            <input
              className="form-control"
              type="date"
              disabled={status === "Plan To Read"}
              value={completedAt ?? ""}
              onChange={(e) => setCompletedAt(e.target.value || null)}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="mod-btn-sub" onClick={onSubmit}>
            Submit
          </button>

          {isEditing && (
            <button className="mod-btn-danger" onClick={() => setShowDeleteConfirm(true)}>
              Delete
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        title="Remove this novel from your list?"
        message="You will lose your reading progress and score for this novel."
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete();
        }}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

export { AddNovelModal };