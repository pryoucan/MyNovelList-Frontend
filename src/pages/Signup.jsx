import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import "../design/Auth.css";

export default function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        username,
        email,
        password,
      });
      navigate("/login");
    } catch (err) {
      console.log(err.response?.data || err.message)
      setError(err.response?.data?.message || "Registration failed");
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
          <input
            type="text"
            placeholder="Username"
            className="auth-input"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

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

          {error && <p className="auth-error">{error}</p>}

          <div className="auth-submit-wrap">
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Creating account..." : "Submit"}
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
