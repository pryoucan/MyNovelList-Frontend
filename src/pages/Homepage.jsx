import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AddNovelModal } from "../components/AddNovelModal";
import { useNovelEntry } from "../hooks/useNovelEntry";
import { useNovelManager } from "../hooks/useNovelManager";
import axios from "axios";
import "../design/Homepage.css";

function Homepage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");

  const displayUsername = localStorage.getItem("displayUsername");
  const isLoggedIn = !!displayUsername;
  const showReadingListOnly = view === "readinglist" && isLoggedIn;

  const { novels, userEntries, loading, saveEntry, deleteEntry, authError } =
    useNovelManager(isLoggedIn);

  const entryForm = useNovelEntry();

  const [filter, setFilter] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState(null);

  const menuRef = useRef(null);

  // Fetch custom avatar on mount
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/me");
        if (res.data?.user?.avatar) {
          setAvatar(res.data.user.avatar);
        }
      } catch (err) {
        console.error("Failed to fetch user in Homepage:", err);
      }
    };
    fetchUser();
  }, [isLoggedIn]);

  // Close user dropdown menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  // BUG 15 FIX: Redirect to login when token is expired/invalid
  useEffect(() => {
    if (authError) {
      localStorage.removeItem("token");
      localStorage.removeItem("displayUsername");
      navigate("/login");
    }
  }, [authError, navigate]);

  useEffect(() => {
    if (showModal && selectedNovel) {
      const existingEntry = userEntries[selectedNovel._id];
      if (existingEntry) {
        entryForm.fill(existingEntry);
      } else {
        entryForm.reset();
      }
    }
  }, [showModal, selectedNovel, userEntries]);

  // Reset filter when switching between Global list and Reading List views
  useEffect(() => {
    setFilter("");
  }, [showReadingListOnly]);

  const openModal = (novel) => {
    if (!isLoggedIn) return alert("Login required");
    setSelectedNovel(novel);
    setShowModal(true);
  };

  // BUG 2 FIX: Moved currentEntry declaration before functions that use it
  const currentEntry = selectedNovel ? userEntries[selectedNovel._id] : null;

  const handleSubmit = async () => {
    if (!selectedNovel) return;

    try {
      // BUG 12 FIX: Consistent payload — send progress as-is (0 is valid),
      // only omit null/undefined for optional fields using ?? undefined
      await saveEntry(selectedNovel._id, {
        status: entryForm.status,
        progress: entryForm.progress === "" ? 0 : (entryForm.progress ?? 0),
        rating: entryForm.rating ?? undefined,
        startedAt: entryForm.startedAt ?? undefined,
        completedAt: entryForm.completedAt ?? undefined,
      });
      setShowModal(false);
    } catch (err) {
      console.error("saveEntry failed:", err);
      alert("Failed to save novel");
    }
  };

  const handleDelete = async () => {
    if (!currentEntry || !selectedNovel) return;

    try {
      await deleteEntry(currentEntry._id, selectedNovel._id);
      setShowModal(false);
    } catch {
      alert("Failed to delete novel");
    }
  };

  // Filter novels dynamically based on view and active status filters
  const filtered = novels.filter((n) => {
    if (showReadingListOnly) {
      const entry = userEntries[n._id];
      if (!entry) return false;
      if (filter) {
        return entry.status.toLowerCase() === filter.toLowerCase();
      }
      return true;
    } else {
      if (filter) {
        return n.publication?.status?.toLowerCase() === filter.toLowerCase();
      }
      return true;
    }
  });

  const filterOptions = showReadingListOnly
    ? ["", "Reading", "Completed", "Plan To Read"]
    : ["", "Ongoing", "Upcoming", "Completed"];

  if (loading) {
    return (
      <div
        className="page-container"
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="title-container">
          <h2 className="page-title" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            MyNovelList
          </h2>
          {showReadingListOnly && (
            <span 
              className="view-badge" 
              onClick={() => navigate("/")}
            >
              Reading List ✕
            </span>
          )}
        </div>

        {isLoggedIn ? (
          <div className="user-menu" ref={menuRef}>
            <button
              className="user-trigger"
              onClick={() => setShowUserMenu((v) => !v)}
            >
              <span className="user-avatar">
                {avatar ? (
                  <img src={avatar} alt={displayUsername} className="user-avatar-img" />
                ) : (
                  displayUsername ? displayUsername[0].toUpperCase() : "U"
                )}
              </span>
              <span className="user-name">{displayUsername}</span>
              <span className="user-chevron">▾</span>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                {/* BUG 9 FIX: Added onClick to navigate to profile */}
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate("/profile");
                  }}
                >
                  My Profile
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate("/?view=readinglist");
                  }}
                >
                  My Reading List
                </button>
                <button
                  className="dropdown-item-danger"
                  onClick={async () => {
                    try {
                      await axios.post("/api/auth/logout");
                    } catch (err) {
                      console.error("Logout failed:", err);
                    }
                    localStorage.removeItem("token");
                    localStorage.removeItem("displayUsername");
                    window.location.href = "/";
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="btn" onClick={() => navigate("/login")}>
            Log In
          </button>
        )}
      </div>

      <div className="filter-bar">
        {filterOptions.map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f || "All"}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table className="novel-table">
          <thead>
            <tr>
              <th>Index</th>
              <th>Title</th>
              <th>Your Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-state">
                  {showReadingListOnly ? "Your reading list is empty." : "No novel found"}
                </td>
              </tr>
            ) : (
              filtered.map((n, i) => {
                const userEntry = userEntries[n._id];
                return (
                  <tr key={n._id}>
                    <td>{i + 1}</td>
                    <td className="title-td">
                      <Link to={`/novel/${n._id}`} className="novel-link">
                        {n.title}
                      </Link>
                      <div className="author">{n.author}</div>
                    </td>

                    <td>{userEntry?.rating ?? "N/A"}</td>
                    <td>
                      <button
                        className={
                          userEntry?.status
                            ? `status-btn status-btn-${userEntry.status
                                .split(" ")
                                .join("-")}`
                            : "btn"
                        }
                        onClick={() => openModal(n)}
                      >
                        {userEntry?.status ? userEntry.status : "Add To List"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AddNovelModal
        open={showModal}
        novel={selectedNovel}
        entry={currentEntry}
        status={entryForm.status}
        progress={entryForm.progress}
        rating={entryForm.rating}
        startedAt={entryForm.startedAt}
        completedAt={entryForm.completedAt}
        setStatus={entryForm.setStatus}
        setProgress={entryForm.setProgress}
        setRating={entryForm.setRating}
        setStartedAt={entryForm.setStartedAt}
        setCompletedAt={entryForm.setCompletedAt}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        isEditing={!!currentEntry}
      />
    </div>
  );
}

export { Homepage };
