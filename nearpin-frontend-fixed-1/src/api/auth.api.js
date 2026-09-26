import axiosClient from "./axiosClient";

export const requestOtp = (payload) => axiosClient.post("/auth/otp/request", payload);
export const verifyOtp = (payload) => axiosClient.post("/auth/otp/verify", payload);

export const registerStudent = (formData) =>
  axiosClient.post("/auth/register/student", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const registerBusiness = (formData) =>
  axiosClient.post("/auth/register/business", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const login = (payload) => axiosClient.post("/auth/login", payload);
export const logout = () => axiosClient.post("/auth/logout");
export const getMe = () => axiosClient.get("/auth/me");
export const forgotPassword = (email) => axiosClient.post("/auth/forgot-password", { email });
export const resetPassword = (payload) => axiosClient.post("/auth/reset-password", payload);
