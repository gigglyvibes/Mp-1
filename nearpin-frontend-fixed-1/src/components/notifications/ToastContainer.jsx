import React from "react";
import { useSocket } from "../../context/SocketContext";

/**
 * Renders transient toast popups for real-time notification events.
 * Mounted once at the layout level so toasts show regardless of which
 * page the user is on.
 */
const ToastContainer = () => {
  const { toasts, removeToast } = useSocket();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-3">
      {toasts.map(({ id, notification }) => (
        <div
          key={id}
          role="status"
          className="pointer-events-auto animate-fadeUp overflow-hidden rounded-xl2 border border-line bg-charcoal-elevated shadow-card-hover"
        >
          <div className="flex items-start gap-3 px-4 py-3.5">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-signal" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{notification.title}</p>
              <p className="mt-0.5 truncate text-xs text-muted">{notification.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(id)}
              className="shrink-0 text-faint transition hover:text-ink"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
