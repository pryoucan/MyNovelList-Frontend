import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import "../design/Auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/forgot-password`,
        { email }
      );
      sessionStorage.setItem("email", email);
      console.log(response.data);
      navigate("/verify-otp");
    } 
    catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
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
          <input
            type="email"
            placeholder="Email"
            className="auth-input"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && <p className="auth-error">{error}</p>}

          <div className="auth-submit-wrap">
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Sending..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
