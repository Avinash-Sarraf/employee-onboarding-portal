import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { cn } from "../../utils/cn";

/** Single-click light ↔ dark toggle (instant via ThemeProvider). */
export function ThemeToggle({ className }) {
  const { resolved, toggleResolved } = useTheme();
  const isDark = resolved === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggleResolved}
      title={label}
      aria-label={label}
      className={cn(
        "rounded-xl border border-slate-200/80 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
        className
      )}
    >
      {isDark ? (
        <Sun className="h-5 w-5" strokeWidth={1.75} />
      ) : (
        <Moon className="h-5 w-5" strokeWidth={1.75} />
      )}
    </button>
  );
}
