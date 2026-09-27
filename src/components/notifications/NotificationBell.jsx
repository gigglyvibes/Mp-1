import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { timeAgo } from "./timeAgo";

const BellIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Resolves where clicking a notification should navigate the user, based
 * on whichever related entity it carries. Falls back to no navigation.
 */
const resolveNotificationLink = (notification) => {
  if (notification.relatedJob) {
    const jobId = typeof notification.relatedJob === "object" ? notification.relatedJob._id : notification.relatedJob;
    return `/jobs/${jobId}`;
  }
  if (notification.relatedApplication) {
    const applicationId =
      typeof notification.relatedApplication === "object" ? notification.relatedApplication._id : notification.relatedApplication;
    return `/agreements/application/${applicationId}`;
  }
  return null;
};

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSocket();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleItemClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    const link = resolveNotificationLink(notification);
    if (link) {
      navigate(link);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition hover:border-teal/50 hover:bg-charcoal-elevated"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-signal px-1 font-mono text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl2 border border-line bg-charcoal-card shadow-card-hover">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-display text-sm font-semibold text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="font-mono text-[11px] uppercase tracking-wide text-teal hover:text-teal-light"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">You&apos;re all caught up.</p>
            ) : (
              notifications.map((notification) => {
                const clickable = Boolean(resolveNotificationLink(notification));
                return (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() => handleItemClick(notification)}
                    className={`flex w-full flex-col items-start gap-0.5 border-b border-line px-4 py-3 text-left transition last:border-b-0 hover:bg-charcoal-elevated ${
                      clickable ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <div className="flex w-full items-center gap-2">
                      {!notification.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />}
                      <p className={`flex-1 text-sm ${notification.isRead ? "text-muted" : "font-medium text-ink"}`}>
                        {notification.title}
                      </p>
                    </div>
                    <p className="text-xs text-faint">{notification.message}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-faint">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
