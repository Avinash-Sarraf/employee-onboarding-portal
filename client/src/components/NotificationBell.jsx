import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { notificationTypeLabel } from "../constants/notificationTypes";
import { cn } from "../utils/cn";

export function NotificationBell({ className }) {
  const navigate = useNavigate();
  const { unreadCount, recent, refresh, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", onDoc);
      window.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const onChanged = () => refresh();
    window.addEventListener("app:notifications-changed", onChanged);
    return () => window.removeEventListener("app:notifications-changed", onChanged);
  }, [refresh]);

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl border border-transparent p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 z-[80] mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/80">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Notifications
            </p>
            <button
              type="button"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
            >
              View all
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {recent.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-500">
                You&apos;re all caught up.
              </p>
            ) : (
              recent.map((n) => (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => {
                    if (!n.read) markRead(n._id);
                    setOpen(false);
                    navigate("/notifications");
                  }}
                  className={cn(
                    "flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left transition last:border-0 dark:border-slate-800",
                    n.read
                      ? "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      : "bg-indigo-50/60 hover:bg-indigo-50 dark:bg-slate-800/40 dark:hover:bg-slate-800/80"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {!n.read ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                    ) : (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-transparent" />
                    )}
                    <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                      {notificationTypeLabel(n.type)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {n.title}
                  </span>
                  {n.body ? (
                    <span className="line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                      {n.body}
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
