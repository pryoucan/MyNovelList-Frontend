import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getNovelReviews, createNovelReview, editNovelReview, deleteNovelReview } from "../services/reviewService";
import { splitSpoilers } from "../utils/reviewSpoilers";
import "../design/NovelReviews.css";

const dateLabel = (value) => new Date(value).toLocaleDateString(undefined, {
  year: "numeric", month: "short", day: "numeric",
});

function SpoilerText({ text }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <button
      type="button"
      className={`review-inline-spoiler${revealed ? " review-inline-spoiler--revealed" : ""}`}
      aria-label={revealed ? `Hide spoiler: ${text}` : "Reveal spoiler"}
      aria-pressed={revealed}
      onClick={() => setRevealed((value) => !value)}
    >
      <span aria-hidden={!revealed}>{text}</span>
    </button>
  );
}

function ReviewCard({ review, own, onEdit, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const parts = review.isSpoiler
    ? [{ text: review.body, spoiler: true }]
    : splitSpoilers(review.body);

  return (
    <article className="review-card">
      <div className="review-card-head">
        <div className="review-author-line">
          <strong>{review.username}</strong>
          {own && <span className="review-own">You</span>}
          <span className="review-date">{dateLabel(review.createdAt)}</span>
          {review.editedAt && <span className="review-edited" title={`Edited ${dateLabel(review.editedAt)}`}>(edited)</span>}
          {review.pending && <span className="review-date">Saving…</span>}
        </div>
        {own && !review.pending && !confirmingDelete && (
          <div className="review-card-actions">
            <button type="button" className="review-text-button" onClick={onEdit}>Edit</button>
            <button type="button" className="review-text-button review-delete-link" onClick={() => { setDeleteError(""); setConfirmingDelete(true); }}>Delete</button>
          </div>
        )}
      </div>
      {confirmingDelete && (
        <div className="review-delete-confirm">
          <span>Delete your review? This can’t be undone.</span>
          <div className="review-card-actions">
            <button type="button" className="review-delete-button" disabled={deleting} onClick={async () => {
              setDeleting(true);
              setDeleteError("");
              try {
                await onDelete();
              } catch (error) {
                setDeleteError(error.response?.data?.message ?? "Couldn’t delete your review. Please try again.");
                setDeleting(false);
              }
            }}>{deleting ? "Deleting…" : "Delete review"}</button>
            <button type="button" className="review-text-button" disabled={deleting} onClick={() => setConfirmingDelete(false)}>Cancel</button>
          </div>
          {deleteError && <p className="review-error" role="alert">{deleteError}</p>}
        </div>
      )}
      <p className="review-body">
        {parts.map((part, index) => part.spoiler
          ? <SpoilerText key={index} text={part.text} />
          : <span key={index}>{part.text}</span>)}
      </p>
    </article>
  );
}

export default function NovelReviews({ novelId }) {
  const currentUser = useCurrentUser();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let active = true;
    getNovelReviews(novelId)
      .then((data) => { if (active) { setReviews(data); setLoadError(""); } })
      .catch(() => { if (active) setLoadError("Couldn’t load reviews. Please refresh the page."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [novelId]);

  const mine = reviews.find((review) => review.userId === currentUser?.id);
  const openEditor = () => {
    // Convert old whole-review spoilers to inline syntax when they are edited.
    setBody(mine?.isSpoiler ? `||${mine.body}||` : mine?.body ?? "");
    setSaveError("");
    setEditing(true);
  };

  const removeMine = async () => {
    await deleteNovelReview(novelId);
    setReviews((items) => items.filter((item) => item.userId !== currentUser?.id));
    setEditing(false);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!currentUser) {
      setSaveError("Sign in again to post your review.");
      return;
    }
    const trimmed = body.trim();
    if (!trimmed || trimmed.length > 5000) {
      setSaveError("Write a review between 1 and 5000 characters.");
      return;
    }
    const previous = reviews;
    const temporaryId = mine?.id ?? `pending-${Date.now()}`;
    const optimistic = {
      id: temporaryId,
      userId: currentUser.id,
      novelId,
      username: currentUser.username,
      body: trimmed,
      isSpoiler: false,
      createdAt: mine?.createdAt ?? new Date().toISOString(),
      editedAt: mine && mine.body !== trimmed ? new Date().toISOString() : mine?.editedAt ?? null,
      pending: true,
    };
    setReviews((items) => mine
      ? items.map((item) => item.id === mine.id ? optimistic : item)
      : [optimistic, ...items]);
    setEditing(false);
    setSaving(true);
    setSaveError("");
    try {
      const review = mine
        ? await editNovelReview(novelId, { body: trimmed, isSpoiler: false })
        : await createNovelReview(novelId, { body: trimmed, isSpoiler: false });
      setReviews((items) => items.map((item) => item.id === temporaryId ? review : item));
    } catch (error) {
      setReviews(previous);
      setBody(trimmed);
      setEditing(true);
      setSaveError(error.response?.data?.message ?? "Couldn’t save your review. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="novel-card review-section" aria-labelledby="reviews-title">
      <div className="review-section-head">
        <div>
          <h2 className="section-title" id="reviews-title">Reader reviews</h2>
          {!loading && !loadError && <span className="review-count">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>}
        </div>
        {currentUser && !loading && !loadError && !mine && !editing && !saving && <button type="button" className="review-primary" onClick={openEditor}>Write a review</button>}
      </div>

      {editing && (
        <form className="review-editor" onSubmit={save}>
          <label htmlFor="review-body">{mine ? "Edit your review" : "Your review"}</label>
          <textarea id="review-body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={5000} rows={5} placeholder="What did you think? Put ||spoiler text|| between two pairs of pipes." required />
          <div className="review-editor-options">
            <span className="review-spoiler-format">
              Contains spoilers
              <span className="review-help-wrap">
                <button type="button" className="review-help-icon" aria-label="How to mark spoilers" aria-describedby="review-spoiler-tip">?</button>
                <span id="review-spoiler-tip" role="tooltip" className="review-help-tip">Wrap spoiler text in ||double pipes||. Only that part will be hidden until clicked.</span>
              </span>
            </span>
            <span>{body.length}/5000</span>
          </div>
          <p className="review-editor-hint">Example: I liked the ending, but ||the hero’s reveal|| surprised me.</p>
          {saveError && <p className="review-error" role="alert">{saveError}</p>}
          <div className="review-actions">
            <button type="submit" className="review-primary" disabled={saving}>{saving ? "Saving…" : mine ? "Save changes" : "Post review"}</button>
            <button type="button" className="review-text-button" disabled={saving} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      )}

      {!currentUser && !editing && <p className="review-signin"><Link to="/login">Sign in</Link> to write a review.</p>}
      {loading && <p className="review-empty">Loading reviews…</p>}
      {loadError && <p className="review-error" role="alert">{loadError}</p>}
      {!loading && !loadError && reviews.length === 0 && <p className="review-empty">No reviews yet. Be the first to share your thoughts.</p>}
      {!loading && !loadError && reviews.length > 0 && (
        <div className="review-list">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} own={review.userId === currentUser?.id} onEdit={openEditor} onDelete={removeMine} />
          ))}
        </div>
      )}
    </section>
  );
}
