import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const withCredentials = { withCredentials: true };

// BUG 14 FIX: Added error handling to all service functions.
// Each function rethrows errors so callers can handle them (401 redirect, alerts, etc.)

export const getUserNovelEntries = async () => {
  try {
    const res = await axios.get(
      `${API_URL}/api/users/novels`,
      withCredentials
    );
    return res.data.novels || [];
  } catch (error) {
    console.error("getUserNovelEntries failed:", error.response?.data || error.message);
    throw error;
  }
};

export const getUserNovelByNovelId = async (novelId) => {
  try {
    const res = await axios.get(
      `${API_URL}/api/users/novels/by-global/${novelId}`,
      withCredentials
    );
    return res.data.novel;
  } catch (error) {
    console.error("getUserNovelByNovelId failed:", error.response?.data || error.message);
    throw error;
  }
};

export const createUserNovelEntry = async (novelId, entryData) => {
  try {
    const res = await axios.post(
      `${API_URL}/api/users/novels/${novelId}`,
      entryData,
      withCredentials
    );
    return res.data;
  } catch (error) {
    console.error("createUserNovelEntry failed:", error.response?.data || error.message);
    throw error;
  }
};

export const editUserNovelEntry = async (userNovelId, data) => {
  try {
    const res = await axios.patch(
      `${API_URL}/api/users/novels/${userNovelId}`,
      data,
      withCredentials
    );
    return res.data;
  } catch (error) {
    console.error("editUserNovelEntry failed:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteUserNovelEntry = async (userNovelId) => {
  try {
    const res = await axios.delete(
      `${API_URL}/api/users/novels/${userNovelId}`,
      withCredentials
    );
    return res.data;
  } catch (error) {
    console.error("deleteUserNovelEntry failed:", error.response?.data || error.message);
    throw error;
  }
};
