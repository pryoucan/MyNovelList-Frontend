import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import "../design/NovelPage.css";
import "../design/status.css";
import { Header } from "../components/Header";
import { AddNovelModal } from "../components/AddNovelModal";
import NovelThumb from "../components/NovelThumb";
import ViewableImage from "../components/ViewableImage";
import StarRating from "../components/StarRating";
import StatusIcon from "../components/StatusIcon";
import PublicationIcon from "../components/PublicationIcon";
import NovelReviews from "../components/NovelReviews";
import WuxiaworldCover from "../components/WuxiaworldCover";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getNovelStatsById } from "../services/novelService";

import {
  getUserNovelByNovelId,
  createUserNovelEntry,
  editUserNovelEntry,
  deleteUserNovelEntry,
} from "../services/userNovelService";
import { useNovelEntry, buildEntryPayload } from "../hooks/useNovelEntry";
import BackArrow from "./BackArrow";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const LANGUAGES = { zh: "Chinese (Mandarin)", en: "English" };
// Synopses longer than this start collapsed.
const SYNOPSIS_PREVIEW_CHARS = 420;
const TAGS_PREVIEW = 20;

const statusSlug = (status) => status.toLowerCase().split(" ").join("-");

// Publication facts stay neutral (colour is reserved for the reader's status);
// PublicationIcon gives each one a shape.
const PUBLICATION_LABELS = {
  Ongoing: "Ongoing",
  Completed: "Finished",
  Upcoming: "Upcoming",
  "On Hiatus": "On hiatus",
  Cancelled: "Cancelled",
};

function NovelPage() {
  const { novelId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("displayUsername");

  const [globalNovel, setGlobalNovel] = useState(null);
  const [userNovel, setUserNovel] = useState(null);
  const [communityStats, setCommunityStats] = useState(null);
  const statsRequest = useRef(0);

  const [loadingGlobal, setLoadingGlobal] = useState(true);
  // No token means there's no user entry to fetch — start false to avoid a
  // spurious loading flash before the effect runs and calls setLoadingUser(false).
  const [loadingUser, setLoadingUser] = useState(!!token);

  const [showModal, setShowModal] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const [synopsisOpen, setSynopsisOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const currentUser = useCurrentUser();
  // Inline rating on the entry card: "idle" | "saving" | "saved" | "error"
  const [ratingSave, setRatingSave] = useState("idle");
  const [hoverRating, setHoverRating] = useState(null);

  // Hook to manage form state (status, progress, rating, etc.)
  const entryForm = useNovelEntry();

  // BUG 3 FIX: Removed useNovelManager — it was fetching ALL novels and ALL
  // user entries on every NovelPage mount, which is unnecessary here.
  // Instead, use the service functions directly for targeted API calls.

  // BUG 4 FIX: Local saveEntry extracts the user novel from the response
  // with a clear fallback chain, so setUserNovel always gets the right shape.
  const saveEntry = async (payload) => {
    let res;
    if (userNovel) {
      res = await editUserNovelEntry(userNovel.id, payload);
    } else {
      res = await createUserNovelEntry(novelId, payload);
    }
    // res.novelId is the novel ID string on the entry — must NOT be in this chain.
    // POST returns { userNovel }, PATCH returns { updatedEntry }.
    return res.userNovel ?? res.updatedEntry ?? res.entry ?? res;
  };

  const deleteEntry = async () => {
    await deleteUserNovelEntry(userNovel.id);
  };

  const isListMember = !!userNovel;
  const community = communityStats?.novelId === novelId ? communityStats : null;

  const refreshCommunityScore = useCallback(() => {
    const requestId = ++statsRequest.current;
    getNovelStatsById(novelId)
      .then((stats) => { if (requestId === statsRequest.current) setCommunityStats(stats); })
      .catch(() => { if (requestId === statsRequest.current) setCommunityStats({ novelId, unavailable: true }); });
  }, [novelId]);

  useEffect(() => {
    refreshCommunityScore();
  }, [refreshCommunityScore]);

  // Rate straight from the entry card (same PATCH endpoint as the modal).
  // Optimistic: show the new score immediately, roll back if the save fails.
  const quickRate = async (rating) => {
    const previous = userNovel.rating;
    setUserNovel((entry) => ({ ...entry, rating }));
    setRatingSave("saving");
    try {
      const res = await editUserNovelEntry(userNovel.id, { rating });
      setUserNovel(res.updatedEntry ?? { ...userNovel, rating });
      refreshCommunityScore();
      setRatingSave("saved");
      setTimeout(() => setRatingSave((state) => (state === "saved" ? "idle" : state)), 1500);
    } catch {
      setUserNovel((entry) => ({ ...entry, rating: previous }));
      setRatingSave("error");
    }
  };

  // ----------------------------
  // 1. Fetch GLOBAL novel details
  // ----------------------------
  const fetchGlobalNovel = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/novels/${novelId}`);
      setGlobalNovel(res.data.novel);
      setCoverError(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGlobal(false);
    }
  }, [novelId]);

  useEffect(() => {
    fetchGlobalNovel();
  }, [fetchGlobalNovel]);

  // ----------------------------
  // 2. Fetch USER novel entry (if logged in)
  // ----------------------------
  useEffect(() => {
    if (!token) {
      setLoadingUser(false);
      return;
    }

    const fetchUserNovel = async () => {
      try {
        const data = await getUserNovelByNovelId(novelId);
        setUserNovel(data);
      } catch (err) {
        // BUG 21 FIX: Distinguish 401 (auth error) from 404 (not in list)
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("displayUsername");
          navigate("/login");
          return;
        }
        // 404 = novel not in user's list — treat as null (expected case)
        setUserNovel(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserNovel();
  }, [novelId, token, navigate]);

  // ----------------------------
  // 3. Modal & Action Handlers
  // ----------------------------

  const openAddModal = () => {
    // LOGIC ADDED: Check login status before opening
    if (!token) {
      alert("Login required to add novels to your list.");
      return;
    }
    
    // Reset form to default (Reading, 0 progress)
    entryForm.reset(globalNovel?.publication?.status === "Upcoming" ? "Plan To Read" : "Reading");
    setShowModal(true);
  };

  const openEditModal = () => {
    // Pre-fill form with existing user data
    entryForm.fill(userNovel);
    setShowModal(true);
  };

  // Errors propagate to the modal, which shows them inline.
  const handleSubmit = async () => {
    const saved = await saveEntry(buildEntryPayload(entryForm));
    if ((saved.rating ?? null) !== (userNovel?.rating ?? null)) refreshCommunityScore();
    setUserNovel(saved);
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!userNovel) return;
    await deleteEntry();
    if (userNovel.rating != null) refreshCommunityScore();
    setUserNovel(null);
    setShowModal(false);
  };

  // ----------------------------
  // Render
  // ----------------------------

  if (loadingGlobal || loadingUser) {
    return <NovelPageSkeleton />;
  }

  if (!globalNovel) {
    return <div className="page-error">Novel not found.</div>;
  }

  return (
    <main className="page-container">
      <Header />

      <Link to="/" className="back-link">
        <BackArrow /> Back to list
      </Link>

      {/* ================= Header Section ================= */}
      <header className="novel-header">
        <div className="novel-header-row">
          <div className="novel-cover-slot">
            {!coverError && globalNovel.coverImage ? (
              <ViewableImage src={globalNovel.coverImage} title={globalNovel.title} className="novel-cover-link">
                <img
                  src={globalNovel.coverImage}
                  alt={globalNovel.title}
                  className="novel-cover"
                  onError={() => setCoverError(true)}
                />
              </ViewableImage>
            ) : (
              <NovelThumb title={globalNovel.title} size="lg" />
            )}
          </div>

          <div className="novel-header-text">
            <h1 className="novel-title">{globalNovel.title}</h1>
            <p className="novel-byline">
              {globalNovel.originalTitle && (
                <>
                  <span lang={globalNovel.originalLanguage}>{globalNovel.originalTitle}</span>
                  <span className="byline-sep" aria-hidden="true">·</span>
                </>
              )}
              <span>{globalNovel.author}</span>
            </p>

            {globalNovel.genres?.length > 0 && (
              <ul className="tag-list" aria-label="Genres">
                {globalNovel.genres.map((genre) => (
                  <li key={genre} className="tag-chip">{genre}</li>
                ))}
              </ul>
            )}

            {/* ================= USER ENTRY CARD ================= */}
            {!isListMember ? (
              <div className="entry-card entry-card--empty">
                <div>
                  <div className="entry-card-title">Not on your list yet</div>
                  <div className="entry-card-sub">Track your progress and score for this novel.</div>
                </div>
                <button className="add-to-list-btn" onClick={openAddModal}>
                  <span aria-hidden="true">+</span> Add to list
                </button>
              </div>
            ) : (
              <div className="entry-card">
                <div className="entry-card-head">
                  <span className="entry-card-label">On your list</span>
                  <button className="entry-edit-btn" onClick={openEditModal}>
                    Edit
                  </button>
                </div>

                <div className="entry-card-row">
                  <button
                    className="status-chip"
                    onClick={openEditModal}
                    aria-label={`${userNovel.status}. Edit your entry`}
                  >
                    <StatusIcon
                      status={userNovel.status}
                      progress={globalNovel.chapterCount ? (userNovel.progress ?? 0) / globalNovel.chapterCount : null}
                    />
                    {userNovel.status}
                  </button>

                  {/* Plan To Read and unreleased novels can't be rated (the backend rejects it). */}
                  {userNovel.status === "Plan To Read" || globalNovel.publication?.status === "Upcoming" ? (
                    <span className="entry-muted">Rate it once you start reading</span>
                  ) : (
                    <div className="entry-score">
                      <span className="visually-hidden" id="entry-rating-label">Your rating</span>
                      <StarRating
                        value={userNovel.rating}
                        onChange={quickRate}
                        onHoverChange={setHoverRating}
                        labelledBy="entry-rating-label"
                        size="sm"
                      />
                      <span className="entry-score-value" aria-live="polite">
                        {hoverRating !== null ? (
                          <span className="entry-score-hover">
                            <strong>{hoverRating}</strong> / 10
                          </span>
                        ) : ratingSave === "saving" ? (
                          "Saving…"
                        ) : ratingSave === "error" ? (
                          <span className="entry-score-error">Couldn't save</span>
                        ) : userNovel.rating != null ? (
                          <>
                            <strong>{userNovel.rating}</strong> / 10
                            {ratingSave === "saved" && <span className="entry-score-saved"> ✓ Saved</span>}
                          </>
                        ) : (
                          "Tap a star to rate"
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {userNovel.status !== "Plan To Read" && (
                  <div className="progress entry-progress">
                    {globalNovel.chapterCount > 0 && (
                      <div
                        className={`progress-track progress-track--${statusSlug(userNovel.status)}`}
                        role="progressbar"
                        aria-valuenow={Math.min(100, Math.round(((userNovel.progress ?? 0) / globalNovel.chapterCount) * 100))}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Reading progress"
                      >
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min(100, ((userNovel.progress ?? 0) / globalNovel.chapterCount) * 100)}%` }}
                        />
                      </div>
                    )}
                    <span className="progress-text">
                      {(userNovel.progress ?? 0).toLocaleString()}
                      {globalNovel.chapterCount ? ` / ${globalNovel.chapterCount.toLocaleString()}` : ""} c
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================= Details ================= */}
      {token && (
        <div className="novel-actions">
          {currentUser?.role === "ADMIN" && <WuxiaworldCover novel={globalNovel} onSaved={fetchGlobalNovel} />}
          <Link to={`/novel/${novelId}/suggest-edit`} className="page-action">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            {currentUser?.role === "ADMIN" ? "Edit details" : "Suggest an edit"}
          </Link>
        </div>
      )}
      <section className="novel-card" aria-labelledby="details-title">
        <div className="novel-card-head">
          <h2 className="section-title" id="details-title">Details</h2>
        </div>
        <dl className="details-grid">
          <dt>Community score</dt>
          <dd className="community-rating">
            {community?.unavailable ? (
              <span>Unavailable</span>
            ) : !community ? (
              <span>Loading…</span>
            ) : (
              <>
                <span className="community-rating-value">
                  {community.score != null ? <>{community.score} <span aria-hidden="true">★</span> / 10</> : "New"}
                </span>
                <span className="community-rating-count">
                  {community.ratingCount === 0 ? "No ratings yet" : `Rated by ${community.ratingCount} ${community.ratingCount === 1 ? "reader" : "readers"}`}
                </span>
              </>
            )}
          </dd>
          <dt>Status</dt>
          <dd className="pub-status">
            <PublicationIcon status={globalNovel.publication?.status} />
            <span className="pub-label">{PUBLICATION_LABELS[globalNovel.publication?.status] ?? "Unknown"}</span>
            {globalNovel.publication?.startYear && (
              <span className="pub-years">
                {" · "}
                {globalNovel.publication.startYear}
                {globalNovel.publication.endYear ? ` – ${globalNovel.publication.endYear}` : " – present"}
              </span>
            )}
          </dd>

          {globalNovel.chapterCount > 0 && (
            <>
              <dt>Chapters</dt>
              <dd>{globalNovel.chapterCount.toLocaleString()}</dd>
            </>
          )}

          <dt>Language</dt>
          <dd>{LANGUAGES[globalNovel.originalLanguage] ?? globalNovel.originalLanguage}</dd>

          <dt>Translation</dt>
          <dd>{globalNovel.isFullyTranslated ? "Fully translated" : "Partially translated"}</dd>

          {(globalNovel.publishers?.original || globalNovel.publishers?.english) && (
            <>
              <dt>Publishers</dt>
              <dd>
                {[globalNovel.publishers?.original, globalNovel.publishers?.english]
                  .filter(Boolean)
                  .join(" · ")}
              </dd>
            </>
          )}
        </dl>
      </section>

      {/* ================= Synopsis ================= */}
      <article className="novel-card" aria-labelledby="synopsis-title">
        <h2 className="section-title" id="synopsis-title">Synopsis</h2>
        {globalNovel.synopsis ? (
          <>
            <p
              id="synopsis-text"
              className={`synopsis-text${
                globalNovel.synopsis.length > SYNOPSIS_PREVIEW_CHARS && !synopsisOpen ? " synopsis-text--clamped" : ""
              }`}
            >
              {globalNovel.synopsis}
            </p>
            {globalNovel.synopsis.length > SYNOPSIS_PREVIEW_CHARS && (
              <button
                className="read-more-btn"
                aria-expanded={synopsisOpen}
                aria-controls="synopsis-text"
                onClick={() => setSynopsisOpen((open) => !open)}
              >
                {synopsisOpen ? "Show less" : "Read more"}
              </button>
            )}
          </>
        ) : (
          <p className="synopsis-text entry-muted">No synopsis available.</p>
        )}
      </article>

      {/* ================= Tags ================= */}
      {globalNovel.tags?.length > 0 && (
        <section className="novel-card" aria-labelledby="tags-title">
          <h2 className="section-title" id="tags-title">
            Tags <span className="section-count">{globalNovel.tags.length}</span>
          </h2>
          <ul id="tag-list" className="tag-list tag-list--card">
            {(tagsOpen ? globalNovel.tags : globalNovel.tags.slice(0, TAGS_PREVIEW)).map((tag) => (
              <li key={tag} className="tag-chip">{tag}</li>
            ))}
          </ul>
          {globalNovel.tags.length > TAGS_PREVIEW && (
            <button
              className="read-more-btn"
              aria-expanded={tagsOpen}
              aria-controls="tag-list"
              onClick={() => setTagsOpen((open) => !open)}
            >
              {tagsOpen ? "Show fewer" : `Show all ${globalNovel.tags.length} tags`}
            </button>
          )}
        </section>
      )}

      <NovelReviews key={novelId} novelId={novelId} />

      {/* ================= The Modal ================= */}
      {/* BUG 26 FIX: Explicit props instead of {...entryForm} spread,
          which was passing fill/reset functions as unknown DOM props */}
      <AddNovelModal
        open={showModal}
        novel={globalNovel}
        entry={userNovel}
        isEditing={!!userNovel}
        status={entryForm.status}
        progress={entryForm.progress}
        rating={entryForm.rating}
        startedAt={entryForm.startedAt}
        completedAt={entryForm.completedAt}
        setStatus={entryForm.setStatus}
        setProgress={entryForm.setProgress}
        setRating={entryForm.setRating}
        setStartedAt={entryForm.setStartedAt}
        setCompletedAt={entryForm.setCompletedAt}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </main>
  );
}

// Mirrors the real layout (cover, title, tags, entry card, details, synopsis)
// so the page doesn't jump when the data arrives.
const SKELETON_TAGS = [52, 74, 60, 86, 58];
const SKELETON_SYNOPSIS = ["100%", "96%", "98%", "91%", "62%"];

function NovelPageSkeleton() {
  return (
    <main className="page-container" aria-busy="true">
      <Header />
      <span className="visually-hidden" role="status">Loading novel…</span>

      <div className="skeleton nps-back" />

      <div className="novel-header" aria-hidden="true">
        <div className="novel-header-row">
          <div className="skeleton nps-cover" />
          <div className="novel-header-text">
            <div className="skeleton nps-title" />
            <div className="skeleton nps-byline" />
            <div className="nps-tags">
              {SKELETON_TAGS.map((w, i) => (
                <div key={i} className="skeleton nps-tag" style={{ width: w }} />
              ))}
            </div>
            <div className="entry-card nps-entry">
              <div className="nps-row">
                <div className="skeleton nps-label" />
                <div className="skeleton nps-pill" />
              </div>
              <div className="nps-row">
                <div className="skeleton nps-status" />
                <div className="skeleton nps-stars" />
              </div>
              <div className="skeleton nps-bar" />
            </div>
          </div>
        </div>
      </div>

      <section className="novel-card" aria-hidden="true">
        <div className="skeleton nps-section-title" />
        <div className="nps-details">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="nps-detail">
              <div className="skeleton nps-dt" />
              <div className="skeleton nps-dd" style={{ width: `${55 + ((i * 17) % 35)}%` }} />
            </div>
          ))}
        </div>
      </section>

      <section className="novel-card" aria-hidden="true">
        <div className="skeleton nps-section-title" />
        <div className="nps-synopsis">
          {SKELETON_SYNOPSIS.map((w, i) => (
            <div key={i} className="skeleton nps-line" style={{ width: w }} />
          ))}
        </div>
      </section>
    </main>
  );
}

export { NovelPage };
