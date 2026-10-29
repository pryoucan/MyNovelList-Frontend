import { useState, useEffect, useRef } from "react";
import "../design/AddNovelModal.css";
import { ConfirmModal } from "./ConfirmModal";
import NovelThumb from "./NovelThumb";
import StarRating from "./StarRating";
import StatusIcon from "./StatusIcon";
import { useScrollLock } from "../hooks/useScrollLock";
import "../design/status.css";

const STATUSES = ["Reading", "Completed", "On Hold", "Plan To Read", "Dropped"];
const statusSlug = (status) => status.toLowerCase().split(" ").join("-");
const today = () => new Date().toISOString().split("T")[0];

function AddNovelModal({
  open,
  novel,
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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
      setError("");
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isUpcoming = novel?.publication?.status === "Upcoming";
  const chapterCount = novel?.chapterCount > 0 ? novel.chapterCount : null;

  const changeStatus = (next) => {
    setError("");
    setStatus(next);
    if (next === "Completed" && next !== statusAtOpenRef.current) {
      if (chapterCount) setProgress(chapterCount);
      // The backend requires completedAt when status is Completed.
      if (!completedAt) setCompletedAt(today());
    }
  };

  useScrollLock(open && !!novel);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !showDeleteConfirm && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, showDeleteConfirm, onClose]);

  if (!open || !novel) return null;

  const isPlanned = status === "Plan To Read";
  const numericProgress = progress === "" || progress == null ? 0 : Number(progress);
  const progressPct = chapterCount ? Math.min(100, Math.round((numericProgress / chapterCount) * 100)) : null;

  const setProgressClamped = (value) => {
    const n = Math.max(0, Math.floor(value));
    setProgress(chapterCount ? Math.min(n, chapterCount) : n);
  };


  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      await onSubmit();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setError("");
    try {
      await onDelete();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't remove it. Please try again.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-novel">
            <NovelThumb title={novel.title} src={novel.coverImage} />
            <div>
              <div className="modal-kicker">{isEditing ? "Edit entry" : "Add to list"}</div>
              <div className="modal-title" id="entry-modal-title">{novel.title}</div>
              <div className="modal-subtitle">{novel.author}</div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <span className="form-label" id="status-label">Status</span>
            <div className="status-picker" role="radiogroup" aria-labelledby="status-label">
              {STATUSES.map((s) => {
                const locked = isUpcoming && s !== "Plan To Read";
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={status === s}
                    disabled={locked}
                    className={`status-option status-option--${statusSlug(s)}${status === s ? " selected" : ""}`}
                    onClick={() => changeStatus(s)}
                  >
                    <StatusIcon
                      status={s}
                      progress={s === "Reading" && chapterCount ? numericProgress / chapterCount : null}
                    />
                    {s}
                  </button>
                );
              })}
            </div>
            {isUpcoming && <p className="form-hint">Not released yet — you can plan to read it.</p>}
          </div>

          {!isPlanned && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="entry-progress">Progress</label>
                <div className="progress-input">
                  <button
                    type="button"
                    className="stepper-btn"
                    aria-label="One chapter less"
                    disabled={numericProgress <= 0}
                    onClick={() => setProgressClamped(numericProgress - 1)}
                  >
                    −
                  </button>
                  <input
                    id="entry-progress"
                    className="form-control progress-field"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max={chapterCount ?? undefined}
                    value={progress ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") return setProgress("");
                      setProgressClamped(Number(val));
                    }}
                  />
                  <button
                    type="button"
                    className="stepper-btn"
                    aria-label="One chapter more"
                    disabled={chapterCount !== null && numericProgress >= chapterCount}
                    onClick={() => setProgressClamped(numericProgress + 1)}
                  >
                    +
                  </button>
                  <span className="progress-total">
                    {chapterCount ? `/ ${chapterCount.toLocaleString()} chapters` : "chapters"}
                  </span>
                </div>
                {progressPct !== null && (
                  <div className={`modal-progress-track modal-progress-track--${statusSlug(status)}`} aria-hidden="true">
                    <div className="modal-progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <span className="form-label" id="rating-label">Rating</span>
                  <span className="rating-value">
                    {rating != null ? (
                      <>
                        <strong>{rating}</strong> / 10
                        <button type="button" className="link-btn" onClick={() => setRating(null)}>
                          Clear
                        </button>
                      </>
                    ) : (
                      "Not rated"
                    )}
                  </span>
                </div>
                <StarRating
                  value={rating}
                  labelledBy="rating-label"
                  onChange={(next) => {
                    setError("");
                    setRating(next);
                  }}
                />
              </div>

              <div className={`date-row${status === "Completed" ? "" : " date-row--single"}`}>
                <div className="form-group">
                  <div className="form-label-row">
                    <label className="form-label" htmlFor="entry-started">Started</label>
                    {startedAt !== today() && (
                      <button type="button" className="today-btn" onClick={() => setStartedAt(today())}>
                        Today
                      </button>
                    )}
                  </div>
                  <input
                    id="entry-started"
                    className="form-control"
                    type="date"
                    max={today()}
                    value={startedAt ?? ""}
                    onChange={(e) => setStartedAt(e.target.value || null)}
                  />
                </div>

                {status === "Completed" && (
                  <div className="form-group">
                    <div className="form-label-row">
                      <label className="form-label" htmlFor="entry-finished">Finished</label>
                      {completedAt !== today() && (
                        <button type="button" className="today-btn" onClick={() => setCompletedAt(today())}>
                          Today
                        </button>
                      )}
                    </div>
                    <input
                      id="entry-finished"
                      className="form-control"
                      type="date"
                      min={startedAt ?? undefined}
                      max={today()}
                      value={completedAt ?? ""}
                      onChange={(e) => setCompletedAt(e.target.value || null)}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {error && <p className="modal-error" role="alert">{error}</p>}

        <div className="modal-actions">
          {isEditing && (
            <button type="button" className="remove-link" onClick={() => setShowDeleteConfirm(true)}>
              Remove from list
            </button>
          )}
          <div className="modal-actions-right">
            <button type="button" className="mod-btn-can" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="mod-btn-sub" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save" : "Add to list"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        title="Remove this novel from your list?"
        message="You will lose your reading progress and score for this novel."
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

export { AddNovelModal };
