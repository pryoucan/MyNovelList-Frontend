import { useImperativeHandle, useRef } from "react";

// Row of single-digit boxes. `value` is the code as a string of digits.
// onComplete fires once every box is filled by typing or pasting.
// While `shaking` is true the row plays a shake animation, then onShakeEnd fires.
// `success` turns the boxes green with a staggered pop.
// The `ref` exposes focus() to put the cursor back in the first box.
export default function OtpInput({
  length = 4,
  value,
  onChange,
  onComplete,
  disabled = false,
  invalid = false,
  shaking = false,
  onShakeEnd,
  success = false,
  ref,
}) {
  const inputsRef = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const focusBox = (index) => {
    const box = inputsRef.current[Math.max(0, Math.min(index, length - 1))];
    box?.focus();
    box?.select();
  };

  useImperativeHandle(ref, () => ({ focus: () => focusBox(0) }));

  const update = (next) => {
    const code = next.join("");
    onChange(code);
    if (next.every((d) => d !== "")) {
      onComplete?.(code);
    }
  };

  const setDigitsFrom = (index, text) => {
    const incoming = text.replace(/\D/g, "");
    if (!incoming) return;

    const next = [...digits];
    for (let i = 0; i < incoming.length && index + i < length; i++) {
      next[index + i] = incoming[i];
    }
    focusBox(index + incoming.length);
    update(next);
  };

  const handleChange = (index, e) => {
    const text = e.target.value;
    if (text === "") {
      const next = [...digits];
      next[index] = "";
      onChange(next.join(""));
      return;
    }
    // Typing into a filled box: keep only the newly typed digit.
    setDigitsFrom(index, text.length > 1 ? text.slice(-1) : text);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      onChange(next.join(""));
      focusBox(index - 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusBox(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (index, e) => {
    e.preventDefault();
    setDigitsFrom(index, e.clipboardData.getData("text"));
  };

  const classes = [
    "otp-boxes",
    invalid && "otp-boxes--invalid",
    shaking && "otp-boxes--shake",
    success && "otp-boxes--success",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      role="group"
      aria-label={`${length}-digit code`}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) onShakeEnd?.();
      }}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          className="otp-box"
          style={{ "--i": index }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={length}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid || undefined}
          value={digit}
          disabled={disabled}
          autoFocus={index === 0}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
