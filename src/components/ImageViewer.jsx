import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "../hooks/useScrollLock";
import "../design/ImageViewer.css";

// Full-size image overlay. `images` is [{ src, label? }]; two images are shown
// side by side (e.g. current vs proposed cover). Esc, ✕ or a click on the
// backdrop closes it; focus moves in and back to whatever opened it.
export default function ImageViewer({ images, title, onClose }) {
  const closeRef = useRef(null);

  useScrollLock();

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      // Keep Tab inside the dialog (the close button is its only control).
      if (e.key === "Tab") {
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div className="iv-overlay" role="dialog" aria-modal="true" aria-label={title ? `${title} cover` : "Image"} onClick={onClose}>
      <button ref={closeRef} type="button" className="iv-close" onClick={onClose} aria-label="Close image">
        ×
      </button>
      <div className={`iv-images${images.length > 1 ? " iv-images--compare" : ""}`} onClick={(e) => e.stopPropagation()}>
        {images.map((image) => (
          <figure key={image.src} className="iv-figure">
            <img src={image.src} alt={image.label ? `${image.label} cover` : title ? `${title} cover` : ""} className="iv-img" />
            {(image.label || (images.length === 1 && title)) && (
              <figcaption className="iv-caption">{image.label ?? title}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>,
    document.body
  );
}
