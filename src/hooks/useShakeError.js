import { useRef, useState } from "react";

// Shake-then-show error pattern: fail(msg) starts the shake, and the message
// appears once the animation ends. Spread `shakeProps` onto the element that shakes.
export default function useShakeError() {
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const pending = useRef("");

  const fail = (message) => {
    pending.current = message;
    setError("");
    setShaking(true);
  };

  const clear = () => setError("");

  const onAnimationEnd = (e) => {
    // Ignore animations bubbling up from children.
    if (e.target !== e.currentTarget) return;
    setShaking(false);
    setError(pending.current);
  };

  return {
    error,
    shaking,
    fail,
    clear,
    shakeProps: { onAnimationEnd, "data-shaking": shaking || undefined },
  };
}
