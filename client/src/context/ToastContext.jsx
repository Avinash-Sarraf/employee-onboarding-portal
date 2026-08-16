import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

const ToastContext = createContext(null);

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (toast) => {
      const id = ++idSeq;
      const item = {
        id,
        tone: toast.tone || "info",
        title: toast.title || "",
        message: toast.message || "",
      };
      setToasts((list) => [...list, item]);
      const ms = toast.duration ?? 4200;
      const t = setTimeout(() => remove(id), ms);
      timers.current.set(id, t);
      return id;
    },
    [remove]
  );

  const value = useMemo(
    () => ({
      success: (message, title = "Success") =>
        push({ tone: "success", title, message }),
      error: (message, title = "Something went wrong") =>
        push({ tone: "error", title, message }),
      info: (message, title = "") => push({ tone: "info", title, message }),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur
              ${
                t.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-50"
                  : t.tone === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/90 dark:text-rose-50"
                  : "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-50"
              }`}
          >
            {t.title ? (
              <div className="font-semibold mb-0.5">{t.title}</div>
            ) : null}
            <div className="text-xs leading-snug opacity-95">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
