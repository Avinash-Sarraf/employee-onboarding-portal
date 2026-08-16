import React from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "../../utils/cn";

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  loading,
  title = "Conversations",
  children,
  className,
  isHr,
}) {
  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col border-r border-slate-200 bg-white md:w-80 lg:w-96",
        "dark:border-slate-800 dark:bg-slate-900/80",
        className
      )}
    >
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </h2>
        {children}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-6 text-sm text-slate-500">Loading…</p>
        ) : conversations.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">No conversations yet.</p>
        ) : (
          <ul className="p-2">
            {conversations.map((c) => {
              const active = c.id === activeId;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      "mb-1 flex w-full flex-col rounded-xl px-3 py-2.5 text-left transition",
                      active
                        ? "bg-blue-50 ring-1 ring-blue-200 dark:bg-indigo-600/25 dark:ring-indigo-500/40"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                      <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                      <span className="truncate">
                        {isHr ? (c.employeeName || "Employee") : "HR Administrator"}
                      </span>
                    </span>
                    <span className="mt-0.5 truncate pl-6 text-xs text-slate-500">
                      {isHr ? (c.employeeEmail || "") : "hr@company.com"}
                    </span>
                    {c.lastMessagePreview ? (
                      <span className="mt-1 line-clamp-2 pl-6 text-xs text-slate-600 dark:text-slate-400">
                        {c.lastMessagePreview}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
