import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AddNovelModal } from "../components/AddNovelModal";
import NovelThumb from "../components/NovelThumb";
import Logo from "../components/Logo";
import UserMenu from "../components/UserMenu";
import StatusIcon from "../components/StatusIcon";
import HomeHero from "../components/home/HomeHero";
import ContinueReading from "../components/home/ContinueReading";
import PopularNovels from "../components/home/PopularNovels";
import GenreChips from "../components/home/GenreChips";
import { getNovelStats } from "../services/novelService";
import { useNovelEntry, buildEntryPayload } from "../hooks/useNovelEntry";
import { useNovelManager } from "../hooks/useNovelManager";
import { suggestNovelPath } from "../utils/suggestLink";
import "../design/Homepage.css";
import "../design/status.css";
import "../design/Home.css";

// Publication status of the novel itself ("Completed" is shown as "Finished"
// so it isn't confused with the reader's own "Completed").
const PUBLICATION_FILTERS = [
  { value: "", label: "All" },
  { value: "Ongoing", label: "Ongoing" },
  { value: "Upcoming", label: "Upcoming" },
  { value: "Completed", label: "Finished" },
];

// The reader's own status for novels on their list.
const LIST_FILTERS = [
  { value: "", label: "All" },
  { value: "Reading", label: "Reading" },
  { value: "Completed", label: "Completed" },
  { value: "On Hold", label: "On Hold" },
  { value: "Plan To Read", label: "Plan To Read" },
  { value: "Dropped", label: "Dropped" },
];

const statusSlug = (status) => status.toLowerCase().split(" ").join("-");

const matchesSearch = (novel, query) => {
  if (!query) return true;
  const q = query.toLowerCase();
  return [novel.title, novel.originalTitle, novel.author].some((field) => field?.toLowerCase().includes(q));
};

function Homepage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");

  const displayUsername = localStorage.getItem("displayUsername");
  const isLoggedIn = !!displayUsername;
  const showReadingListOnly = view === "readinglist" && isLoggedIn;

  const { novels, userEntries, loading, saveEntry, deleteEntry, authError } =
    useNovelManager(isLoggedIn);

  const entryForm = useNovelEntry();

  // Each view keeps its own filter, so switching views never shows a stale one.
  const [filters, setFilters] = useState({ all: "", list: "" });
  const viewKey = showReadingListOnly ? "list" : "all";
  const filter = filters[viewKey];
  const setFilter = (value) => setFilters((prev) => ({ ...prev, [viewKey]: value }));
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [stats, setStats] = useState([]);
  const [statsReady, setStatsReady] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    getNovelStats().then(setStats).finally(() => setStatsReady(true));
  }, []);

  const statsByNovel = new Map(stats.map((item) => [item.novelId, item]));

  const scrollToList = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    listRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  // Switching between "All novels" and "My list" adds or removes the sections
  // above the list, which would leave the page scrolled somewhere unrelated.
  // Keep the tab row at the same spot on screen instead.
  const tabAnchor = useRef(null);
  const switchView = (to) => {
    const top = listRef.current?.getBoundingClientRect().top;
    tabAnchor.current = top == null ? null : Math.max(0, top);
    navigate(to);
  };

  useLayoutEffect(() => {
    if (tabAnchor.current == null || !listRef.current) return;
    const listTop = listRef.current.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, listTop - tabAnchor.current) });
    tabAnchor.current = null;
  }, [viewKey]);

  const pickGenre = (next) => {
    setGenre(next);
    if (next) scrollToList();
  };

  // +1 chapter from "Continue reading"; the backend caps it at the chapter count.
  const advanceProgress = (novelId, progress) => saveEntry(novelId, { progress });
  const [showModal, setShowModal] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState(null);


  // BUG 15 FIX: Redirect to login when token is expired/invalid
  useEffect(() => {
    if (authError) {
      localStorage.removeItem("token");
      localStorage.removeItem("displayUsername");
      navigate("/login");
    }
  }, [authError, navigate]);

  // Fill the form in the same event as opening, so the modal's first render
  // already has the entry's values (no second render, no stale status).
  const openModal = (novel) => {
    if (!isLoggedIn) return alert("Login required");
    const existingEntry = userEntries[novel.id];
    if (existingEntry) {
      entryForm.fill(existingEntry);
    } else {
      entryForm.reset(novel.publication?.status === "Upcoming" ? "Plan To Read" : "Reading");
    }
    setSelectedNovel(novel);
    setShowModal(true);
  };

  // BUG 2 FIX: Moved currentEntry declaration before functions that use it
  const currentEntry = selectedNovel ? userEntries[selectedNovel.id] : null;

  // Errors propagate to the modal, which shows them inline.
  const handleSubmit = async () => {
    if (!selectedNovel) return;
    const previousRating = currentEntry?.rating ?? null;
    const saved = await saveEntry(selectedNovel.id, buildEntryPayload(entryForm));
    if ((saved.rating ?? null) !== previousRating) getNovelStats().then(setStats);
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!currentEntry || !selectedNovel) return;
    await deleteEntry(currentEntry.id, selectedNovel.id);
    if (currentEntry.rating != null) getNovelStats().then(setStats);
    setShowModal(false);
  };

  // Filter novels dynamically based on view and active status filters
  const filtered = novels.filter((n) => {
    if (!matchesSearch(n, search.trim())) return false;
    if (showReadingListOnly) {
      const entry = userEntries[n.id];
      if (!entry) return false;
      if (filter) {
        return entry.status.toLowerCase() === filter.toLowerCase();
      }
      return true;
    } else {
      if (genre && !n.genres?.includes(genre)) return false;
      if (filter) {
        return n.publication?.status?.toLowerCase() === filter.toLowerCase();
      }
      return true;
    }
  });

  const filterOptions = showReadingListOnly ? LIST_FILTERS : PUBLICATION_FILTERS;
  const listCount = Object.keys(userEntries).length;

  const emptyMessage = genre && !showReadingListOnly
    ? `No ${genre} novels match these filters.`
    : search.trim()
    ? `No novels match “${search.trim()}”`
    : showReadingListOnly
      ? filter
        ? `Nothing marked “${filter}” yet.`
        : "Your reading list is empty."
      : "No novel found";

  const SKELETON_ROWS = [
    { title: "70%", author: "38%" },
    { title: "52%", author: "28%" },
    { title: "78%", author: "42%" },
    { title: "61%", author: "32%" },
    { title: "74%", author: "36%" },
    { title: "48%", author: "26%" },
  ];

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h2 className="page-title"><Logo static /></h2>
          <div className={`skeleton ${isLoggedIn ? "skeleton-user-chip" : "skeleton-login-btn"}`} />
        </div>

        <div className="skeleton skeleton-filter-bar" />

        <div className="skeleton-table-container">
          <div className="skeleton-thead">
            <div className="skeleton-th-spacer" />
            <div className="skeleton skeleton-th" style={{ flex: 1 }} />
            <div className="skeleton skeleton-th" style={{ width: 64 }} />
            <div className="skeleton skeleton-th" style={{ width: 80 }} />
          </div>
          {SKELETON_ROWS.map((row, i) => (
            <div className="skeleton-row" key={i}>
              <div className="skeleton skeleton-cell-cover" />
              <div className="skeleton-cell-title">
                <div className="skeleton skeleton-cell-title-line" style={{ width: row.title }} />
                <div className="skeleton skeleton-cell-title-sub" style={{ width: row.author }} />
              </div>
              <div className="skeleton skeleton-cell-score" />
              <div className="skeleton skeleton-cell-score" />
              <div className="skeleton skeleton-cell-status" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="title-container">
          <h2 className="page-title">
            <Logo />
          </h2>
        </div>

        {isLoggedIn ? (
          <UserMenu />
        ) : (
          <button className="btn" onClick={() => navigate("/login")}>
            Log In
          </button>
        )}
      </div>

      {!showReadingListOnly && (
        <>
          <HomeHero
            isLoggedIn={isLoggedIn}
            search={search}
            onSearch={setSearch}
            onSubmit={scrollToList}
            novels={novels}
            userEntries={userEntries}
            stats={stats}
          />
          {isLoggedIn && (
            <ContinueReading novels={novels} userEntries={userEntries} onAdvance={advanceProgress} />
          )}
          <PopularNovels novels={novels} stats={stats} />
          <GenreChips novels={novels} active={genre} onSelect={pickGenre} />
        </>
      )}

      <section className="list-section" ref={listRef} aria-label="Novel list">
      {isLoggedIn ? (
        <nav className="view-tabs" aria-label="Choose list">
          <button
            className={`view-tab${showReadingListOnly ? "" : " active"}`}
            aria-current={showReadingListOnly ? undefined : "page"}
            onClick={() => switchView("/")}
          >
            All novels
          </button>
          <button
            className={`view-tab${showReadingListOnly ? " active" : ""}`}
            aria-current={showReadingListOnly ? "page" : undefined}
            onClick={() => switchView("/?view=readinglist")}
          >
            My list <span className="view-tab-count">{listCount}</span>
          </button>
        </nav>
      ) : (
        <h2 className="list-heading">All novels</h2>
      )}

      <div className="toolbar">
        <div className="filter-group">
          <span className="filter-label">{showReadingListOnly ? "My status" : "Publication"}</span>
          <div className="filter-bar">
            {filterOptions.map((f) => (
              <button
                key={f.value}
                className={`filter-btn ${filter === f.value ? "active" : ""}`}
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {genre && !showReadingListOnly && (
          <button type="button" className="active-genre" onClick={() => setGenre("")} aria-label={`Remove ${genre} filter`}>
            Genre: <strong>{genre}</strong> <span aria-hidden="true">✕</span>
          </button>
        )}

        {showReadingListOnly && (
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            className="search-input"
            placeholder="Search title or author"
            aria-label="Search novels by title or author"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        )}
      </div>

      <div className="table-container">
        <table className="novel-table">
          <thead>
            <tr>
              <th className="cover-th"><span className="visually-hidden">Cover</span></th>
              <th>Title</th>
              <th>Community Score</th>
              <th>Your Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  {emptyMessage}
                  {!showReadingListOnly && search.trim() && (
                    <div className="empty-suggest">
                      <span>Can't find it?</span>
                      <Link to={suggestNovelPath(search)} className="suggest-btn">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
                          <path d="M12 5v14" />
                          <path d="M5 12h14" />
                        </svg>
                        Suggest a novel
                      </Link>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((n) => {
                const userEntry = userEntries[n.id];
                const community = statsByNovel.get(n.id);
                const showProgress =
                  userEntry && userEntry.status !== "Plan To Read" && userEntry.progress > 0;
                const progressPct = n.chapterCount
                  ? Math.min(100, Math.round((userEntry?.progress / n.chapterCount) * 100))
                  : null;
                return (
                  <tr key={n.id}>
                    <td className="cover-td">
                      <Link to={`/novel/${n.id}`} tabIndex={-1} aria-hidden="true">
                        <NovelThumb title={n.title} src={n.coverImage} />
                      </Link>
                    </td>
                    <td className="title-td">
                      <Link to={`/novel/${n.id}`} className="novel-link">
                        {n.title}
                      </Link>
                      <div className="author">{n.author}</div>
                      {showProgress && (
                        <div className="progress">
                          {progressPct !== null && (
                            <div
                              className={`progress-track progress-track--${statusSlug(userEntry.status)}`}
                              role="progressbar"
                              aria-valuenow={progressPct}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${n.title} reading progress`}
                            >
                              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                            </div>
                          )}
                          <span className="progress-text">
                            {userEntry.progress.toLocaleString()}
                            {n.chapterCount ? ` / ${n.chapterCount.toLocaleString()}` : ""} c
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="community-score-cell">
                      {!statsReady ? (
                        <span className="score-empty" aria-label="Community score loading">…</span>
                      ) : community?.score != null ? (
                        <span className="score" title={`Community score from ${community.ratingCount} ratings`} aria-label={`Community score: ${community.score} out of 10, from ${community.ratingCount} ratings`}>
                          {community.score}
                          <span className="score-star" aria-hidden="true">★</span>
                        </span>
                      ) : (
                        <span className="score-empty" title="Community score appears after at least two ratings">New</span>
                      )}
                    </td>
                    <td className="your-score-cell">
                      {userEntry?.rating != null ? (
                        <span className="score" aria-label={`Your score: ${userEntry.rating} out of 10`}>
                          {userEntry.rating}
                          <span className="score-star" aria-hidden="true">★</span>
                        </span>
                      ) : (
                        <span className="score-empty" aria-label="No score">—</span>
                      )}
                    </td>
                    <td>
                      {userEntry?.status ? (
                        <button
                          className="status-chip"
                          onClick={() => openModal(n)}
                          aria-label={`${userEntry.status}. Edit ${n.title} in your list`}
                        >
                          <StatusIcon
                            status={userEntry.status}
                            progress={n.chapterCount ? userEntry.progress / n.chapterCount : null}
                          />
                          {userEntry.status}
                        </button>
                      ) : (
                        <button
                          className="add-btn"
                          onClick={() => openModal(n)}
                          aria-label={`Add ${n.title} to your list`}
                        >
                          <span aria-hidden="true">+</span> Add
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      </section>

      <AddNovelModal
        open={showModal}
        novel={selectedNovel}
        entry={currentEntry}
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
        isEditing={!!currentEntry}
      />
    </div>
  );
}

export { Homepage };
