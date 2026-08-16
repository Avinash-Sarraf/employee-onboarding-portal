import React from "react";
import { cn } from "../../utils/cn";

const tones = {
  default:
    "bg-slate-100 text-slate-700 ring-slate-500/10 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-400/15",
  success:
    "bg-emerald-50 text-emerald-800 ring-emerald-600/15 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-500/25",
  warning:
    "bg-amber-50 text-amber-900 ring-amber-600/15 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-500/25",
  danger:
    "bg-rose-50 text-rose-800 ring-rose-600/15 dark:bg-rose-950/45 dark:text-rose-200 dark:ring-rose-500/25",
  info: "bg-sky-50 text-sky-900 ring-sky-600/15 dark:bg-sky-950/45 dark:text-sky-200 dark:ring-sky-500/25",
  neutral:
    "bg-slate-50 text-slate-600 ring-slate-500/10 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-500/20",
};

export function Badge({ tone = "default", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset",
        tones[tone] || tones.default,
        className
      )}
    >
      {children}
    </span>
  );
}
