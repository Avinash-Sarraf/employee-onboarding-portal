import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";
import api from "../api/client";
import { useToast } from "../context/ToastContext";
import { ConversationSidebar } from "../components/chat/ConversationSidebar";
import { MessageThread } from "../components/chat/MessageThread";
import { MessageComposer } from "../components/chat/MessageComposer";
import { getApiErrorMessage } from "../utils/apiError";
import { cn } from "../utils/cn";
import { ArrowLeft } from "lucide-react";
import { getNotificationSocket } from "../realtime/socket";

const POLL_MS = 4000;
const PAGE_SIZE = 50;

function mergeByTime(a, b) {
  const map = new Map();
  [...a, ...b].forEach((m) => map.set(m._id, m));
  return Array.from(map.values()).sort(
    (x, y) => new Date(x.createdAt) - new Date(y.createdAt)
  );
}

function sortConversationsByActivity(list) {
  return [...list].sort(
    (a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)
  );
}

const ChatPage = () => {
  const user = getUser();
  const userId = user?.id || null;
  const navigate = useNavigate();
  const toast = useToast();
  const isHr = user?.role === "hr";

  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [pickEmployee, setPickEmployee] = useState("");

  const activeIdRef = useRef(null);
  const lastMsgCreatedRef = useRef(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    lastMsgCreatedRef.current = last?.createdAt || null;
  }, [messages]);

  const loadConversations = useCallback(async () => {
    setConvLoading(true);
    try {
      const res = await api.get("/chat/conversations");
      const list = res.data?.data ?? [];
      setConversations(list);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not load conversations."));
    } finally {
      setConvLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!userId) return;
    loadConversations();
  }, [userId, loadConversations]);

  useEffect(() => {
    if (!userId || !isHr) return;
    (async () => {
      try {
        const res = await api.get("/profile");
        const list = res.data?.data ?? [];
        setEmployees(
          list.map((p) => ({
            id: p.userId,
            label: `${p.personal?.fullName || "Employee"} (${p.personal?.email || p.userId})`,
          }))
        );
      } catch {
        setEmployees([]);
      }
    })();
  }, [userId, isHr]);

  useEffect(() => {
    if (convLoading || isHr || !conversations.length || activeId) return;
    setActiveId(conversations[0].id);
  }, [convLoading, conversations, activeId, isHr]);

  const upsertConversation = useCallback((row) => {
    if (!row?.id) return;
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === row.id);
      if (idx < 0) return sortConversationsByActivity([row, ...prev]);
      const next = [...prev];
      next[idx] = { ...next[idx], ...row };
      return sortConversationsByActivity(next);
    });
  }, []);

  const reloadThread = useCallback(
    async (conversationId, { withSpinner } = { withSpinner: true }) => {
      if (!conversationId) return;
      if (withSpinner) setMsgLoading(true);
      try {
        const res = await api.get(
          `/chat/conversations/${conversationId}/messages`,
          { params: { limit: PAGE_SIZE } }
        );
        const data = res.data?.data ?? [];
        setMessages(data);
        setHasOlder(data.length >= PAGE_SIZE);
      } catch (e) {
        toast.error(
          e.response?.data?.message || e.message || "Could not load messages."
        );
      } finally {
        if (withSpinner) setMsgLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      setHasOlder(false);
      return;
    }
    reloadThread(activeId, { withSpinner: true });
  }, [activeId, reloadThread]);

  const pollNew = useCallback(async () => {
    const id = activeIdRef.current;
    if (!id || msgLoading) return;
    const since = lastMsgCreatedRef.current;
    try {
      if (since) {
        const res = await api.get(`/chat/conversations/${id}/messages`, {
          params: {
            since: new Date(since).toISOString(),
            limit: 100,
          },
        });
        const incoming = res.data?.data ?? [];
        if (incoming.length) {
          setMessages((prev) => mergeByTime(prev, incoming));
          loadConversations();
        }
      } else {
        const res = await api.get(`/chat/conversations/${id}/messages`, {
          params: { limit: PAGE_SIZE },
        });
        const data = res.data?.data ?? [];
        if (data.length) {
          setMessages(data);
          setHasOlder(data.length >= PAGE_SIZE);
          loadConversations();
        }
      }
    } catch {
      /* silent */
    }
  }, [msgLoading, loadConversations]);

  useEffect(() => {
    if (!userId || !activeId) return undefined;
    const id = window.setInterval(pollNew, POLL_MS);
    return () => window.clearInterval(id);
  }, [userId, activeId, pollNew]);

  useEffect(() => {
    if (!userId) return undefined;
    const socket = getNotificationSocket();
    if (!socket) return undefined;

    const onChatMessage = (payload) => {
      const message = payload?.message;
      const conversation = payload?.conversation;
      const conversationId =
        conversation?.id || message?.conversationId || null;
      if (!conversationId || !message?._id) return;

      if (conversation?.id) {
        upsertConversation(conversation);
      } else {
        void loadConversations();
      }

      if (!activeIdRef.current && !isHr) {
        setActiveId(conversationId);
      }

      if (activeIdRef.current === conversationId) {
        setMessages((prev) => mergeByTime(prev, [message]));
      }
    };

    socket.on("chat:message", onChatMessage);
    return () => {
      socket.off("chat:message", onChatMessage);
    };
  }, [userId, isHr, loadConversations, upsertConversation]);

  const loadOlder = async () => {
    if (!activeId || !messages.length || loadingOlder) return;
    const first = messages[0];
    setLoadingOlder(true);
    try {
      const res = await api.get(`/chat/conversations/${activeId}/messages`, {
        params: {
          before: new Date(first.createdAt).toISOString(),
          limit: PAGE_SIZE,
        },
      });
      const older = res.data?.data ?? [];
      setMessages((prev) => mergeByTime(older, prev));
      setHasOlder(older.length >= PAGE_SIZE);
    } catch (e) {
      toast.error(
        e.response?.data?.message || e.message || "Could not load older."
      );
    } finally {
      setLoadingOlder(false);
    }
  };

  const openWithEmployee = async (employeeUserId) => {
    if (!employeeUserId) return;
    try {
      const res = await api.post("/chat/conversations/ensure", {
        employeeUserId,
      });
      const row = res.data?.data;
      if (!row?.id) throw new Error("empty");
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === row.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...row };
          return copy;
        }
        return [{ ...row }, ...prev];
      });
      setActiveId(row.id);
      setPickEmployee("");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not open chat."));
    }
  };

  const send = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !activeId) return;
    setSending(true);
    try {
      await api.post(`/chat/conversations/${activeId}/messages`, { body });
      setDraft("");
      await reloadThread(activeId, { withSpinner: false });
      await loadConversations();
      window.dispatchEvent(new Event("app:notifications-changed"));
      toast.success("Sent.");
    } catch (err) {
      toast.error(err.userMessage || getApiErrorMessage(err, "Send failed."));
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            Messages
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            {isHr
              ? "Realtime chat is live: pick a thread or start one with an employee."
              : "Your HR thread updates in realtime while this page is open."}
          </p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <ConversationSidebar
            conversations={conversations}
            activeId={activeId}
            onSelect={setActiveId}
            loading={convLoading}
            title={isHr ? "Employee threads" : "Your thread"}
            className={cn(activeId ? "hidden md:flex" : "flex")}
          >
            {isHr ? (
              <div className="mt-3 space-y-2">
                <label className="text-xs text-slate-500 dark:text-slate-500">
                  Message an employee
                </label>
                <select
                  value={pickEmployee}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPickEmployee(v);
                    if (v) void openWithEmployee(v);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-500/40"
                >
                  <option value="">Choose employee…</option>
                  {employees.map((em) => (
                    <option key={em.id} value={em.id}>
                      {em.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </ConversationSidebar>

          <section
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col",
              !activeId && "hidden md:flex"
            )}
          >
            <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60 sm:px-6">
              {activeConv ? (
                <>
                  <div className="flex items-center gap-2 md:hidden">
                    <button
                      type="button"
                      onClick={() => setActiveId(null)}
                      className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {activeConv.employeeName}
                    </p>
                  </div>
                  <p className="hidden text-sm font-semibold text-slate-900 dark:text-white md:block">
                    {activeConv.employeeName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {activeConv.employeeEmail}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isHr
                    ? "Select a thread or choose an employee above."
                    : "Loading your conversation…"}
                </p>
              )}
            </div>

            <MessageThread
              messages={messages}
              currentUserId={user.id}
              loading={msgLoading}
              loadingOlder={loadingOlder}
              onLoadOlder={loadOlder}
              canLoadOlder={hasOlder && !msgLoading && messages.length > 0}
            />

            <MessageComposer
              value={draft}
              onChange={setDraft}
              onSubmit={send}
              sending={sending}
              disabled={!activeId}
            />
          </section>
        </div>
    </div>
  );
};

export default ChatPage;
