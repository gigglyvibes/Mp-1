import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach the access token to every outgoing request.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, refresh once and queue concurrent requests behind that refresh.
let isRefreshing = false;
let refreshSubscribers = [];

const notifyRefreshSubscribers = (error, token = null) => {
  refreshSubscribers.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshSubscribers = [];
};

axiosClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshSubscribers.push({ resolve, reject });
      }).then((token) => {
        originalRequest._retry = true;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;
    try {
      const userId = localStorage.getItem("userId");
      const refreshToken = localStorage.getItem("refreshToken");
      if (!userId || !refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, {
        userId,
        refreshToken,
      });

      const nextAccessToken = data.data.accessToken;
      localStorage.setItem("accessToken", nextAccessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      notifyRefreshSubscribers(null, nextAccessToken);
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      notifyRefreshSubscribers(refreshError);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;
