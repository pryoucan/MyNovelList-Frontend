import axios from "axios";
import { clearCurrentUser } from "../hooks/useCurrentUser";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Clears the session cookie and local login state, then reloads at home.
export const logout = async () => {
  try {
    await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
  } catch (err) {
    console.error("Logout failed:", err);
  }
  localStorage.removeItem("token");
  localStorage.removeItem("displayUsername");
  clearCurrentUser();
  window.location.href = "/";
};
