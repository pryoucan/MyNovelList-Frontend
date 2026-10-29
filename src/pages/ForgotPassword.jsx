import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import useShakeError from "../hooks/useShakeError";
import "../design/Auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  // Prefilled when coming from Profile → Change password.
  const [email, setEmail] = useState(useLocation().state?.email ?? "");
  const [loading, setLoading] = useState(false);
  const { error, shaking, fail, clear, shakeProps } = useShakeError();


  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clear();
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    setLoading(true);
    
    try {
      await axios.post(
        `${API_URL}/api/auth/forgot-password`,
        { email }
      );
      sessionStorage.setItem("email", email);
      navigate("/verify-otp");
    } 
    catch (err) {
      fail(err.response?.data?.message || "Something went wrong");
    }
    finally {
        setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="auth-container">
        <h1 className="auth-title-reset">Reset your password</h1>
        <p className="auth-title-reset-para">Enter your user account's verified email address and
            <br /> we will send you an OTP.</p>

        <form className="auth-form" onSubmit={handleForgotPassword}>
          <div className={`auth-fields${error || shaking ? " auth-fields--invalid" : ""}`} {...shakeProps}>
            <input
              type="email"
              placeholder="Email"
              className="auth-input"
              autoComplete="email"
              required
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) clear();
              }}
            />
          </div>

          <p className="auth-error auth-error--center" role="alert">{error}</p>

          <div className="auth-submit-wrap">
            <button type="submit" className="auth-submit" disabled={loading || shaking}>
              {loading ? "Sending..." : "Send code"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
