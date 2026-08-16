import React from "react";
import { cn } from "../../utils/cn";

export function Card({ className, children, padding = "md", ...rest }) {
  const pad =
    padding === "none"
      ? ""
      : padding === "sm"
      ? "p-4"
      : padding === "lg"
      ? "p-8"
      : "p-6";
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none",
        pad,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }) {
  return (
    <h3 className={cn("text-lg font-semibold tracking-tight text-slate-900 dark:text-white", className)}>
      {children}
    </h3>
  );
}
