import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import "../design/NovelPage.css";
import { Header } from "../components/Header";
import { AddNovelModal } from "../components/AddNovelModal";

import {
  getUserNovelByNovelId,
  createUserNovelEntry,
  editUserNovelEntry,
  deleteUserNovelEntry,
} from "../services/userNovelService";
import { useNovelEntry } from "../hooks/useNovelEntry";

const API_URL = import.meta.env.VITE_API_BASE_URL;

function NovelPage() {
  const { novelId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("displayUsername");

  const [globalNovel, setGlobalNovel] = useState(null);
  const [userNovel, setUserNovel] = useState(null);

  const [loadingGlobal, setLoadingGlobal] = useState(true);
  // No token means there's no user entry to fetch — start false to avoid a
  // spurious loading flash before the effect runs and calls setLoadingUser(false).
  const [loadingUser, setLoadingUser] = useState(!!token);

  const [showModal, setShowModal] = useState(false);
  const [coverError, setCoverError] = useState(false);

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
      res = await editUserNovelEntry(userNovel._id, payload, token);
    } else {
      res = await createUserNovelEntry(novelId, payload, token);
    }
    // res.novel is the novel ID string on the entry — must NOT be in this chain.
    // POST returns { userNovel }, PATCH returns { updatedEntry }.
    return res.userNovel ?? res.updatedEntry ?? res.entry ?? res;
  };

  const deleteEntry = async () => {
    await deleteUserNovelEntry(userNovel._id, token);
  };

  const isListMember = !!userNovel;

  // ----------------------------
  // 1. Fetch GLOBAL novel details
  // ----------------------------
  useEffect(() => {
    const fetchGlobalNovel = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/novels/${novelId}`);
        setGlobalNovel(res.data.novel);
        setCoverError(false);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingGlobal(false);
      }
    };

    fetchGlobalNovel();
  }, [novelId]);

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
        const data = await getUserNovelByNovelId(novelId, token);
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
  }, [novelId, token]);

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
    entryForm.reset();
    setShowModal(true);
  };

  const openEditModal = () => {
    // Pre-fill form with existing user data
    entryForm.fill(userNovel);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      // BUG 12 FIX: Consistent payload — progress sent as-is, null fields omitted
      const payload = {
        status: entryForm.status,
        progress: entryForm.progress === "" ? 0 : (entryForm.progress ?? 0),
        rating: entryForm.rating ?? undefined,
        startedAt: entryForm.startedAt ?? undefined,
        completedAt: entryForm.completedAt ?? undefined,
      };

      const saved = await saveEntry(payload);
      setUserNovel(saved);
      setShowModal(false);
    } catch (error) {
      console.error("Failed to save entry:", error);
      alert("An error occurred while saving.");
    }
  };

  const handleDelete = async () => {
    if (!userNovel) return;
    try {
      await deleteEntry();
      setUserNovel(null);
      setShowModal(false);
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  // ----------------------------
  // Render
  // ----------------------------

  if (loadingGlobal || loadingUser) {
    return <div className="page-loading">Loading Book Details...</div>;
  }

  if (!globalNovel) {
    return <div className="page-error">Novel not found.</div>;
  }

  return (
    <main className="page-container">
      <Header />

      {/* ================= Header Section ================= */}
      <header className="novel-header">
        <div className="novel-header-row">
          <div className="novel-cover-slot">
            {!coverError && globalNovel.coverImage ? (
              <a
                href={globalNovel.coverImage}
                target="_blank"
                rel="noopener noreferrer"
                className="novel-cover-link"
              >
                <img
                  src={globalNovel.coverImage}
                  alt={globalNovel.title}
                  className="novel-cover"
                  onError={() => setCoverError(true)}
                />
              </a>
            ) : (
              <div className="novel-cover-placeholder">
                <svg
                  className="book-placeholder-icon"
                  viewBox="0 0 24 24"
                  width="36"
                  height="36"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <span>No Cover</span>
              </div>
            )}
          </div>

          <div className="novel-header-text">
            <h1 className="novel-title">{globalNovel.title}</h1>

            <div className="novel-meta">
              <div className="meta-item">
                <span className="meta-label">Author:</span> {globalNovel.author}
              </div>
              {globalNovel.genres && globalNovel.genres.length > 0 && (
                <div className="meta-item">
                  <span className="meta-label">Tags:</span> {globalNovel.genres.join(", ")}
                </div>
              )}
              {globalNovel.originalTitle && (
                <div className="meta-item">
                  <span className="meta-label">Original Title:</span> {globalNovel.originalTitle}
                </div>
              )}
              <div className="meta-item">
                <span className="meta-label">Language:</span>{" "}
                {globalNovel.originalLanguage === "zh" ? "Chinese (Mandarin)" : "English"}
              </div>
              <div className="meta-item">
                <span className="meta-label">Status:</span>{" "}
                {globalNovel.publication?.status || "Unknown"}
              </div>
              {globalNovel.publication?.startYear && (
                <div className="meta-item">
                  <span className="meta-label">Published:</span>{" "}
                  {globalNovel.publication.startYear}
                  {globalNovel.publication.endYear ? ` – ${globalNovel.publication.endYear}` : " – Present"}
                </div>
              )}
              {globalNovel.chapterCount && (
                <div className="meta-item">
                  <span className="meta-label">Chapters:</span> {globalNovel.chapterCount}
                </div>
              )}
              <div className="meta-item">
                <span className="meta-label">Translation:</span>{" "}
                {globalNovel.isFullyTranslated ? "Completed" : "Incomplete"}
              </div>
              {(globalNovel.publishers?.original || globalNovel.publishers?.english) && (
                <div className="meta-item">
                  <span className="meta-label">Publishers:</span>{" "}
                  {[globalNovel.publishers?.original, globalNovel.publishers?.english]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}
            </div>

            {/* ================= USER ACTIONS AREA ================= */}
            {!isListMember ? (
              // If NOT in list, show Add button
              <button
                className="add-to-list-btn"
                onClick={openAddModal}
              >
                + Add to My List
              </button>
            ) : (
              // If IN list, show Status/Progress/Score
              <div className="user-novel-inline">
                <span className="user-label">My Status</span>

                <button
                  className={`status-btn-${userNovel.status.replaceAll(
                    " ",
                    "-"
                  )}`}
                  onClick={openEditModal}
                >
                  {userNovel.status}
                </button>

                <span className="user-meta">
                  {userNovel.progress ?? "0"} / {globalNovel.chapterCount ?? "?"}
                </span>

                <span className="user-meta">
                  Score {userNovel.rating ?? "—"}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================= Synopsis Card (Full Width) ================= */}
      <article className="novel-description-card">
        <h2 className="section-title">Synopsis</h2>
        <p className="synopsis-text">{globalNovel.synopsis || "No synopsis available."}</p>
      </article>

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

export { NovelPage };