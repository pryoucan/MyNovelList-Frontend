import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../design/Homepage.css";

function Header() {
  const navigate = useNavigate();
  const displayUsername = localStorage.getItem("displayUsername");
  const isLoggedIn = !!displayUsername;

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [avatar, setAvatar] = useState(null);
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
        console.error("Failed to fetch user in Header:", err);
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

  return (
    <header className="page-header">
      {/* Left */}
      <div className="page-title-wrap">
        <h1 className="page-title" onClick={() => navigate("/")}>
          MyNovelList
        </h1>
      </div>

      {/* Right */}
      {isLoggedIn && (
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
      )}
    </header>
  );
}

export { Header };
