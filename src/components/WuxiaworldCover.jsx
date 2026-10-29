import { useState } from "react";
import NovelThumb from "./NovelThumb";
import { fetchWuxiaworldCover, submitEditRequest } from "../services/requestService";
import { prepareCover } from "../utils/coverImage";
import { useScrollLock } from "../hooks/useScrollLock";
import "../design/ConfirmModal.css";

// The request asks for a Blob, so an error body arrives as a Blob too.
const errorMessage = async (err, fallback) => {
  try {
    return JSON.parse(await err.response.data.text()).message || fallback;
  } catch {
    return fallback;
  }
};

// Admin-only: replace an existing novel's cover with its Wuxiaworld cover.
// Looks the novel up by title first; a pasted Wuxiaworld link covers the
// cases where Wuxiaworld uses a different title.
export default function WuxiaworldCover({ novel, onSaved }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ status: "idle" }); // idle | searching | found | missing | saving
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  const find = async (query) => {
    setState({ status: "searching" });
    setError("");
    try {
      const dataUrl = await prepareCover(await fetchWuxiaworldCover(query));
      setState({ status: "found", dataUrl });
    } catch (err) {
      setState({ status: "missing" });
      if (query.url) setError(await errorMessage(err, "Couldn't get a cover from that link."));
    }
  };

  const start = () => {
    setOpen(true);
    setLink("");
    find({ title: novel.title });
  };

  const close = () => {
    if (state.status === "saving") return;
    setOpen(false);
    setState({ status: "idle" });
    setError("");
  };

  const save = async () => {
    const { dataUrl } = state;
    setState({ status: "saving", dataUrl });
    setError("");
    try {
      await submitEditRequest(novel.id, { cover: dataUrl });
      setOpen(false);
      setState({ status: "idle" });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save the cover. Please try again.");
      setState({ status: "found", dataUrl });
    }
  };

  useScrollLock(open);

  const busy = state.status === "searching" || state.status === "saving";

  return (
    <>
      <button type="button" className="page-action" onClick={start}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="9" cy="9" r="1.75" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        Cover from Wuxiaworld
      </button>

      {open && (
        <div className="confirm-overlay" onClick={close} onKeyDown={(e) => e.key === "Escape" && close()}>
          <div
            className="confirm-modal ww-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ww-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="confirm-title" id="ww-title">Cover from Wuxiaworld</h2>

            <div className="ww-compare">
              <figure>
                <div className="ww-cover">
                  {novel.coverImage ? <img src={novel.coverImage} alt="" /> : <NovelThumb title={novel.title} size="lg" />}
                </div>
                <figcaption>Current</figcaption>
              </figure>
              <span className="ww-arrow" aria-hidden="true">→</span>
              <figure>
                <div className={`ww-cover${state.dataUrl ? "" : " ww-cover--empty"}`} aria-busy={state.status === "searching"}>
                  {state.dataUrl ? (
                    <img src={state.dataUrl} alt="Wuxiaworld cover" />
                  ) : state.status === "searching" ? (
                    "Searching…"
                  ) : (
                    "Not found"
                  )}
                </div>
                <figcaption>Wuxiaworld</figcaption>
              </figure>
            </div>

            <p className="confirm-message ww-message" role="status">
              {state.status === "searching"
                ? `Looking for “${novel.title}” on Wuxiaworld…`
                : state.status === "missing"
                  ? `Couldn't find it under “${novel.title}”. Paste the novel's Wuxiaworld link instead.`
                  : "Wrong cover? Paste the novel's Wuxiaworld link to use that one."}
            </p>

            <form
              className="ww-link"
              onSubmit={(e) => {
                e.preventDefault();
                if (link.trim()) find({ url: link.trim() });
              }}
            >
              <input
                className="nf-input"
                type="url"
                placeholder="https://www.wuxiaworld.com/novel/…"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                aria-label="Wuxiaworld novel link"
                disabled={busy}
              />
              <button type="submit" className="confirm-btn-secondary" disabled={busy || !link.trim()}>
                Find
              </button>
            </form>

            {error && <p className="replace-error ww-error" role="alert">{error}</p>}

            <div className="confirm-actions">
              <button className="confirm-btn-primary" onClick={save} disabled={!state.dataUrl || busy}>
                {state.status === "saving" ? "Saving…" : "Use this cover"}
              </button>
              <button className="confirm-btn-secondary" onClick={close} disabled={state.status === "saving"}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
