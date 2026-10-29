import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import PasswordInput from "../components/PasswordInput";
import RuleList from "../components/RuleList";
import { ruleState } from "../utils/ruleState";
import "../design/Auth.css";

// Must match the backend's limits in resetPassword.
const MIN_LENGTH = 8;
const MAX_LENGTH = 20;

export default function ResetPassword() {
  const resetToken = localStorage.getItem("resetToken");
  const navigate = useNavigate();
  const email = useLocation().state?.email;
  const [password, setPassword] = useState("");
  const [verifypassword, setverifypassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  // Password the server rejected as identical to the current one.
  const [rejectedSame, setRejectedSame] = useState(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  // Guard: if no resetToken on mount, redirect to login.
  // Same pattern as VerifyOtp — must use empty deps to prevent re-firing
  // after localStorage.removeItem("resetToken") is called on success.
  useEffect(() => {
    if (!localStorage.getItem("resetToken")) {
      navigate("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lengthOk = password.length >= MIN_LENGTH && password.length <= MAX_LENGTH;
  const isSameAsOld = rejectedSame !== null && password === rejectedSame;
  const passwordsMatch = verifypassword !== "" && password === verifypassword;
  const canSubmit = lengthOk && !isSameAsOld && passwordsMatch && !loading && !updated;

  const rules = [
    { label: `${MIN_LENGTH}–${MAX_LENGTH} characters`, state: ruleState(password, lengthOk) },
    ...(rejectedSame !== null
      ? [{ label: "Different from your current password", state: ruleState(password, !isSameAsOld) }]
      : []),
  ];

  const confirmStatus = verifypassword === "" ? undefined : passwordsMatch ? "valid" : "invalid";

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);

    try {
      await axios.post(
        `${API_URL}/api/auth/reset-password`,
        { password },
        {
          headers: {
            Authorization: `Bearer ${resetToken}`,
          },
        }
      );

      // BUG 6 FIX: Remove resetToken from localStorage after successful reset
      localStorage.removeItem("resetToken");
      setUpdated(true);
      setTimeout(
        () => navigate("/login", { state: { email, notice: "Password updated. Sign in with your new password." } }),
        900
      );
    } catch (err) {
      if (err.response?.data?.code === "SAME_PASSWORD") {
        setRejectedSame(password);
      } else {
        setError(err.response?.data?.message || "Reset failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="auth-container">
        <h1 className="auth-title">Set new password</h1>

        <form className="auth-form" onSubmit={handleResetPassword}>
          <PasswordInput
            placeholder="Enter a new password"
            autoComplete="new-password"
            maxLength={MAX_LENGTH}
            required
            autoFocus
            disabled={updated}
            status={updated ? "valid" : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-rules"
          />

          <RuleList id="password-rules" rules={rules} />

          <PasswordInput
            placeholder="Enter your new password again"
            autoComplete="new-password"
            maxLength={MAX_LENGTH}
            required
            disabled={updated}
            status={updated ? "valid" : confirmStatus}
            value={verifypassword}
            onChange={(e) => setverifypassword(e.target.value)}
            aria-describedby="password-match"
          />

          <p
            id="password-match"
            className={`password-match${updated ? " password-match--ok" : confirmStatus === "invalid" ? " password-match--fail" : confirmStatus === "valid" ? " password-match--ok" : ""}`}
            role="status"
          >
            {updated
              ? "Password updated"
              : confirmStatus === "invalid"
                ? "Passwords don't match"
                : confirmStatus === "valid"
                  ? "Passwords match"
                  : ""}
          </p>

          {error && <p className="auth-error auth-error--center" role="alert">{error}</p>}

          <div className="auth-submit-wrap">
            {/* BUG 18 FIX: Disable submit button while loading to prevent double-submit */}
            <button type="submit" className="auth-submit" disabled={!canSubmit}>
              {updated ? "Updated" : loading ? "Saving..." : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
