import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";
import { useCurrentUser } from "../hooks/useCurrentUser";
import "../design/UserMenu.css";

// Hover intent: small delays so passing over the chip doesn't flicker the menu.
const HOVER_OPEN_MS = 120;
const HOVER_CLOSE_MS = 250;

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const InboxIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

// Falls back to the initial if the image fails (e.g. a cached link expired).
const Avatar = ({ src, name }) => {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = src && failedSrc !== src;
  return (
    <span className="user-avatar">
      {showImage ? (
        <img src={src} alt="" className="user-avatar-img" onError={() => setFailedSrc(src)} />
      ) : (
        (name?.[0] ?? "U").toUpperCase()
      )}
    </span>
  );
};

// Avatar chip + account dropdown. Mouse: opens on hover (and click).
// Keyboard: Enter/Space/↓ opens, ↑/↓ move, Escape closes and refocuses the trigger.
export default function UserMenu() {
  const navigate = useNavigate();
  const username = localStorage.getItem("displayUsername");
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [openedByHover, setOpenedByHover] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const hoverTimer = useRef(null);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  // Only real mouse pointers hover; touch keeps tap-to-open.
  const onPointerEnter = (e) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setOpenedByHover(true);
      setOpen(true);
    }, HOVER_OPEN_MS);
  };

  const onPointerLeave = (e) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_MS);
  };

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    // Move focus into the menu for keyboard/click opens, not when it opened on hover.
    if (!openedByHover) listRef.current?.querySelector('[role="menuitem"]')?.focus();
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, openedByHover]);

  if (!username) return null;

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onMenuKeyDown = (e) => {
    const items = [...listRef.current.querySelectorAll('[role="menuitem"]')];
    const i = items.indexOf(document.activeElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className="user-menu" ref={menuRef} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
      <button
        ref={triggerRef}
        className="user-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          clearTimeout(hoverTimer.current);
          setOpenedByHover(false);
          // A click right after a hover-open keeps it open instead of toggling it shut.
          setOpen((v) => (openedByHover && v ? true : !v));
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpenedByHover(false);
            setOpen(true);
          }
        }}
      >
        <Avatar src={user?.avatar} name={username} />
        <span className="user-name">{username}</span>
        <span className="user-chevron" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="user-dropdown" role="menu" aria-label="Account" ref={listRef} onKeyDown={onMenuKeyDown}>
          <div className="menu-account">
            <Avatar src={user?.avatar} name={username} />
            <div className="menu-account-text">
              <div className="menu-account-name">{user?.username ?? username}</div>
              {user?.email && <div className="menu-account-email">{user.email}</div>}
            </div>
          </div>
          <div className="menu-divider" role="separator" />
          <button
            className="menu-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate("/profile");
            }}
          >
            <ProfileIcon /> Profile
          </button>
          <button
            className="menu-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate("/suggest");
            }}
          >
            <PlusIcon /> Suggest a novel
          </button>
          <button
            className="menu-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate("/submissions");
            }}
          >
            <InboxIcon /> My submissions
          </button>
          {user?.role === "ADMIN" && (
            <button
              className="menu-item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate("/admin");
              }}
            >
              <ShieldIcon /> Review requests
            </button>
          )}
          <div className="menu-divider" role="separator" />
          <button className="menu-item menu-item--danger" role="menuitem" onClick={logout}>
            <LogoutIcon /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
