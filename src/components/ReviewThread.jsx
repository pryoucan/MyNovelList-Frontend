import { useState } from "react";
import { Link } from "react-router-dom";
import { splitSpoilers } from "../utils/reviewSpoilers";

const dateLabel = (value) => new Date(value).toLocaleDateString(undefined, {
  year: "numeric", month: "short", day: "numeric",
});

function SpoilerText({ text }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <button type="button" className={`review-inline-spoiler${revealed ? " review-inline-spoiler--revealed" : ""}`}
      aria-label={revealed ? `Hide spoiler: ${text}` : "Reveal spoiler"} aria-pressed={revealed}
      onClick={() => setRevealed((value) => !value)}>
      <span aria-hidden={!revealed}>{text}</span>
    </button>
  );
}

export function ReviewBody({ body, wholeSpoiler = false }) {
  const parts = wholeSpoiler ? [{ text: body, spoiler: true }] : splitSpoilers(body);
  return (
    <p className="review-body">
      {parts.map((part, index) => part.spoiler
        ? <SpoilerText key={index} text={part.text} />
        : <span key={index}>{part.text}</span>)}
    </p>
  );
}

export function LikeButton({ item, canLike, onToggle }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toggle = async () => {
    setBusy(true);
    setError("");
    try { await onToggle(!item.likedByMe); }
    catch { setError("Couldn’t update like."); }
    finally { setBusy(false); }
  };
  return (
    <span className="review-like-wrap">
      <button type="button" className={`review-action${item.likedByMe ? " review-action--liked" : ""}`}
        aria-label={`${item.likedByMe ? "Unlike" : "Like"}. ${item.likesCount ?? 0} likes`}
        aria-pressed={!!item.likedByMe} disabled={!canLike || busy} title={!canLike ? "Sign in to like" : undefined} onClick={toggle}>
        <span aria-hidden="true">♥</span> {item.likesCount ?? 0}
      </button>
      {error && <span className="review-action-error" role="alert">{error}</span>}
    </span>
  );
}

export function ReplyComposer({ label, onSubmit, onCancel }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || trimmed.length > 2000) { setError("Write 1–2000 characters."); return; }
    setBusy(true);
    setError("");
    try { await onSubmit(trimmed); }
    catch (failure) { setError(failure.response?.data?.message ?? "Couldn’t post your reply."); setBusy(false); }
  };
  return (
    <form className="review-reply-form" onSubmit={submit}>
      <label>{label}
        <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={3}
          placeholder="Write a reply. Use ||spoiler|| to hide spoilers." required autoFocus />
      </label>
      <div className="review-reply-form-actions">
        <span>{body.length}/2000</span>
        <button type="submit" className="review-primary" disabled={busy}>{busy ? "Posting…" : "Post reply"}</button>
        <button type="button" className="review-text-button" disabled={busy} onClick={onCancel}>Cancel</button>
      </div>
      {error && <p className="review-error" role="alert">{error}</p>}
    </form>
  );
}

export function ThreadReply({ reply, reviewId, currentUser, onReply, onEdit, onDelete, onLike, depth = 0 }) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const own = !reply.deletedAt && currentUser?.id === reply.userId;

  const saveEdit = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || body.length > 2000) { setError("Write 1–2000 characters."); return; }
    setBusy(true);
    setError("");
    try { await onEdit(reviewId, reply.id, body); setEditing(false); }
    catch (failure) { setError(failure.response?.data?.message ?? "Couldn’t save reply."); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    setError("");
    try { await onDelete(reviewId, reply.id); setConfirmingDelete(false); setReplying(false); }
    catch (failure) { setError(failure.response?.data?.message ?? "Couldn’t delete reply."); }
    finally { setBusy(false); }
  };

  return (
    <div className="review-reply" id={`reply-${reply.id}`}>
      <div className="review-author-line">
        {reply.deletedAt ? <span className="review-deleted-name">Deleted reply</span> : (
          <Link to={`/profile/${encodeURIComponent(reply.username)}`} className="review-author-link">{reply.username}</Link>
        )}
        {own && <span className="review-own">You</span>}
        <span className="review-date">{dateLabel(reply.createdAt)}</span>
        {reply.editedAt && !reply.deletedAt && <span className="review-edited">(edited)</span>}
      </div>

      {reply.deletedAt ? <p className="review-deleted-body">This reply was deleted.</p> : editing ? (
        <form className="review-reply-form" onSubmit={saveEdit}>
          <textarea aria-label="Edit reply" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} rows={3} required />
          <div className="review-reply-form-actions">
            <span>{draft.length}/2000</span>
            <button type="submit" className="review-primary" disabled={busy}>Save</button>
            <button type="button" className="review-text-button" disabled={busy} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : <ReviewBody body={reply.body} />}

      {!reply.deletedAt && !editing && !confirmingDelete && (
        <div className="review-thread-actions">
          <LikeButton item={reply} canLike={!!currentUser} onToggle={(liked) => onLike(reviewId, reply.id, reply, liked)} />
          {currentUser && <button type="button" className="review-action" onClick={() => setReplying((value) => !value)}>Reply</button>}
          {own && <button type="button" className="review-action" onClick={() => { setDraft(reply.body); setError(""); setEditing(true); }}>Edit</button>}
          {own && <button type="button" className="review-action review-action--danger" onClick={() => { setError(""); setConfirmingDelete(true); }}>Delete</button>}
        </div>
      )}

      {confirmingDelete && <div className="review-delete-confirm">
        <span>Delete this reply? Its child replies will remain.</span>
        <button type="button" className="review-delete-button" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete reply"}</button>
        <button type="button" className="review-text-button" disabled={busy} onClick={() => setConfirmingDelete(false)}>Cancel</button>
      </div>}
      {error && <p className="review-error" role="alert">{error}</p>}
      {replying && currentUser && <ReplyComposer label={`Reply to ${reply.deletedAt ? "thread" : reply.username}`} onSubmit={async (body) => { await onReply(reviewId, reply.id, body); setReplying(false); }} onCancel={() => setReplying(false)} />}

      {(reply.children?.length ?? 0) > 0 && (
        <div className={`review-reply-children${depth >= 3 ? " review-reply-children--flat" : ""}`}>
          {reply.children.map((child) => <ThreadReply key={child.id} reply={child} reviewId={reviewId} currentUser={currentUser}
            onReply={onReply} onEdit={onEdit} onDelete={onDelete} onLike={onLike} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}
