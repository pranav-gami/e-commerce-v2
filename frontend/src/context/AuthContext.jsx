import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await api.get("/auth/profile");
        setUser(profile.data.data);
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const token = res.data.data?.data?.token;
    if (token) {
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const profile = await api.get("/auth/profile");
      setUser(profile.data.data);
    }
    return res.data;
  };

  const register = async (
    name,
    email,
    password,
    phone,
    address,
    countryId,
    stateId,
    cityId,
    postalCode,
  ) => {
    await api.post("/auth/register", {
      name,
      email,
      password,
      phone,
      address,
      countryId: Number(countryId),
      stateId: Number(stateId),
      cityId: Number(cityId),
      postalCode,
    });
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const forgotPassword = async (email) =>
    (await api.post("/auth/forgot-password", { email })).data;
  const verifyOtp = async (email, otp) =>
    (await api.post("/auth/verify-otp", { email, otp })).data;
  const updatePassword = async (email, otp, newPassword) =>
    (await api.patch("/auth/update-password", { email, otp, newPassword }))
      .data;
  const sendSignupOtp = async (email) =>
    (await api.post("/auth/send-signup-otp", { email })).data;
  const verifySignupOtp = async (email, otp) =>
    (await api.post("/auth/verify-signup-otp", { email, otp })).data;
  const getProfile = async () => (await api.get("/auth/profile")).data.data;

  const updateProfile = async (data) => {
    const payload = {
      name: data.name,
      phone: data.phone,
      address: data.address,
    };
    if (data.countryId) payload.countryId = Number(data.countryId);
    if (data.stateId) payload.stateId = Number(data.stateId);
    if (data.cityId) payload.cityId = Number(data.cityId);
    if (data.postalCode) payload.postalCode = data.postalCode;
    await api.put("/auth/profile", payload);
    const profile = await api.get("/auth/profile");
    setUser(profile.data.data);
  };

  // ── Orders ──
  const getOrders = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page);
    if (params.limit) query.set("limit", params.limit);
    if (params.status) query.set("status", params.status);
    return (await api.get(`/orders?${query.toString()}`)).data.data;
  };
  const cancelOrder = async (orderId) =>
    (await api.patch(`/orders/${orderId}/cancel`)).data;

  // ── Addresses ──
  const getAddresses = async () => (await api.get("/addresses")).data.addresses;
  const getCheckoutAddresses = async () =>
    (await api.get("/addresses/checkout")).data;
  const addAddress = async (data) => (await api.post("/addresses", data)).data;
  const updateAddress = async (id, data) =>
    (await api.put(`/addresses/${id}`, data)).data;
  const deleteAddress = async (id) =>
    (await api.delete(`/addresses/${id}`)).data;
  const setDefaultAddress = async (id) =>
    (await api.patch(`/addresses/${id}/set-default`)).data;

  const value = {
    user,
    authLoading,
    login,
    register,
    logout,
    forgotPassword,
    verifyOtp,
    sendSignupOtp,
    verifySignupOtp,
    updatePassword,
    getProfile,
    updateProfile,
    getOrders,
    cancelOrder,
    getAddresses,
    getCheckoutAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
