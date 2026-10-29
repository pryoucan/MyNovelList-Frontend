import axios from "axios";

const base = `${import.meta.env.VITE_API_BASE_URL}/api/novels`;

export const getNovelReviews = async (novelId) => {
  const response = await axios.get(`${base}/${novelId}/reviews`);
  return response.data.reviews;
};

export const createNovelReview = async (novelId, data) => {
  const response = await axios.post(`${base}/${novelId}/reviews`, data, { withCredentials: true });
  return response.data.review;
};

export const editNovelReview = async (novelId, data) => {
  const response = await axios.patch(`${base}/${novelId}/reviews/mine`, data, { withCredentials: true });
  return response.data.review;
};

export const deleteNovelReview = async (novelId) => {
  await axios.delete(`${base}/${novelId}/reviews/mine`, { withCredentials: true });
};
