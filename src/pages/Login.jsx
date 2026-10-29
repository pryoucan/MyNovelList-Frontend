import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import PasswordInput from "../components/PasswordInput";
import useShakeError from "../hooks/useShakeError";
import "../design/Auth.css";

export default function Login() {
  const navigate = useNavigate();
  // Set by ResetPassword / Signup after success.
  const { email: prefilledEmail, notice } = useLocation().state ?? {};
  const [email, setEmail] = useState(prefilledEmail ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNotice, setShowNotice] = useState(!!notice);
  const { error, shaking, fail, clear, shakeProps } = useShakeError();

  // Typing dismisses the notice and any previous error.
  const edit = (setter) => (e) => {
    setter(e.target.value);
    setShowNotice(false);
    if (error) clear();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clear();
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password }
      );
      localStorage.setItem("displayUsername", response.data.username);
      navigate("/");
    } catch (err) {
      setShowNotice(false);
      fail(err.response?.data?.message || "Login failed");
    }
    finally {
      setLoading(false);
    }
  };
  return (
    <main className="login-page">
      <div className="auth-container">
        <h1 className="auth-title">Sign in</h1>

        {notice && (
          <p className={`auth-notice${showNotice ? "" : " auth-notice--hidden"}`} role="status">
            {notice}
          </p>
        )}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className={`auth-fields${error || shaking ? " auth-fields--invalid" : ""}`} {...shakeProps}>
            <input
              type="email"
              placeholder="Email"
              className="auth-input"
              autoComplete="email"
              required
              autoFocus={!prefilledEmail}
              value={email}
              onChange={edit(setEmail)}
            />

            <PasswordInput
              placeholder="Password"
              autoComplete="current-password"
              required
              autoFocus={!!prefilledEmail}
              value={password}
              onChange={edit(setPassword)}
            />
          </div>

          <p className="auth-error auth-error--center" role="alert">{error}</p>

          <p className="auth-forgot">
            <Link to="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </p>

          <div className="auth-submit-wrap">
            <button type="submit" className="auth-submit" disabled={loading || shaking}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        <p className="auth-footer">
          Don’t have an account?{" "}
          <Link to="/signup" className="auth-link">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
