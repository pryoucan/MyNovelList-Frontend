import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import NovelForm from "../components/NovelForm";
import { getAllNovels } from "../services/novelService";
import { fetchImportCover } from "../services/requestService";
import { useAddNovel } from "../components/ReplaceNovelPrompt";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { prepareCover } from "../utils/coverImage";
import { popularValues } from "../utils/novelFields";
import { NU_SEARCH_URL, bookmarkletHref, readImportHash, mapNovelUpdates } from "../utils/novelUpdatesImport";
import "../design/Homepage.css";
import "../design/status.css";
import "../design/Requests.css";
import BackArrow from "../components/BackArrow";

const STORAGE_KEY = "mnl:nuImport";

// The bookmarklet payload arrives in the URL hash. It's moved to
// sessionStorage so a reload keeps it but the address bar stays clean.
const takePayload = () => {
  const fromHash = readImportHash(window.location.hash);
  if (fromHash) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromHash));
    } catch {
      // storage unavailable: the payload still works for this page view
    }
    window.history.replaceState(null, "", window.location.pathname);
    return fromHash;
  }
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) ?? null;
  } catch {
    return null;
  }
};

function BookmarkletLink() {
  const ref = useRef(null);
  // React blocks javascript: URLs in JSX, so the href is set directly.
  useEffect(() => {
    ref.current?.setAttribute("href", bookmarkletHref(window.location.origin));
  }, []);
  return (
    <a ref={ref} className="req-btn imp-bookmarklet" onClick={(e) => e.preventDefault()} draggable="true">
      → MyNovelList
    </a>
  );
}

function Setup() {
  const [query, setQuery] = useState("");
  return (
    <div className="req-card">
      <h1 className="req-title">Import from NovelUpdates</h1>
      <p className="req-intro">
        Fill in a novel from its NovelUpdates page, check the details, and save it.
      </p>
      <ol className="imp-steps">
        <li>
          <strong>One-time setup:</strong> drag this button to your bookmarks bar.
          <div className="imp-step-body">
            <BookmarkletLink />
            <span className="imp-hint">Bookmarks bar hidden? Press Ctrl/⌘ + Shift + B.</span>
          </div>
        </li>
        <li>
          <strong>Find the novel</strong> on NovelUpdates and open its series page.
          <form
            className="imp-step-body"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) window.open(NU_SEARCH_URL(query.trim()), "_blank", "noopener");
            }}
          >
            <input
              className="nf-input imp-search"
              placeholder="e.g. Against the Gods"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Novel name"
            />
            <button type="submit" className="req-btn req-btn--ghost" disabled={!query.trim()}>
              Search NovelUpdates
            </button>
          </form>
        </li>
        <li>
          <strong>Click the “→ MyNovelList” bookmark</strong> on that page. This page opens with the details filled in.
        </li>
      </ol>
    </div>
  );
}

// /admin/import — admin-only. Without a payload it explains the bookmarklet;
// with one, it shows the mapped novel in the regular form.
export default function ImportNovel() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const loggedIn = !!localStorage.getItem("displayUsername");
  const [raw, setRaw] = useState(takePayload);
  const [suggestions, setSuggestions] = useState({ genres: [], tags: [] });
  const [cover, setCover] = useState({ loading: !!raw?.cover, dataUrl: null, error: "" });

  const imported = useMemo(() => (raw ? mapNovelUpdates(raw) : null), [raw]);

  useEffect(() => {
    if (!loggedIn) navigate("/login");
  }, [loggedIn, navigate]);

  useEffect(() => {
    getAllNovels().then((all) => setSuggestions({ genres: popularValues(all, "genres"), tags: popularValues(all, "tags") }));
  }, []);

  useEffect(() => {
    if (!raw?.cover) return;
    let current = true;
    fetchImportCover(raw.cover)
      .then((blob) => prepareCover(blob))
      .then((dataUrl) => current && setCover({ loading: false, dataUrl, error: "" }))
      .catch(() => current && setCover({ loading: false, dataUrl: null, error: "Couldn't download the cover — add it manually." }));
    return () => {
      current = false;
    };
  }, [raw]);

  const startOver = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setRaw(null);
  };

  const { submit, prompt } = useAddNovel((res) => {
    startOver();
    navigate(`/novel/${res.novelId}`);
  });

  if (user && user.role !== "ADMIN") {
    return (
      <div className="page-container">
        <Header />
        <div className="req-card req-empty"><p>This page is for admins.</p><Link to="/">Back to list</Link></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      <Link to="/admin" className="req-back">
        <BackArrow /> Back to dashboard
      </Link>

      {!imported ? (
        <Setup />
      ) : (
        <div className="req-card">
          <div className="req-page-head">
            <div>
              <h1 className="req-title">Review import</h1>
              <p className="req-intro">
                From{" "}
                <a href={raw.url} target="_blank" rel="noreferrer">NovelUpdates</a>. Check the details, then save —
                the novel is added straight away.
              </p>
            </div>
            <button type="button" className="req-btn req-btn--ghost" onClick={startOver}>Start over</button>
          </div>

          {(imported.notes.length > 0 || cover.error) && (
            <div className="req-warning imp-notes" role="note">
              <strong>Needs a look</strong>
              <ul>
                {imported.notes.map((n) => <li key={n.field + n.message}>{n.message}</li>)}
                {cover.error && <li>{cover.error}</li>}
              </ul>
            </div>
          )}

          {cover.loading ? (
            <div className="req-loading" aria-busy="true">Downloading cover…</div>
          ) : (
            <NovelForm
              key={raw.url}
              mode="new"
              novel={imported.novel}
              initialCover={cover.dataUrl}
              genreSuggestions={suggestions.genres}
              tagSuggestions={suggestions.tags}
              submitLabel="Add novel"
              onSubmit={submit}
              onCancel={startOver}
            />
          )}
        </div>
      )}
      {prompt}
    </div>
  );
}
