import { useState } from "react";
import "../design/NovelThumb.css";

// Soft background/text pairs for the letter placeholder.
const TINTS = [
  ["#eff6ff", "#1d4ed8"],
  ["#f0fdf4", "#15803d"],
  ["#fffbeb", "#b45309"],
  ["#fdf2f8", "#be185d"],
  ["#f5f3ff", "#6d28d9"],
  ["#ecfeff", "#0e7490"],
  ["#fef2f2", "#b91c1c"],
  ["#f5f5f4", "#57534e"],
];

// Same title always gets the same tint.
const tintFor = (title) => {
  let hash = 0;
  for (const ch of title) hash = (hash * 31 + ch.codePointAt(0)) >>> 0;
  return TINTS[hash % TINTS.length];
};

// Small book-shaped cover; falls back to the title's first letter when there's
// no image or it fails to load.
export default function NovelThumb({ title, src, size }) {
  const sizeClass = size === "lg" ? " novel-thumb--lg" : "";
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        className={`novel-thumb${sizeClass}`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  const [bg, fg] = tintFor(title);
  return (
    <span className={`novel-thumb novel-thumb--placeholder${sizeClass}`} style={{ background: bg, color: fg }} aria-hidden="true">
      {title.trim().charAt(0).toUpperCase()}
    </span>
  );
}
