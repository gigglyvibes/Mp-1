import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import * as notificationApi from "../api/notification.api";

const SocketContext = createContext(null);

let toastIdCounter = 0;

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (notification) => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { id, notification }]);
      setTimeout(() => removeToast(id), 6000);
    },
    [removeToast]
  );

  // Load notification history whenever a user is authenticated, so the
  // bell/dropdown has data immediately rather than waiting for a live event.
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data } = await notificationApi.getMyNotifications({ page: 1, limit: 20 });
        if (cancelled) return;
        setNotifications(data.data.items);
        setUnreadCount(data.data.unreadCount);
      } catch (err) {
        console.error("Failed to load notifications:", err.response?.data?.message || err.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!user || !token) return undefined;

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
    });

    socket.on("notification:new", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      pushToast(notification);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, pushToast]);

  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await notificationApi.markNotificationRead(id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err.response?.data?.message || err.message);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const hadUnread = notifications.some((n) => !n.isRead);
    if (!hadUnread) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationApi.markAllNotificationsRead();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err.response?.data?.message || err.message);
    }
  }, [notifications]);

  return (
    <SocketContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        removeToast,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
};
