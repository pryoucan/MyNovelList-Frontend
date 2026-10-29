import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getNovelReviews, createNovelReview, editNovelReview } from "../services/reviewService";
import "../design/NovelReviews.css";

const dateLabel = (value) => new Date(value).toLocaleDateString(undefined, {
  year: "numeric", month: "short", day: "numeric",
});

function ReviewCard({ review, own, onEdit }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <article className="review-card">
      <div className="review-card-head">
        <div className="review-author-line">
          <strong>{review.username}</strong>
          {own && <span className="review-own">You</span>}
          <span className="review-date">{dateLabel(review.createdAt)}</span>
          {review.editedAt && <span className="review-edited" title={`Edited ${dateLabel(review.editedAt)}`}>(edited)</span>}
        </div>
        {own && <button type="button" className="review-text-button" onClick={onEdit}>Edit</button>}
      </div>
      {review.isSpoiler && !revealed ? (
        <button type="button" className="review-spoiler" onClick={() => setRevealed(true)} aria-label={`Reveal spoiler review by ${review.username}`}>
          <span className="review-spoiler-icon" aria-hidden="true">✦</span>
          Spoiler — click to reveal review
        </button>
      ) : (
        <div>
          {review.isSpoiler && (
            <button type="button" className="review-text-button review-hide" onClick={() => setRevealed(false)}>Hide spoiler</button>
          )}
          <p className="review-body">{review.body}</p>
        </div>
      )}
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
  const [isSpoiler, setIsSpoiler] = useState(false);
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
    setBody(mine?.body ?? "");
    setIsSpoiler(mine?.isSpoiler ?? false);
    setSaveError("");
    setEditing(true);
  };

  const save = async (event) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || trimmed.length > 5000) {
      setSaveError("Write a review between 1 and 5000 characters.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const review = mine
        ? await editNovelReview(novelId, { body: trimmed, isSpoiler })
        : await createNovelReview(novelId, { body: trimmed, isSpoiler });
      setReviews((previous) => mine
        ? previous.map((item) => item.id === review.id ? review : item)
        : [review, ...previous]);
      setEditing(false);
    } catch (error) {
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
        {currentUser && !loading && !loadError && !mine && !editing && <button type="button" className="review-primary" onClick={openEditor}>Write a review</button>}
      </div>

      {editing && (
        <form className="review-editor" onSubmit={save}>
          <label htmlFor="review-body">{mine ? "Edit your review" : "Your review"}</label>
          <textarea id="review-body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={5000} rows={5} placeholder="What did you think of this novel?" required />
          <div className="review-editor-options">
            <label className="review-spoiler-choice">
              <input type="checkbox" checked={isSpoiler} onChange={(event) => setIsSpoiler(event.target.checked)} />
              Contains spoilers
            </label>
            <span>{body.length}/5000</span>
          </div>
          <p className="review-editor-hint">Spoiler reviews stay hidden until a reader clicks to reveal them.</p>
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
            <ReviewCard key={review.id} review={review} own={review.userId === currentUser?.id} onEdit={openEditor} />
          ))}
        </div>
      )}
    </section>
  );
}
