import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authApi from "../api/auth.api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await authApi.getMe();
      setUser(data.data);
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const persistSession = ({ user: sessionUser, accessToken, refreshToken }) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    if (sessionUser?._id) {
      localStorage.setItem("userId", sessionUser._id);
    }
    setUser(sessionUser);
  };

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    try {
      const { data } = await authApi.getMe();
      setUser(data.data);
      return data.data;
    } catch {
      return null;
    }
  }, []);

  const login = async (payload) => {
    // Authenticate exclusively through backend API and MongoDB
    const { data } = await authApi.login(payload);
    persistSession(data.data);
    return data.data.user;
  };

  const registerStudent = async (formData) => {
    const { data } = await authApi.registerStudent(formData);
    persistSession(data.data);
    return data.data.user;
  };

  const registerBusiness = async (formData) => {
    const { data } = await authApi.registerBusiness(formData);
    persistSession(data.data);
    return data.data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* proceed with local logout regardless of network state */
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, registerStudent, registerBusiness, refreshUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;};
