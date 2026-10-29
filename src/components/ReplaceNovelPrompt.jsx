import { useState } from "react";
import { Link } from "react-router-dom";
import NovelThumb from "./NovelThumb";
import { submitNovelRequest } from "../services/requestService";
import { useScrollLock } from "../hooks/useScrollLock";
import "../design/ConfirmModal.css";

// Adds a new novel. If it's already on MyNovelList and the user is an admin,
// asks whether to replace the existing novel's details instead.
// Returns `submit` (for NovelForm's onSubmit) and the `prompt` element to render.
export function useAddNovel(onDone) {
  const [duplicate, setDuplicate] = useState(null); // { existing, body }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useScrollLock(!!duplicate);

  const submit = async (body) => {
    try {
      onDone(await submitNovelRequest(body));
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 409 && data?.canReplace && data.existing) {
        setError("");
        setDuplicate({ existing: data.existing, body });
        return;
      }
      throw err; // NovelForm shows the message
    }
  };

  const replace = async () => {
    setBusy(true);
    setError("");
    try {
      onDone(await submitNovelRequest({ ...duplicate.body, replace: true }));
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't replace it. Please try again.");
      setBusy(false);
    }
  };

  const close = () => {
    if (busy) return;
    setDuplicate(null);
    setError("");
  };

  const prompt = duplicate && (
    <div className="confirm-overlay" onClick={close}>
      <div
        className="confirm-modal replace-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="replace-title"
        aria-describedby="replace-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="confirm-title" id="replace-title">Novel already on MyNovelList</h2>
        <div className="replace-existing">
          <NovelThumb title={duplicate.existing.title} src={duplicate.existing.coverImage} />
          <div>
            <Link to={`/novel/${duplicate.existing.id}`} target="_blank" className="replace-existing-title">
              {duplicate.existing.title}
            </Link>
            <span className="replace-existing-author">{duplicate.existing.author}</span>
          </div>
        </div>
        <p className="confirm-message" id="replace-message">
          Do you want to replace it? All of its details will be replaced with the ones in this form
          {duplicate.body.cover ? ", including the cover" : " (the current cover is kept, since you didn't add a new one)"}.
          Readers' lists and reviews stay as they are.
        </p>
        {error && <p className="replace-error" role="alert">{error}</p>}
        <div className="confirm-actions">
          <button className="confirm-btn-primary" onClick={replace} disabled={busy} autoFocus>
            {busy ? "Replacing…" : "Replace details"}
          </button>
          <button className="confirm-btn-secondary" onClick={close} disabled={busy}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return { submit, prompt };
}
