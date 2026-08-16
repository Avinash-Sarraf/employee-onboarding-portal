import React from "react";
import { cn } from "../../utils/cn";
import { inputClass } from "../../constants/themeClasses";

/** Themed native date picker — one implementation site-wide */
export function DateInput({
  className,
  error,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
}) {
  return (
    <div>
      <input
        type="date"
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        readOnly={readOnly}
        className={cn(inputClass(!!error), "date-input", className)}
      />
      {error ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}
    </div>
  );
}
