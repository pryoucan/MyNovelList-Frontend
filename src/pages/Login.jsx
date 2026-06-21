import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import "../design/Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
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
      setError(err.response?.data?.message || "Login failed");
    }
    finally {
      setLoading(false);
    }
  };
  return (
    <main className="login-page">
      <div className="auth-container">
        <h1 className="auth-title">Sign in</h1>

        <form className="auth-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="auth-input"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="auth-input"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <p className="auth-forgot">
            <Link to="/forgot-password" className="auth-link auth-forgot-link">
              Forgot password?
            </Link>
          </p>

          {error && <p className="auth-error">{error}</p>}

          <div className="auth-submit-wrap">
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Signing in..." : "Submit"}
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
