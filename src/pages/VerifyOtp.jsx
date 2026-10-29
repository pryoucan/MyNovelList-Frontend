import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import OtpInput from "../components/OtpInput";
import "../design/Auth.css";

const OTP_LENGTH = 4;

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
  // A wrong code shakes the boxes first; the error shows once the shake ends.
  const [shaking, setShaking] = useState(false);
  const [verified, setVerified] = useState(false);
  const pendingError = useRef("");
  const otpInputRef = useRef(null);
  const verifying = useRef(false);


  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const verifyOtp = async (code) => {
    if (verifying.current || code.length !== OTP_LENGTH) return;
    verifying.current = true;

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/verify-otp`,
        { otp: code, email }
      );

      localStorage.setItem("resetToken", response.data?.resetToken);
      // BUG 5 FIX: sessionStorage.clear() ignores arguments and clears everything.
      // Use removeItem to only remove the email key.
      sessionStorage.removeItem("email");
      // Let the green confirmation play before leaving the page.
      setVerified(true);
      setTimeout(() => navigate("/reset-password", { state: { email } }), 700);
    } 
    catch (err) {
      pendingError.current = err.response?.data?.message || "Something went wrong";
      setShaking(true);
    }
    finally {
      verifying.current = false;
      setLoading(false);
    }
  };

  const handleShakeEnd = () => {
    setShaking(false);
    setError(pendingError.current);
    setOtp("");
  };

  // Refocus once the boxes are re-enabled after a failed attempt.
  useEffect(() => {
    if (!shaking && !loading && error) {
      otpInputRef.current?.focus();
    }
  }, [shaking, loading, error]);

  const handleOtpChange = (code) => {
    setOtp(code);
    if (error) setError("");
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    verifyOtp(otp);
  };

  const handleResendOtp = async () => {
    setError("");
    setOtp("");
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
        <p className="auth-title-reset-para">Enter the {OTP_LENGTH}-digit OTP sent to your registered email</p>

        <form className="auth-form" onSubmit={handleVerifyOtp}>
          <OtpInput
            ref={otpInputRef}
            length={OTP_LENGTH}
            value={otp}
            onChange={handleOtpChange}
            onComplete={verifyOtp}
            disabled={loading || shaking || verified}
            invalid={shaking || !!error}
            shaking={shaking}
            onShakeEnd={handleShakeEnd}
            success={verified}
          />

          {/* Always rendered so the layout doesn't jump when an error appears */}
          <p className={verified ? "otp-error otp-success" : "otp-error"} role="alert">
            {verified ? "Verified" : error}
          </p>

          <p className="otp-resend">
            Didn't get a code?{" "}
            <button type="button" className="auth-re-otp-btn" disabled={isResending} onClick={handleResendOtp}>
              {isResending ? "Sending..." : "Resend"}
            </button>
          </p>

          <div className="auth-submit-wrap">
            <button type="submit" className="auth-submit" disabled={loading || shaking || verified || otp.length !== OTP_LENGTH}>
              {loading ? "Verifying..." : verified ? "Verified" : "Verify"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
