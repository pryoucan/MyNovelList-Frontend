import { formatField } from "../utils/novelFields";
import ViewableImage from "./ViewableImage";

// Before → after table for an edit request. `stale` rows changed on the
// novel after the request was made; the reviewer sees the current value.
export default function RequestChanges({ changes, cover, currentCover, title }) {
  const compare = [
    { src: currentCover, label: "Current" },
    { src: cover?.to, label: "Proposed" },
  ];
  return (
    <div className="req-diff">
      <div className="req-diff-head" aria-hidden="true">
        <span>Field</span>
        <span>Before</span>
        <span>Proposed</span>
      </div>
      {cover && (
        <div className="req-diff-row">
          <span className="req-diff-field">Cover</span>
          <span className="req-diff-from">
            {currentCover ? (
              <ViewableImage images={compare} title={title} label="Compare current and proposed covers">
                <img src={currentCover} alt="Current cover" className="req-diff-cover" />
              </ViewableImage>
            ) : (
              "—"
            )}
          </span>
          <span className="req-diff-to">
            <ViewableImage images={compare} title={title} label="Compare current and proposed covers">
              <img src={cover.to} alt="Proposed cover" className="req-diff-cover" />
            </ViewableImage>
          </span>
        </div>
      )}
      {changes.map((c) => (
        <div key={c.field} className={`req-diff-row${c.stale ? " is-stale" : ""}`}>
          <span className="req-diff-field">{c.label}</span>
          <span className="req-diff-from">{formatField(c.field, c.from)}</span>
          <span className="req-diff-to">{formatField(c.field, c.to)}</span>
          {c.stale && (
            <span className="req-diff-stale">
              Changed since this was sent — now <strong>{formatField(c.field, c.current)}</strong>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
