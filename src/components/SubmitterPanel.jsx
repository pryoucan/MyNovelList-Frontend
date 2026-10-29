import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import RequestStatusBadge from "./RequestStatusBadge";
import { getSubmitterProfile } from "../services/requestService";
import { formatDate } from "../utils/novelFields";
import { useScrollLock } from "../hooks/useScrollLock";

// Side panel with a submitter's track record, opened from a request card.
// Shows contribution info only — no email or phone.
export default function SubmitterPanel({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const closeRef = useRef(null);
  useScrollLock();

  useEffect(() => {
    let current = true;
    getSubmitterProfile(userId)
      .then((data) => current && setProfile(data))
      .catch(() => current && setError("Couldn't load this profile."));
    return () => {
      current = false;
    };
  }, [userId]);

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  const s = profile?.submissions;

  return createPortal(
    <div className="sp-overlay" onClick={onClose}>
      <aside
        className="sp-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sp-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sp-head">
          <span className="sp-kicker">Submitter</span>
          <button ref={closeRef} type="button" className="sp-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {error ? (
          <p className="req-error" role="alert">{error}</p>
        ) : !profile ? (
          <div className="req-loading" aria-busy="true">Loading…</div>
        ) : (
          <>
            <div className="sp-identity">
              <span className="sp-avatar">
                {profile.user.avatar ? <img src={profile.user.avatar} alt="" /> : profile.user.username[0].toUpperCase()}
              </span>
              <div>
                <h2 className="sp-name" id="sp-title">
                  {profile.user.username}
                  {profile.user.role === "ADMIN" && <span className="sp-badge">Admin</span>}
                </h2>
                <p className="sp-since">Member since {formatDate(profile.user.createdAt)}</p>
              </div>
            </div>

            <section className="sp-section" aria-labelledby="sp-record">
              <h3 className="sp-section-title" id="sp-record">Track record</h3>
              <div className="sp-rate">
                {s.approvalRate != null ? (
                  <>
                    <span className="sp-rate-value">{s.approvalRate}%</span>
                    <span className="sp-rate-label">approval rate</span>
                    <span className="sp-rate-bar" aria-hidden="true">
                      <span style={{ width: `${s.approvalRate}%` }} />
                    </span>
                  </>
                ) : (
                  <>
                    <span className="sp-new">New contributor</span>
                    <span className="sp-rate-label">fewer than 3 reviewed requests</span>
                  </>
                )}
              </div>
              <dl className="sp-counts">
                <div><dt>Submitted</dt><dd>{s.total}</dd></div>
                <div className="is-approved"><dt>Approved</dt><dd>{s.approved}</dd></div>
                <div className="is-rejected"><dt>Rejected</dt><dd>{s.rejected}</dd></div>
                <div className="is-pending"><dt>Pending</dt><dd>{s.pending}</dd></div>
              </dl>
              <p className="sp-split">{s.newNovels} new {s.newNovels === 1 ? "novel" : "novels"} · {s.edits} {s.edits === 1 ? "edit" : "edits"}</p>
            </section>

            <section className="sp-section" aria-labelledby="sp-reading">
              <h3 className="sp-section-title" id="sp-reading">Reading</h3>
              <p className="sp-reading">
                <strong>{profile.reading.novels}</strong> {profile.reading.novels === 1 ? "novel" : "novels"} on their list ·{" "}
                <strong>{profile.reading.chapters.toLocaleString()}</strong> chapters read
              </p>
            </section>

            <section className="sp-section" aria-labelledby="sp-recent">
              <h3 className="sp-section-title" id="sp-recent">Recent submissions</h3>
              {profile.recent.length === 0 ? (
                <p className="sp-muted">Nothing yet.</p>
              ) : (
                <ul className="sp-recent">
                  {profile.recent.map((r) => (
                    <li key={`${r.type}-${r.id}`}>
                      <span className="sp-recent-text">
                        <span className="req-kind">{r.type === "new" ? "New novel" : "Edit"}</span>
                        {r.novelId ? (
                          <Link to={`/novel/${r.novelId}`} className="sp-recent-title" onClick={onClose}>{r.title}</Link>
                        ) : (
                          <span className="sp-recent-title">{r.title}</span>
                        )}
                        <span className="sp-muted">{formatDate(r.createdAt)}</span>
                      </span>
                      <RequestStatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </aside>
    </div>,
    document.body
  );
}
