import { useState } from "react";
import "../design/StarRating.css";

const STAR_PATH =
  "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

const Star = ({ fill }) => (
  <span className="star" aria-hidden="true">
    <svg viewBox="0 0 24 24" className="star-base">
      <path d={STAR_PATH} />
    </svg>
    <span className="star-fill" style={{ width: `${fill * 100}%` }}>
      <svg viewBox="0 0 24 24">
        <path d={STAR_PATH} />
      </svg>
    </span>
  </span>
);

// Ten stars, half-star precision: each star is one point, so 8½ stars = 8.5.
// Hover previews, click sets (left half = .5), arrow keys step by 0.5.
// With readOnly, it just displays the score (size="sm" for a compact row).
// onHoverChange(score | null) lets the parent show the score under the pointer.
export default function StarRating({ value, onChange, onHoverChange, max = 10, min = 1, labelledBy, readOnly = false, size }) {
  const [hover, setHoverState] = useState(null);
  const setHover = (next) => {
    setHoverState(next);
    onHoverChange?.(next);
  };
  const shown = hover ?? value ?? 0;

  if (readOnly) {
    return (
      <span
        className={`star-rating star-rating--readonly${size === "sm" ? " star-rating--sm" : ""}`}
        role="img"
        aria-label={value != null ? `${value} out of ${max}` : "Not rated"}
      >
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className="star-hit">
            <Star fill={Math.min(1, Math.max(0, (value ?? 0) - i))} />
          </span>
        ))}
      </span>
    );
  }

  const valueAt = (e, star) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const half = e.clientX - left < width / 2;
    return Math.max(min, half ? star - 0.5 : star);
  };

  const step = (delta) => {
    const next = (value ?? 0) + delta;
    onChange(next < min ? (delta < 0 ? null : min) : Math.min(max, next));
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      step(0.5);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      step(-0.5);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(min);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(max);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onChange(null);
    }
  };

  return (
    <div
      className={`star-rating${size === "sm" ? " star-rating--sm" : ""}`}
      role="slider"
      tabIndex={0}
      aria-labelledby={labelledBy}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value != null ? `${value} out of ${max}` : "Not rated"}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const fill = Math.min(1, Math.max(0, shown - i));
        return (
          <span
            key={star}
            className="star-hit"
            onMouseMove={(e) => setHover(valueAt(e, star))}
            onClick={(e) => {
              const next = valueAt(e, star);
              // Clicking the current score again clears it.
              onChange(next === value ? null : next);
            }}
          >
            <Star fill={fill} />
          </span>
        );
      })}
      {hover !== null && <span className="star-preview" aria-hidden="true">{hover}</span>}
    </div>
  );
}
