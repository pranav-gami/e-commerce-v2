import api from "../../utils/api";

// Review API functions — no state, just direct calls

export const createReview = async (payload) => {
  const res = await api.post("/reviews", payload);
  return res.data;
};

export const getUserReviews = async () => {
  const res = await api.get("/reviews/my-reviews");
  return res.data.reviews || [];
};

export const deleteReview = async (reviewId) => {
  await api.delete(`/reviews/${reviewId}`);
};

export const updateReview = async (reviewId, payload) => {
  const res = await api.put(`/reviews/${reviewId}`, payload);
  return res.data;
};
