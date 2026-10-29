import { useEffect, useSyncExternalStore } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const STORAGE_KEY = "mnl:currentUser";

// One copy of the signed-in user for the whole app. It's kept in
// localStorage so the avatar shows instantly after navigation or a reload,
// and refreshed from /api/auth/me once per page load in the background.
let current = null;
try {
  current = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? null;
} catch {
  current = null;
}

const listeners = new Set();
let refreshed = false;
let inflight = null;

export const setCurrentUser = (user) => {
  current = user;
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable (private mode): the in-memory copy still works
  }
  listeners.forEach((listener) => listener());
};

export const clearCurrentUser = () => {
  refreshed = false;
  setCurrentUser(null);
};

export const refreshCurrentUser = () => {
  inflight ??= axios
    .get(`${API_URL}/api/auth/me`, { withCredentials: true })
    .then((res) => {
      setCurrentUser(res.data?.user ?? null);
      return current;
    })
    .finally(() => {
      refreshed = true;
      inflight = null;
    });
  return inflight;
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useCurrentUser() {
  const username = localStorage.getItem("displayUsername");
  const user = useSyncExternalStore(subscribe, () => current);
  // A cached copy from a different account (e.g. after an expired session) is ignored.
  const matches = !!user && user.username === username;

  useEffect(() => {
    if (username && (!refreshed || !matches)) {
      refreshCurrentUser().catch((err) => console.error("Failed to load current user:", err));
    }
  }, [username, matches]);

  return username && matches ? user : null;
}
