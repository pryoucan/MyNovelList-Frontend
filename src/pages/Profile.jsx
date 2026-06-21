import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../design/Homepage.css";
import "../design/Profile.css";

const compressImage = (file, maxWidth, maxHeight, quality) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/webp", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Soft limit: prevent uploading files larger than 10MB to avoid browser lag during canvas draw
    const limitBytes = 10 * 1024 * 1024;
    if (file.size > limitBytes) {
      alert("Image must be smaller than 10MB.");
      return;
    }

    setUploading(true);

    try {
      // Compress to max 200x200 pixels at 80% JPEG quality
      const compressedBase64 = await compressImage(file, 200, 200, 0.8);
      const res = await axios.put("/api/auth/profile", { avatar: compressedBase64 });
      setUser(res.data.user);
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      alert(err.response?.data?.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/api/auth/me");
        setUser(res.data.user);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Session expired. Please log in again.");
        // If 401, clear local storage and redirect to login
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("displayUsername");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div className="page-loading">Loading Profile...</div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="page-container">
        <div className="page-error" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <p style={{ color: "#ba1a1a", marginBottom: "1rem" }}>{error}</p>
          <button className="btn" onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <h2 className="page-title" onClick={() => navigate("/")}>
          MyNovelList
        </h2>
        <button className="btn" onClick={() => navigate("/")}>
          Back to List
        </button>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-container">
              <div className="profile-avatar-wrapper" onClick={triggerFileInput}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="profile-avatar-img" />
                ) : (
                  <span className="profile-avatar-initial">
                    {user.username ? user.username[0].toUpperCase() : "U"}
                  </span>
                )}
                <div className="profile-avatar-overlay">
                  <span className="profile-upload-icon">📷</span>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleImageUpload}
              />
              {uploading && <div className="profile-avatar-uploading">Saving...</div>}
            </div>
            <div className="profile-identity">
              <h1 className="profile-username">{user.username}</h1>
              <span className={`profile-badge ${user.role === "ADMIN" ? "badge-admin" : "badge-user"}`}>
                {user.role}
              </span>
            </div>
          </div>

          <div className="profile-body">
            <div className="profile-info-item">
              <div className="info-label">Email Address</div>
              <div className="info-value">{user.email}</div>
            </div>

            <div className="profile-info-item">
              <div className="info-label">Phone Number</div>
              <div className="info-value">{user.phoneNumber || "Not Provided"}</div>
            </div>

            <div className="profile-info-item">
              <div className="info-label">Email Verification</div>
              <div className="info-value">
                <span className={`verify-status ${user.isEmailVerified ? "status-verified" : "status-unverified"}`}>
                  {user.isEmailVerified ? "Verified" : "Unverified"}
                </span>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="info-label">Member Since</div>
              <div className="info-value">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
