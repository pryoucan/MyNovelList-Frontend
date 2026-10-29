import { useEffect } from "react";

// Stops the page behind a modal from scrolling. `overflow: hidden` alone is
// ignored by iOS Safari, so <body> is pinned with `position: fixed` and the
// scroll position is restored afterwards. Locks are counted, so a modal opened
// over another one (e.g. a confirm over "Add to list") keeps the page locked
// until the last one closes.
let locks = 0;
let savedY = 0;
let savedStyle = null;

const lock = () => {
  if (locks++ > 0) return;
  savedY = window.scrollY;
  const { style } = document.body;
  savedStyle = {
    position: style.position,
    top: style.top,
    left: style.left,
    right: style.right,
    overflow: style.overflow,
    paddingRight: style.paddingRight,
  };
  // Keep the layout from shifting when a desktop scrollbar disappears.
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  Object.assign(style, {
    position: "fixed",
    top: `-${savedY}px`,
    left: "0",
    right: "0",
    overflow: "hidden",
    ...(scrollbar > 0 && { paddingRight: `${scrollbar}px` }),
  });
};

const unlock = () => {
  if (--locks > 0) return;
  Object.assign(document.body.style, savedStyle);
  window.scrollTo({ top: savedY, behavior: "instant" });
};

// While locked, window.scrollY reads 0 (the page is pinned), so it isn't a real position.
export const isScrollLocked = () => locks > 0;

export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
