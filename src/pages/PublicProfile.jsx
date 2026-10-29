import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { Header } from "../components/Header";
import StatusIcon from "../components/StatusIcon";
import "../design/Homepage.css";
import "../design/status.css";
import "../design/Profile.css";
import "../design/PublicProfile.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const STATUSES = ["Reading", "Completed", "On Hold", "Plan To Read", "Dropped"];

export default function PublicProfile() {
  const { username } = useParams();
  return <PublicProfileContent key={username} username={username} />;
}

function PublicProfileContent({ username }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    axios.get(`${API_URL}/api/profiles/${encodeURIComponent(username)}`)
      .then((response) => { if (active) setProfile(response.data); })
      .catch((failure) => {
        if (active) setError(failure.response?.status === 404 ? "Profile not found." : "Couldn’t load this profile.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [username]);

  const user = profile?.user;
  const stats = profile?.stats;
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="page-container">
      <Header />
      <Link to="/" className="back-link"><span aria-hidden="true">←</span> Back to list</Link>
      {loading ? (
        <p className="profile-page-error" role="status">Loading profile…</p>
      ) : !user ? (
        <p className="profile-page-error" role="alert">{error}</p>
      ) : (
        <div className="profile-layout">
          <section className="profile-card" aria-labelledby="public-profile-name">
            <div className="profile-header">
              <div className="profile-avatar-container">
                <div className="profile-avatar-wrapper public-profile-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="profile-avatar-img" />
                  ) : (
                    <span className="profile-avatar-initial">{user.username[0].toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div className="profile-identity">
                <h1 className="profile-username" id="public-profile-name">{user.username}</h1>
                {user.role === "ADMIN" && <span className="profile-badge">Admin</span>}
              </div>
            </div>
            <dl className="profile-body">
              <div className="profile-info-item">
                <dt className="info-label">Member since</dt>
                <dd className="info-value">{memberSince}</dd>
              </div>
            </dl>
          </section>

          <section className="profile-card stats-card" aria-labelledby="public-stats-title">
            <h2 className="stats-title" id="public-stats-title">{user.username}’s reading</h2>
            {stats.total === 0 ? (
              <p className="public-profile-empty">No novels tracked yet.</p>
            ) : (
              <>
                <div className="stats-total">
                  <span className="stats-total-number">{stats.total}</span>
                  <span className="stats-total-label">{stats.total === 1 ? "novel" : "novels"} on their list</span>
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
                          <span className={`progress-fill status-breakdown-fill--${status.toLowerCase().split(" ").join("-")}`} style={{ width: `${(count / stats.total) * 100}%` }} />
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
                      {stats.average != null ? <>{stats.average}<span className="stat-star" aria-hidden="true">★</span></> : "—"}
                    </span>
                    <span className="stat-label">{stats.average != null ? `average of ${stats.rated} rated` : "no scores yet"}</span>
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
      )}
    </div>
  );
}
