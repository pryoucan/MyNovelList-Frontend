import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../design/Homepage.css";
import "../design/status.css";
import "../design/Profile.css";
import { Header } from "../components/Header";
import StatusIcon from "../components/StatusIcon";
import { getUserNovelEntries } from "../services/userNovelService";
import { logout } from "../utils/auth";
import { setCurrentUser } from "../hooks/useCurrentUser";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const STATUSES = ["Reading", "Completed", "On Hold", "Plan To Read", "Dropped"];
const PHONE_MAX = 20;

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

// Everything the stats card shows, derived from the user's list entries.
const computeStats = (entries) => {
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  let chapters = 0;
  let ratingSum = 0;
  let rated = 0;
  let finishedThisYear = 0;
  const year = new Date().getFullYear();

  for (const entry of entries) {
    byStatus[entry.status] = (byStatus[entry.status] ?? 0) + 1;
    chapters += entry.progress ?? 0;
    if (entry.rating != null) {
      ratingSum += entry.rating;
      rated += 1;
    }
    if (entry.status === "Completed" && entry.completedAt && new Date(entry.completedAt).getFullYear() === year) {
      finishedThisYear += 1;
    }
  }

  return {
    total: entries.length,
    byStatus,
    chapters,
    average: rated ? Math.round((ratingSum / rated) * 10) / 10 : null,
    rated,
    finishedThisYear,
    year,
  };
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const updateProfile = async (data) => {
    const res = await axios.put(`${API_URL}/api/auth/profile`, data, { withCredentials: true });
    setUser(res.data.user);
    setCurrentUser(res.data.user); // header avatar updates immediately
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    setAvatarError("");

    // Soft limit: prevent uploading files larger than 10MB to avoid browser lag during canvas draw
    const limitBytes = 10 * 1024 * 1024;
    if (file.size > limitBytes) {
      setAvatarError("Image must be smaller than 10MB.");
      return;
    }

    setUploading(true);

    try {
      // Compress to max 200x200 pixels at 80% quality
      const compressedBase64 = await compressImage(file, 200, 200, 0.8);
      await updateProfile({ avatar: compressedBase64 });
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      setAvatarError(err.response?.data?.message || "Couldn't upload the photo.");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarError("");
    setUploading(true);
    try {
      await updateProfile({ avatar: null });
    } catch (err) {
      setAvatarError(err.response?.data?.message || "Couldn't remove the photo.");
    } finally {
      setUploading(false);
    }
  };

  const savePhone = async (e) => {
    e.preventDefault();
    setPhoneError("");
    const value = phoneDraft.trim();
    if (value && !/^[+\d][\d\s()-]{5,}$/.test(value)) {
      setPhoneError("Enter a valid phone number.");
      return;
    }
    setPhoneSaving(true);
    try {
      await updateProfile({ phoneNumber: value || null });
      setEditingPhone(false);
    } catch (err) {
      setPhoneError(err.response?.data?.message || "Couldn't save the number.");
    } finally {
      setPhoneSaving(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [res, entries] = await Promise.all([
          axios.get(`${API_URL}/api/auth/me`, { withCredentials: true }),
          getUserNovelEntries().catch(() => null),
        ]);
        setUser(res.data.user);
        setCurrentUser(res.data.user);
        setStats(entries ? computeStats(entries) : null);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Session expired. Please log in again.");
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
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <div className="page-container">
        <Header />
        <p className="profile-page-error">{error || "Couldn't load your profile."}</p>
      </div>
    );
  }

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="page-container">
      <Header />
      <Link to="/" className="back-link">
        <span aria-hidden="true">←</span> Back to list
      </Link>

      <div className="profile-layout">
        {/* ── Identity + account ── */}
        <section className="profile-card" aria-labelledby="profile-name">
          <div className="profile-header">
            <div className="profile-avatar-container">
              <button
                type="button"
                className="profile-avatar-wrapper"
                onClick={triggerFileInput}
                aria-label="Change photo"
                disabled={uploading}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="profile-avatar-img" />
                ) : (
                  <span className="profile-avatar-initial">
                    {user.username ? user.username[0].toUpperCase() : "U"}
                  </span>
                )}
                {uploading && <span className="profile-avatar-uploading">Saving…</span>}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageUpload}
              />
            </div>
            <div className="profile-identity">
              <h1 className="profile-username" id="profile-name">{user.username}</h1>
              {user.role === "ADMIN" && <span className="profile-badge">Admin</span>}
              <div className="profile-photo-actions">
                <button type="button" className="profile-text-btn" onClick={triggerFileInput} disabled={uploading}>
                  {user.avatar ? "Change photo" : "Add photo"}
                </button>
                {user.avatar && (
                  <button type="button" className="profile-text-btn" onClick={removeAvatar} disabled={uploading}>
                    Remove
                  </button>
                )}
              </div>
              {avatarError && <p className="profile-inline-error" role="alert">{avatarError}</p>}
            </div>
          </div>

          <dl className="profile-body">
            <div className="profile-info-item">
              <dt className="info-label">Email</dt>
              <dd className="info-value info-email">
                <span>{user.email}</span>
                {user.isEmailVerified ? (
                  <span className="email-verified">
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3.5 8.5l3 3 6-7" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <span className="email-unverified">Not verified</span>
                )}
              </dd>
            </div>

            <div className="profile-info-item">
              <dt className="info-label">Phone</dt>
              <dd className="info-value">
                {editingPhone ? (
                  <form className="phone-form" onSubmit={savePhone}>
                    <input
                      className="phone-input"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={PHONE_MAX}
                      placeholder="+91 98765 43210"
                      aria-label="Phone number"
                      autoFocus
                      value={phoneDraft}
                      onChange={(e) => setPhoneDraft(e.target.value)}
                      onKeyDown={(e) => e.key === "Escape" && setEditingPhone(false)}
                    />
                    <button type="submit" className="phone-save" disabled={phoneSaving}>
                      {phoneSaving ? "Saving…" : "Save"}
                    </button>
                    <button type="button" className="profile-text-btn" onClick={() => setEditingPhone(false)}>
                      Cancel
                    </button>
                    {phoneError && <p className="profile-inline-error" role="alert">{phoneError}</p>}
                  </form>
                ) : (
                  <span className="info-row">
                    {user.phoneNumber || <span className="info-muted">Not added</span>}
                    <button
                      type="button"
                      className="profile-text-btn"
                      onClick={() => {
                        setPhoneDraft(user.phoneNumber ?? "");
                        setPhoneError("");
                        setEditingPhone(true);
                      }}
                    >
                      {user.phoneNumber ? "Edit" : "Add"}
                    </button>
                  </span>
                )}
              </dd>
            </div>

            <div className="profile-info-item">
              <dt className="info-label">Member since</dt>
              <dd className="info-value">{memberSince}</dd>
            </div>
          </dl>

          <div className="profile-actions">
            <button
              type="button"
              className="profile-action"
              onClick={() => navigate("/forgot-password", { state: { email: user.email } })}
            >
              Change password
            </button>
            <button type="button" className="profile-action profile-action--danger" onClick={logout}>
              Log out
            </button>
          </div>
        </section>

        {/* ── Reading stats ── */}
        <section className="profile-card stats-card" aria-labelledby="stats-title">
          <h2 className="stats-title" id="stats-title">Your reading</h2>

          {!stats ? (
            <p className="info-muted">Couldn't load your reading stats.</p>
          ) : stats.total === 0 ? (
            <div className="stats-empty">
              <p>Your list is empty — add a novel to start tracking.</p>
              <Link to="/" className="profile-action">Browse novels</Link>
            </div>
          ) : (
            <>
              <div className="stats-total">
                <span className="stats-total-number">{stats.total}</span>
                <span className="stats-total-label">{stats.total === 1 ? "novel" : "novels"} on your list</span>
              </div>

              <ul className="status-breakdown">
                {STATUSES.map((status) => {
                  const count = stats.byStatus[status] ?? 0;
                  return (
                    <li key={status} className={`status-breakdown-item${count === 0 ? " is-empty" : ""}`}>
                      <StatusIcon status={status} />
                      <span className="status-breakdown-label">{status === "Plan To Read" ? "Planned" : status}</span>
                      <span className="status-breakdown-count">{count}</span>
                      <span className="status-breakdown-bar" aria-hidden="true">
                        <span
                          className={`progress-fill status-breakdown-fill--${status.toLowerCase().split(" ").join("-")}`}
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="stats-grid">
                <div className="stat">
                  <span className="stat-value">{stats.chapters.toLocaleString()}</span>
                  <span className="stat-label">chapters read</span>
                </div>
                <div className="stat">
                  <span className="stat-value">
                    {stats.average != null ? (
                      <>
                        {stats.average}
                        <span className="stat-star" aria-hidden="true">★</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </span>
                  <span className="stat-label">
                    {stats.average != null ? `average of ${stats.rated} rated` : "no scores yet"}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-value">{stats.finishedThisYear}</span>
                  <span className="stat-label">finished in {stats.year}</span>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

// Same two-column shape as the loaded page.
function ProfileSkeleton() {
  return (
    <div className="page-container" aria-busy="true">
      <Header />
      <span className="visually-hidden" role="status">Loading profile…</span>
      <div className="skeleton" style={{ width: 96, height: 14, margin: "2px 0 1.25rem", borderRadius: 6 }} />
      <div className="profile-layout" aria-hidden="true">
        <div className="profile-card">
          <div className="profile-header">
            <div className="skeleton skeleton-avatar" />
            <div className="skeleton-identity">
              <div className="skeleton skeleton-name" />
              <div className="skeleton skeleton-badge" />
            </div>
          </div>
          <div className="profile-skeleton-body">
            {[70, 45, 55, 60].map((w, i) => (
              <div key={i} className="skeleton-info-item">
                <div className="skeleton skeleton-label" />
                <div className="skeleton skeleton-value" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="profile-card stats-card">
          <div className="skeleton skeleton-label" />
          <div className="skeleton" style={{ width: 160, height: 36, margin: "1rem 0 1.25rem", borderRadius: 8 }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 14, marginBottom: 14, borderRadius: 4, width: `${90 - i * 8}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
