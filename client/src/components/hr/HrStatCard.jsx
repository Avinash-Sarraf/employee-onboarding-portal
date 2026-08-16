import React from "react";

export function HrStatCard({
  title,
  value,
  subtitle,
  tone = "slate",
  icon,
}) {
  const tones = {
    slate:
      "border-slate-200 bg-gradient-to-br from-slate-50 to-white dark:border-slate-700/80 dark:from-slate-800 dark:to-slate-900",
    amber:
      "border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/80 dark:border-amber-500/30 dark:from-amber-600/90 dark:to-amber-900",
    emerald:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/80 dark:border-emerald-500/30 dark:from-emerald-600/90 dark:to-emerald-900",
    rose:
      "border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100/80 dark:border-rose-500/30 dark:from-rose-600/90 dark:to-rose-900",
    indigo:
      "border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/80 dark:border-indigo-400/30 dark:from-indigo-600/90 dark:to-indigo-950",
    cyan:
      "border-cyan-200 bg-gradient-to-br from-cyan-50 to-slate-50 dark:border-cyan-400/25 dark:from-cyan-600/80 dark:to-slate-900",
  };
  const cls = tones[tone] || tones.slate;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-md ${cls}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-white/60">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {value}
          </p>
          {subtitle ? (
            <p className="mt-1 text-xs text-slate-600 dark:text-white/55">
              {subtitle}
            </p>
          ) : null}
        </div>
        {icon ? (
          <div className="rounded-xl bg-slate-900/5 p-2 text-slate-700 dark:bg-white/10 dark:text-white/90">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
