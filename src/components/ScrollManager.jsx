import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { isScrollLocked } from "../hooks/useScrollLock";

const RESTORE_TIMEOUT_MS = 5000;

// Scroll position per history entry (location.key).
const positions = new Map();

// Scrolls to `y`, retrying while the page is still too short (e.g. the list is
// loading). Gives up after a timeout or as soon as the user scrolls themselves.
const restoreTo = (y) => {
  const start = performance.now();
  let frame = 0;
  const stop = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
  };
  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  const tick = () => {
    window.scrollTo({ top: y, behavior: "instant" });
    if (Math.abs(window.scrollY - y) > 1 && performance.now() - start < RESTORE_TIMEOUT_MS) {
      frame = requestAnimationFrame(tick);
    } else {
      stop();
    }
  };
  tick();
  return stop;
};

// React Router keeps the scroll position between pages, so a novel opened from
// far down the list opened scrolled down too. New pages now start at the top,
// and Back/Forward return to where that page was left.
export default function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const lastPath = useRef(location.pathname);
  // The entry scroll events belong to. Switched during the navigation itself, so
  // the scroll caused by jumping the new page to the top is never saved as the
  // old page's position.
  const currentKey = useRef(location.key);

  // One listener for the app's lifetime: remember where the current entry is scrolled to.
  useEffect(() => {
    window.history.scrollRestoration = "manual";
    const save = () => {
      if (!isScrollLocked()) positions.set(currentKey.current, window.scrollY);
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, []);

  useLayoutEffect(() => {
    // The old page's position was saved by the listener while it was scrolled;
    // reading scrollY here would be too late (it's already clamped to the new page).
    currentKey.current = location.key;
    const samePage = lastPath.current === location.pathname;
    lastPath.current = location.pathname;
    if (navigationType === "POP") {
      const y = positions.get(location.key);
      if (y != null) return restoreTo(y);
    }
    // Same page with a new query (e.g. the All novels / My list tabs): that page
    // handles its own scrolling.
    if (!samePage) window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.key, location.pathname, navigationType]);

  return null;
}
