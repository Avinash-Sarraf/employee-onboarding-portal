import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";
import api from "../api/client";
import { useNotifications } from "../context/NotificationContext";
import { useToast } from "../context/ToastContext";
import { notificationTypeLabel } from "../constants/notificationTypes";
import { HrSpinner } from "../components/hr/HrSpinner";
import { HrEmptyState } from "../components/hr/HrEmptyState";

const NotificationsPage = () => {
  const user = getUser();
  const navigate = useNavigate();
  const toast = useToast();
  const { refresh: refreshSummary, markRead, markAllRead } = useNotifications();

  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [broadcastKind, setBroadcastKind] = useState("hr_announcement");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState("all_employees");
  const [broadcastIds, setBroadcastIds] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/notifications", { params: { limit: 40 } });
        if (cancelled) return;
        const data = res.data?.data || [];
        const meta = res.data?.meta || {};
        setItems(data);
        setNextCursor(meta.nextCursor || null);
        setHasMore(Boolean(meta.hasMore));
      } catch (e) {
        if (!cancelled) {
          toast.error(
            e.response?.data?.message || e.message || "Could not load."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const loadMore = async () => {
    if (!hasMore || loadingMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await api.get("/notifications", {
        params: { limit: 40, cursor: nextCursor },
      });
      const data = res.data?.data || [];
      const meta = res.data?.meta || {};
      setItems((prev) => [...prev, ...data]);
      setNextCursor(meta.nextCursor || null);
      setHasMore(Boolean(meta.hasMore));
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || "Load more failed");
    } finally {
      setLoadingMore(false);
    }
  };

  const onRowOpen = async (n) => {
    if (!n.read) {
      await markRead(n._id);
      setItems((prev) =>
        prev.map((x) =>
          x._id === n._id ? { ...x, read: true, readAt: new Date().toISOString() } : x
        )
      );
    }
  };

  const handleMarkAll = async () => {
    await markAllRead();
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    toast.success("All marked read.");
  };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    const title = broadcastTitle.trim();
    const body = broadcastBody.trim();
    if (!title || !body) {
      toast.error("Title and body are required.");
      return;
    }
    setBroadcastSending(true);
    try {
      const payload = {
        kind: broadcastKind,
        title,
        body,
        audience:
          broadcastAudience === "selected" ? "selected" : "all_employees",
      };
      if (broadcastAudience === "selected") {
        const ids = broadcastIds
          .split(/[\s,;]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (!ids.length) {
          toast.error("Enter at least one employee user id.");
          setBroadcastSending(false);
          return;
        }
        payload.userIds = ids;
      }
      const res = await api.post("/hr/broadcast-notifications", payload);
      toast.success(res.data?.message || "Sent.");
      setBroadcastTitle("");
      setBroadcastBody("");
      setBroadcastIds("");
      refreshSummary();
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Broadcast failed."
      );
    } finally {
      setBroadcastSending(false);
    }
  };

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:max-w-4xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Notifications</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Updates from HR appear here. This list refreshes automatically in the background.
          </p>
        </header>

        {user.role === "hr" ? (
          <section className="mb-10 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Send to employees</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
              Training updates and announcements create in-app notifications for
              every selected employee.
            </p>
            <form onSubmit={sendBroadcast} className="mt-5 space-y-4">
              <div className="flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="bk"
                    checked={broadcastKind === "hr_announcement"}
                    onChange={() => setBroadcastKind("hr_announcement")}
                  />
                  HR announcement
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="bk"
                    checked={broadcastKind === "training_update"}
                    onChange={() => setBroadcastKind("training_update")}
                  />
                  Training update
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Title</label>
                <input
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="e.g. New LMS module available"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Body</label>
                <textarea
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Details for employees…"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Audience</label>
                <select
                  value={broadcastAudience}
                  onChange={(e) => setBroadcastAudience(e.target.value)}
                  className="mt-1 w-full max-w-md rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="all_employees">All employees</option>
                  <option value="selected">Selected user IDs</option>
                </select>
              </div>
              {broadcastAudience === "selected" ? (
                <div>
                  <label className="text-xs font-medium text-slate-500">
                    Employee user IDs (comma or space separated)
                  </label>
                  <textarea
                    value={broadcastIds}
                    onChange={(e) => setBroadcastIds(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="MongoDB user ids from the directory"
                  />
                </div>
              ) : null}
              <button
                type="submit"
                disabled={broadcastSending}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {broadcastSending ? "Sending…" : "Send notifications"}
              </button>
            </form>
          </section>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleMarkAll}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Mark all read
          </button>
        </div>

        {loading ? (
          <HrSpinner label="Loading notifications…" />
        ) : items.length === 0 ? (
          <HrEmptyState
            title="No notifications yet"
            description="When HR updates your profile, documents, or sends an announcement, it will show up here."
          />
        ) : (
          <ul className="space-y-3">
            {items.map((n) => (
              <li key={n._id}>
                <button
                  type="button"
                  onClick={() => onRowOpen(n)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    n.read
                      ? "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-800/80"
                      : "border-indigo-200/80 bg-indigo-50/90 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!n.read ? (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                    ) : (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-transparent" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                        {notificationTypeLabel(n.type)}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {n.title}
                      </p>
                      {n.body ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">
                          {n.body}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleString()
                          : ""}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {hasMore ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        ) : null}
    </div>
  );
};

export default NotificationsPage;
