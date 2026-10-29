import { useState } from "react";

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.6 5.1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.6" />
    <path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.9 9.9 0 0 0 5.4-1.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="M2 2l20 20" />
  </svg>
);

// Password field with a show/hide toggle. `status` ("valid" | "invalid") tints the border.
export default function PasswordInput({ status, className = "", ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const statusClass = status ? ` auth-input--${status}` : "";

  return (
    <div className="password-field">
      <input
        {...inputProps}
        type={visible ? "text" : "password"}
        className={`auth-input password-field__input${statusClass} ${className}`.trim()}
      />
      <button
        type="button"
        className="password-field__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        disabled={inputProps.disabled}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
