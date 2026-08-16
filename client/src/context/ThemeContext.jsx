import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { THEME_STORAGE_KEY } from "../constants/themeStorage";

const ThemeContext = createContext(null);

function readStoredPreference() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

function resolveMode(preference, systemIsDark) {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  return systemIsDark ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(() => readStoredPreference());
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemDark(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolved = useMemo(
    () => resolveMode(preference, systemDark),
    [preference, systemDark]
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved === "dark" ? "dark" : "light";
  }, [resolved]);

  const setPreference = useCallback((next) => {
    const v = next === "light" || next === "dark" || next === "system" ? next : "system";
    setPreferenceState(v);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleResolved = useCallback(() => {
    setPreference(resolved === "dark" ? "light" : "dark");
  }, [resolved, setPreference]);

  const value = useMemo(
    () => ({
      preference,
      resolved,
      setPreference,
      toggleResolved,
    }),
    [preference, resolved, setPreference, toggleResolved]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
