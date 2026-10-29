import { useState } from "react";
import { Link } from "react-router-dom";
import NovelThumb from "../NovelThumb";
import StatusIcon from "../StatusIcon";

const ORDER = { Reading: 0, "On Hold": 1 };
const slug = (s) => s.toLowerCase().split(" ").join("-");

// Reading / On Hold entries, most recently updated first, with a +1 chapter shortcut.
export default function ContinueReading({ novels, userEntries, onAdvance }) {
  const [busy, setBusy] = useState(null);
  const [failed, setFailed] = useState(null);

  const items = novels
    .map((novel) => ({ novel, entry: userEntries[novel.id] }))
    .filter(({ entry }) => entry && entry.status in ORDER)
    .sort(
      (a, b) =>
        ORDER[a.entry.status] - ORDER[b.entry.status] ||
        new Date(b.entry.updatedAt) - new Date(a.entry.updatedAt)
    )
    .slice(0, 6);

  if (items.length === 0) return null;

  const advance = async (novel, entry) => {
    setBusy(novel.id);
    setFailed(null);
    try {
      await onAdvance(novel.id, entry.progress + 1);
    } catch {
      setFailed(novel.id);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="home-section" aria-labelledby="continue-title">
      <div className="home-section-head">
        <h2 className="home-section-title" id="continue-title">Continue reading</h2>
      </div>
      <ul className="continue-grid">
        {items.map(({ novel, entry }) => {
          const total = novel.chapterCount || null;
          const done = total !== null && entry.progress >= total;
          const pct = total ? Math.min(100, (entry.progress / total) * 100) : null;
          return (
            <li key={novel.id} className="continue-card">
              <Link to={`/novel/${novel.id}`} className="continue-thumb" tabIndex={-1} aria-hidden="true">
                <NovelThumb title={novel.title} src={novel.coverImage} />
              </Link>
              <div className="continue-body">
                <Link to={`/novel/${novel.id}`} className="continue-title">{novel.title}</Link>
                <div className="continue-status">
                  <StatusIcon status={entry.status} progress={total ? entry.progress / total : null} size={14} />
                  {entry.status}
                </div>
                {pct !== null && (
                  <div className={`progress-track progress-track--${slug(entry.status)}`} aria-hidden="true">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                )}
                <div className="continue-foot">
                  <span className="progress-text">
                    {entry.progress.toLocaleString()}
                    {total ? ` / ${total.toLocaleString()}` : ""} c
                  </span>
                  {failed === novel.id ? (
                    <span className="continue-error" role="alert">Couldn't save</span>
                  ) : (
                    <button
                      type="button"
                      className="continue-plus"
                      onClick={() => advance(novel, entry)}
                      disabled={busy === novel.id || done}
                      aria-label={`Mark chapter ${entry.progress + 1} of ${novel.title} as read`}
                    >
                      {busy === novel.id ? "…" : "+1 ch"}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
