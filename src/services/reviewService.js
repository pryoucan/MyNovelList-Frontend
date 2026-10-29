import axios from "axios";

const base = `${import.meta.env.VITE_API_BASE_URL}/api/novels`;

export const getNovelReviews = async (novelId) => {
  const response = await axios.get(`${base}/${novelId}/reviews`, { withCredentials: true });
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

const threadBase = (novelId, reviewId) => `${base}/${novelId}/reviews/${reviewId}`;

export const setReviewLike = async (novelId, reviewId, liked) => {
  const url = `${threadBase(novelId, reviewId)}/like`;
  const response = liked
    ? await axios.put(url, {}, { withCredentials: true })
    : await axios.delete(url, { withCredentials: true });
  return response.data;
};

export const createReviewReply = async (novelId, reviewId, body, parentId = null) => {
  const response = await axios.post(`${threadBase(novelId, reviewId)}/replies`, { body, parentId }, { withCredentials: true });
  return response.data.reply;
};

export const editReviewReply = async (novelId, reviewId, replyId, body) => {
  const response = await axios.patch(`${threadBase(novelId, reviewId)}/replies/${replyId}`, { body }, { withCredentials: true });
  return response.data.reply;
};

export const deleteReviewReply = async (novelId, reviewId, replyId) => {
  const response = await axios.delete(`${threadBase(novelId, reviewId)}/replies/${replyId}`, { withCredentials: true });
  return response.data.reply;
};

export const setReplyLike = async (novelId, reviewId, replyId, liked) => {
  const url = `${threadBase(novelId, reviewId)}/replies/${replyId}/like`;
  const response = liked
    ? await axios.put(url, {}, { withCredentials: true })
    : await axios.delete(url, { withCredentials: true });
  return response.data;
};
