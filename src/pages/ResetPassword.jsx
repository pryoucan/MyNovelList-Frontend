import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "../design/Auth.css";

export default function ResetPassword() {
  const resetToken = localStorage.getItem("resetToken");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [verifypassword, setverifypassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    // BUG 19 FIX: Only set loading after the early-return validation passes,
    // so we never leave loading=true stuck when passwords don't match.
    if (password !== verifypassword) {
      setError("Passwords do not match!");
      return;
    }

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
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="auth-container">
        <h1 className="auth-title">Set new password</h1>

        <form className="auth-form" onSubmit={handleResetPassword}>
          <input
            type="password"
            placeholder="Enter a new password"
            className="auth-input"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter your new password again"
            className="auth-input"
            required
            value={verifypassword}
            onChange={(e) => setverifypassword(e.target.value)}
          />

          {error && <p className="auth-error">{error}</p>}

          <div className="auth-submit-wrap">
            {/* BUG 18 FIX: Disable submit button while loading to prevent double-submit */}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
