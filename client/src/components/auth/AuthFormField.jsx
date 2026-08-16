import React from "react";
import { AlertCircle, Check } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Label + helper + validation feedback for auth forms (no overlap with password toggle).
 */
export function AuthFormField({
  id,
  label,
  hint,
  error,
  touched,
  valid,
  showValidFeedback = false,
  children,
  className,
}) {
  const showErr = Boolean(touched && error);
  const showOk = Boolean(showValidFeedback && touched && !error && valid);

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          {label}
        </label>
      ) : null}
      {children}
      {hint && !showErr ? (
        <p id={id ? `${id}-hint` : undefined} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
      {showErr ? (
        <p className="flex items-start gap-1.5 text-sm text-rose-600 dark:text-rose-400" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : null}
      {showOk ? (
        <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
          <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
          <span>Looks good</span>
        </p>
      ) : null}
    </div>
  );
}
