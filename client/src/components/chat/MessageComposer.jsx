import React from "react";
import { Send } from "lucide-react";
import { cn } from "../../utils/cn";

export function MessageComposer({
  value,
  onChange,
  onSubmit,
  sending,
  disabled,
  placeholder = "Write a message…",
}) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4",
        "dark:border-slate-800 dark:bg-slate-900/90"
      )}
    >
      <div className="flex gap-2">
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || sending}
          placeholder={placeholder}
          className={cn(
            "min-h-[44px] flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2",
            "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-blue-200",
            "dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:ring-indigo-500/40"
          )}
        />
        <button
          type="submit"
          disabled={disabled || sending || !value.trim()}
          className={cn(
            "flex shrink-0 items-center justify-center self-end rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-40",
            "bg-blue-600 hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          )}
        >
          {sending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
    </form>
  );
}
