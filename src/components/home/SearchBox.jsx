import { useDeferredValue, useId, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NovelThumb from "../NovelThumb";
import StatusIcon from "../StatusIcon";
import { suggestNovelPath } from "../../utils/suggestLink";

const MAX_SUGGESTIONS = 6;

// Lower is better. Title prefix > a word in the title > anywhere in the title
// > original title > author. Returns null when nothing matches.
const rankMatch = (novel, q) => {
  const title = novel.title.toLowerCase();
  if (title.startsWith(q)) return { rank: 0, field: "title" };
  if (title.split(/\s+/).some((word) => word.startsWith(q))) return { rank: 1, field: "title" };
  if (title.includes(q)) return { rank: 2, field: "title" };
  if (novel.originalTitle?.toLowerCase().includes(q)) return { rank: 3, field: "originalTitle" };
  if (novel.author?.toLowerCase().includes(q)) return { rank: 4, field: "author" };
  return null;
};

// Bold the matched part of `text`.
const Highlight = ({ text, query }) => {
  const i = text.toLowerCase().indexOf(query);
  if (!query || i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <strong>{text.slice(i, i + query.length)}</strong>
      {text.slice(i + query.length)}
    </>
  );
};

// Search with instant suggestions. All novels are already in memory, so
// matching runs locally — no debounce needed. useDeferredValue keeps typing
// smooth if the catalogue grows. (Past a few thousand novels, switch to the
// server's ?q= search with a ~250ms debounce and cancel stale requests.)
export default function SearchBox({ novels, userEntries, stats, value, onChange, onSubmit, placeholder }) {
  const navigate = useNavigate();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef(null);

  const deferred = useDeferredValue(value);
  const query = deferred.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!query) {
      // Empty box: most-read novels.
      const byId = new Map(novels.map((n) => [n.id, n]));
      return stats
        .filter((s) => s.readers > 0 && byId.has(s.novelId))
        .sort((a, b) => b.readers - a.readers || (b.score ?? 0) - (a.score ?? 0))
        .slice(0, MAX_SUGGESTIONS)
        .map((s) => ({ novel: byId.get(s.novelId), field: "title" }));
    }
    return novels
      .map((novel) => ({ novel, ...rankMatch(novel, query) }))
      .filter((m) => m.rank !== undefined)
      .sort((a, b) => a.rank - b.rank || a.novel.title.localeCompare(b.novel.title))
      .slice(0, MAX_SUGGESTIONS);
  }, [novels, stats, query]);

  const showList = open && (suggestions.length > 0 || query);
  const optionId = (i) => `${listId}-option-${i}`;

  const go = (novel) => {
    setOpen(false);
    navigate(`/novel/${novel.id}`);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (suggestions.length ? (i + 1) % suggestions.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (suggestions.length ? (i - 1 + suggestions.length) % suggestions.length : -1));
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActive(-1);
      }
    } else if (e.key === "Enter" && open && active >= 0 && suggestions[active]) {
      e.preventDefault();
      go(suggestions[active].novel);
    }
  };

  return (
    <form
      className="home-search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        setOpen(false);
        onSubmit();
      }}
    >
      <svg className="home-search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        type="search"
        className="home-search-input"
        placeholder={placeholder}
        aria-label="Search novels by title or author"
        role="combobox"
        aria-expanded={!!showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => {
          clearTimeout(blurTimer.current);
          setOpen(true);
        }}
        // Delay so a click on a suggestion lands before the list closes.
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
      />
      <button type="submit" className="home-search-btn">Search</button>

      {showList && (
        <div className="search-suggest" id={listId} role="listbox" aria-label="Suggestions">
          <div className="search-suggest-head" aria-hidden="true">
            {query ? "Novels" : "Popular right now"}
          </div>
          {suggestions.length === 0 ? (
            <div className="search-suggest-empty">
              <span>No novels match “{deferred.trim()}”</span>
              <Link
                to={suggestNovelPath(deferred)}
                className="suggest-btn"
                // Keep focus in the input so the list doesn't close before the click.
                onMouseDown={(e) => e.preventDefault()}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                Suggest it
              </Link>
            </div>
          ) : (
            suggestions.map(({ novel, field }, i) => {
              const entry = userEntries[novel.id];
              return (
                <div
                  key={novel.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  className={`search-suggest-item${i === active ? " active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(novel)}
                >
                  <NovelThumb title={novel.title} src={novel.coverImage} />
                  <span className="search-suggest-text">
                    <span className="search-suggest-title">
                      <Highlight text={novel.title} query={field === "title" ? query : ""} />
                    </span>
                    <span className="search-suggest-sub">
                      {field === "originalTitle" ? (
                        <Highlight text={novel.originalTitle} query={query} />
                      ) : (
                        <Highlight text={novel.author} query={field === "author" ? query : ""} />
                      )}
                    </span>
                  </span>
                  {entry && (
                    <span className="search-suggest-status">
                      <StatusIcon status={entry.status} size={14} />
                      {entry.status}
                    </span>
                  )}
                </div>
              );
            })
          )}
          {query && suggestions.length > 0 && (
            <div className="search-suggest-foot" aria-hidden="true">
              <kbd>↑</kbd><kbd>↓</kbd> to choose · <kbd>Enter</kbd> to open
            </div>
          )}
        </div>
      )}
    </form>
  );
}
