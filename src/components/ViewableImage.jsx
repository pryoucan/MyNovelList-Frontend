import { useState } from "react";
import ImageViewer from "./ImageViewer";

// Wraps a thumbnail so clicking it opens the full image. Pass `images` to show
// more than one (a comparison); otherwise `src` is shown alone. Renders the
// children unchanged when there's no real image (e.g. a letter placeholder).
export default function ViewableImage({ src, images, title, label, className = "", children }) {
  const [open, setOpen] = useState(false);
  const list = images?.filter((i) => i.src) ?? (src ? [{ src }] : []);
  if (list.length === 0) return children;

  return (
    <>
      <button
        type="button"
        className={`iv-trigger ${className}`.trim()}
        onClick={() => setOpen(true)}
        aria-label={label ?? (title ? `View ${title} cover` : "View image")}
      >
        {children}
        <span className="iv-zoom" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M20 20l-4.2-4.2M11 8.5v5M8.5 11h5" />
          </svg>
        </span>
      </button>
      {open && <ImageViewer images={list} title={title} onClose={() => setOpen(false)} />}
    </>
  );
}
