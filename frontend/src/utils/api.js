import axios from "axios";

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${BACKEND_URL}/users`,
  withCredentials: true,
});

// attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getHeroSlides = async () => {
  const res = await axios.get(`${BACKEND_URL}/users/hero`);
  return res.data.data || [];
};

export default api;
