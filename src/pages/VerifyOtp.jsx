import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "../design/Auth.css";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem("email");

  // Guard: if no email in session on mount, redirect back to forgot-password.
  // IMPORTANT: must use empty deps [] and read sessionStorage inside the effect.
  // If we read `email` from render scope and put it in deps, React re-runs this
  // effect when VerifyOtp re-renders after sessionStorage.removeItem("email")
  // fires (during OTP submit), causing a redirect to /forgot-password that
  // overwrites the intended navigate("/reset-password").
  useEffect(() => {
    if (!sessionStorage.getItem("email")) {
      navigate("/forgot-password");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);


  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/verify-otp`,
        { otp, email }
      );

      localStorage.setItem("resetToken", response.data?.resetToken);
      // BUG 5 FIX: sessionStorage.clear() ignores arguments and clears everything.
      // Use removeItem to only remove the email key.
      sessionStorage.removeItem("email");
      navigate("/reset-password");
    } 
    catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
    finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setIsResending(true);

    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
    } catch {
      setError("Failed to resend OTP");
    } finally {
      // BUG 20 FIX: Reset resending state after the actual API call completes,
      // not on an arbitrary 5s timer that was disconnected from the real response.
      setIsResending(false);
    }
  };
  return (
    <main className="login-page">
      <div className="auth-container">
        <h1 className="auth-title-reset">Reset your password</h1>
        <p className="auth-title-reset-para">Enter the 6-digit OTP sent to your registered email</p>

        <form className="auth-form" onSubmit={handleVerifyOtp}>
          <input
            type="text"
            maxLength="6"
            placeholder="Enter your 6 digit OTP"
            className="auth-input"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <p className="auth-re-otp">
            <button type="button" className="auth-re-otp-btn" disabled={isResending} onClick={handleResendOtp}>
             {isResending ? "Sending..." : "Resend OTP?"}
            </button>
          </p>

          {error && <p className="auth-error">{error}</p>}

          <div className="auth-submit-wrap">
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Verifying..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
