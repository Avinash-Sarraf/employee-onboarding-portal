import React, { useEffect, useRef } from "react";
import { cn } from "../../utils/cn";

export function MessageThread({
  messages,
  currentUserId,
  loading,
  loadingOlder,
  onLoadOlder,
  canLoadOlder,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {canLoadOlder ? (
        <div className="shrink-0 border-b border-slate-200 p-2 text-center dark:border-slate-800">
          <button
            type="button"
            onClick={onLoadOlder}
            disabled={loadingOlder}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {loadingOlder ? "Loading older…" : "Load older messages"}
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/80 px-4 py-4 dark:bg-slate-950/50">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-indigo-400" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No messages yet. Say hello below.</p>
        ) : (
          messages.map((m) => {
            const mine = m.fromUserId === currentUserId;
            return (
              <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm",
                    mine
                      ? "bg-blue-600 text-white dark:bg-indigo-600"
                      : "border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  )}
                >
                  <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
