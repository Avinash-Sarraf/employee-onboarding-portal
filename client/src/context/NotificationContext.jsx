import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import api from "../api/client";
import { getToken, getUser } from "../utils/auth";
import { getApiErrorMessage } from "../utils/apiError";
import {
  getNotificationSocket,
  disconnectNotificationSocket,
} from "../realtime/socket";

const NotificationContext = createContext(null);

/** Fallback poll when socket is disconnected (ms) */
const POLL_MS = 90_000;

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  const mounted = useRef(true);
  const refreshInFlight = useRef(false);

  const user = getUser();
  const token = getToken();
  const canFetch = Boolean(user && token);

  const refresh = useCallback(async () => {
    if (!canFetch) {
      setUnreadCount(0);
      setRecent([]);
      setError(null);
      return;
    }
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const [countRes, listRes] = await Promise.all([
        api.get("/notifications/unread-count"),
        api.get("/notifications?limit=15"),
      ]);
      const c = countRes.data?.data?.count;
      if (mounted.current) {
        setUnreadCount(typeof c === "number" ? c : 0);
        const items = listRes.data?.data;
        setRecent(Array.isArray(items) ? items : []);
      }
    } catch (e) {
      if (mounted.current) {
        setError(getApiErrorMessage(e, "Could not load notifications."));
      }
    } finally {
      refreshInFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  }, [canFetch, tick]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener("app:auth-changed", bump);
    window.addEventListener("app:notifications-changed", bump);
    return () => {
      window.removeEventListener("app:auth-changed", bump);
      window.removeEventListener("app:notifications-changed", bump);
    };
  }, []);

  useEffect(() => {
    if (!canFetch) {
      disconnectNotificationSocket();
      return undefined;
    }

    const socket = getNotificationSocket();
    if (!socket) return undefined;

    const onNew = () => {
      window.dispatchEvent(new Event("app:notifications-changed"));
      refresh();
    };

    socket.on("notification:new", onNew);

    return () => {
      socket.off("notification:new", onNew);
    };
  }, [canFetch, refresh]);

  useEffect(() => {
    if (!canFetch) return undefined;
    const id = window.setInterval(() => {
      refresh();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [canFetch, refresh]);

  useEffect(() => {
    if (!canFetch) return undefined;
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [canFetch, refresh]);

  const markRead = useCallback(
    async (id) => {
      if (!id) return;
      try {
        await api.patch(`/notifications/${id}/read`);
        window.dispatchEvent(new Event("app:notifications-changed"));
        await refresh();
      } catch {
        /* ignore */
      }
    },
    [refresh]
  );

  const markAllRead = useCallback(async () => {
    try {
      await api.post("/notifications/read-all");
      window.dispatchEvent(new Event("app:notifications-changed"));
      await refresh();
    } catch {
      /* ignore */
    }
  }, [refresh]);

  const value = useMemo(
    () => ({
      unreadCount,
      recent,
      loading,
      error,
      refresh,
      markRead,
      markAllRead,
    }),
    [unreadCount, recent, loading, error, refresh, markRead, markAllRead]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
