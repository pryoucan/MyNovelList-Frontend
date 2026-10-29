import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const withCreds = { withCredentials: true };

// ── Users: suggest novels and edits ──
export const submitNovelRequest = async (novel) =>
  (await axios.post(`${API_URL}/api/requests/novels`, novel, withCreds)).data;

export const submitEditRequest = async (novelId, body) =>
  (await axios.post(`${API_URL}/api/requests/novels/${novelId}/edits`, body, withCreds)).data;

export const getMySubmissions = async () =>
  (await axios.get(`${API_URL}/api/requests/mine`, withCreds)).data.requests ?? [];

export const withdrawRequest = async (type, id) =>
  (await axios.delete(`${API_URL}/api/requests/${type}/${id}`, withCreds)).data;

// ── Admins: review queue ──
export const getAdminRequests = async ({ status = "PENDING", type } = {}) =>
  (await axios.get(`${API_URL}/api/admin/requests`, { ...withCreds, params: { status, type } })).data;

export const approveRequest = async (type, id) =>
  (await axios.post(`${API_URL}/api/admin/requests/${type}/${id}/approve`, {}, withCreds)).data;

export const rejectRequest = async (type, id, reason) =>
  (await axios.post(`${API_URL}/api/admin/requests/${type}/${id}/reject`, { reason }, withCreds)).data;

// Contribution profile of a submitter (no email/phone).
export const getSubmitterProfile = async (userId) =>
  (await axios.get(`${API_URL}/api/admin/users/${userId}`, withCreds)).data;
