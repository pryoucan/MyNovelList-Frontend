import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import PasswordInput from "../components/PasswordInput";
import RuleList from "../components/RuleList";
import { ruleState } from "../utils/ruleState";
import useShakeError from "../hooks/useShakeError";
import "../design/Auth.css";

// Must match registerUserValidator on the backend.
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 20;

export default function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { error, shaking, fail, clear, shakeProps } = useShakeError();

  const usernameOk = USERNAME_PATTERN.test(username);
  const passwordOk = password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX;
  const canSubmit = usernameOk && passwordOk && email !== "" && !loading && !shaking;

  const edit = (setter) => (e) => {
    setter(e.target.value);
    if (error) clear();
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    clear();
    setLoading(true);

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        username,
        email,
        password,
      });
      navigate("/login", { state: { email, notice: "Account created. Sign in to get started." } });
    } catch (err) {
      console.log(err.response?.data || err.message)
      fail(err.response?.data?.message || "Registration failed");
    }
    finally {
      setLoading(false);
    }
  };
  return (
    <main className="login-page">
      <div className="auth-container">
        <h1 className="auth-title">Create Account</h1>

        <form className="auth-form" onSubmit={handleSignup}>
          <div className="auth-fields" {...shakeProps}>
            <input
              type="text"
              placeholder="Username"
              className={`auth-input${username && !usernameOk ? " auth-input--invalid" : ""}`}
              autoComplete="username"
              maxLength={20}
              required
              autoFocus
              value={username}
              onChange={edit(setUsername)}
              aria-describedby="username-rules"
            />
            <RuleList
              id="username-rules"
              rules={[{ label: "3–20 letters, numbers or _", state: ruleState(username, usernameOk) }]}
            />

            <input
              type="email"
              placeholder="Email"
              className="auth-input"
              autoComplete="email"
              required
              value={email}
              onChange={edit(setEmail)}
            />

            <PasswordInput
              placeholder="Password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX}
              required
              status={password && !passwordOk ? "invalid" : undefined}
              value={password}
              onChange={edit(setPassword)}
              aria-describedby="password-rules"
            />
            <RuleList
              id="password-rules"
              rules={[{ label: `${PASSWORD_MIN}–${PASSWORD_MAX} characters`, state: ruleState(password, passwordOk) }]}
            />
          </div>

          <p className="auth-error auth-error--center" role="alert">{error}</p>

          <div className="auth-submit-wrap">
            <button type="submit" className="auth-submit" disabled={!canSubmit}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
