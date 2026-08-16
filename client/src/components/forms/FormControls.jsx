import React from "react";
import { cn } from "../../utils/cn";
import {
  inputClass,
  selectClass,
  labelClass,
  hintClass,
} from "../../constants/themeClasses";

export function FormField({ label, children, hint }) {
  return (
    <div>
      <div className="flex items-end justify-between">
        <label className={labelClass}>{label}</label>
        {hint ? <span className={hintClass}>{hint}</span> : null}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  disabled,
  readOnly,
  error,
  inputMode,
  className,
}) {
  return (
    <div>
      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        inputMode={inputMode}
        className={cn(inputClass(!!error), className)}
      />
      {error ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}
    </div>
  );
}

export function SelectInput({ value, onChange, onBlur, disabled, error, children, className }) {
  return (
    <div>
      <select
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className={cn(selectClass, error && "border-rose-500 dark:border-rose-500", className)}
      >
        {children}
      </select>
      {error ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}
    </div>
  );
}

export function Chip({ children, onRemove, disabled }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-200">
      {children}
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full px-2 py-0.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
          title="Remove"
        >
          x
        </button>
      )}
    </span>
  );
}
