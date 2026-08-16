import React, { useEffect, useState } from "react";
import { cn } from "../../utils/cn";

/**
 * Shared split layout for Login / Register — responsive carousel + form panel.
 */
export function AuthSplitLayout({
  eyebrow,
  headline,
  intro,
  features = [],
  formTitle,
  formSubtitle,
  children,
  footerLink,
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!features.length) return undefined;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [features.length]);

  const active = features[activeIndex] || features[0];

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-center py-8 sm:py-12">
        <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-6 text-slate-900 dark:text-white">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {eyebrow}
              </p>
            ) : null}
            {headline ? (
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {headline}
              </h1>
            ) : null}
            {intro ? (
              <p className="text-base text-slate-600 dark:text-slate-300 sm:text-lg">
                {intro}
              </p>
            ) : null}
            {active ? (
              <div
                className={cn(
                  "rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-md",
                  "dark:border-white/10 dark:bg-slate-950/50",
                  "transition-all duration-300"
                )}
              >
                <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
                  {active.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {active.desc}
                </p>
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              "rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xl backdrop-blur-md",
              "dark:border-slate-700 dark:bg-slate-900/90 sm:p-8"
            )}
          >
            {formTitle ? (
              <h2 className="mb-2 text-center text-2xl font-bold text-slate-900 dark:text-white">
                {formTitle}
              </h2>
            ) : null}
            {formSubtitle ? (
              <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
                {formSubtitle}
              </p>
            ) : null}
            {children}
            {footerLink ? (
              <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                {footerLink}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
