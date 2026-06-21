import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const getAuthHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

// BUG 14 FIX: Added error handling to all service functions.
// Each function rethrows errors so callers can handle them (401 redirect, alerts, etc.)

export const getUserNovelEntries = async (token) => {
  try {
    const res = await axios.get(
      `${API_URL}/api/users/novels`,
      getAuthHeader(token)
    );
    return res.data.novels || [];
  } catch (error) {
    console.error("getUserNovelEntries failed:", error.response?.data || error.message);
    throw error;
  }
};

export const getUserNovelByNovelId = async (novelId, token) => {
  try {
    const res = await axios.get(
      `${API_URL}/api/users/novels/by-global/${novelId}`,
      getAuthHeader(token)
    );
    return res.data.novel;
  } catch (error) {
    console.error("getUserNovelByNovelId failed:", error.response?.data || error.message);
    throw error;
  }
};

export const createUserNovelEntry = async (novelId, entryData, token) => {
  try {
    const res = await axios.post(
      `${API_URL}/api/users/novels/${novelId}`,
      entryData,
      getAuthHeader(token)
    );
    return res.data;
  } catch (error) {
    console.error("createUserNovelEntry failed:", error.response?.data || error.message);
    throw error;
  }
};

export const editUserNovelEntry = async (userNovelId, data, token) => {
  try {
    const res = await axios.patch(
      `${API_URL}/api/users/novels/${userNovelId}`,
      data,
      getAuthHeader(token)
    );
    return res.data;
  } catch (error) {
    console.error("editUserNovelEntry failed:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteUserNovelEntry = async (userNovelId, token) => {
  try {
    const res = await axios.delete(
      `${API_URL}/api/users/novels/${userNovelId}`,
      getAuthHeader(token)
    );
    return res.data;
  } catch (error) {
    console.error("deleteUserNovelEntry failed:", error.response?.data || error.message);
    throw error;
  }
};
