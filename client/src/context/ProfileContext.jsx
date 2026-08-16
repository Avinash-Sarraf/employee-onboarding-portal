import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../api/client";
import { getToken, getUser } from "../utils/auth";

const defaultOnboarding = () => ({
  completionPercent: 0,
  checklist: [
    { id: "personal", label: "Personal details", done: false },
    { id: "bank", label: "Bank details", done: false },
    { id: "academic", label: "Academic details", done: false },
    { id: "professional", label: "Professional details", done: false },
    { id: "skills", label: "Technical skills", done: false },
    { id: "experience", label: "Past experience", done: false },
    { id: "nda", label: "NDA agreement", done: false },
    { id: "documents", label: "Documents uploaded", done: false },
  ],
  isComplete: false,
  missingFieldCount: 0,
});

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [authTick, setAuthTick] = useState(0);

  useEffect(() => {
    const bump = () => setAuthTick((t) => t + 1);
    window.addEventListener("app:auth-changed", bump);
    return () => window.removeEventListener("app:auth-changed", bump);
  }, []);

  const user = getUser();
  const token = getToken();
  const userId = user?.role === "employee" ? user?.id : null;

  const [profile, setProfile] = useState(null);
  const [onboarding, setOnboarding] = useState(defaultOnboarding);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshProfile = useCallback(async () => {
    if (!userId || !token) {
      setProfile(null);
      setOnboarding(defaultOnboarding());
      setError(null);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/profile/me");
      const p = res.data?.data ?? null;
      const ob = res.data?.meta?.onboarding ?? defaultOnboarding();
      setProfile(p);
      setOnboarding(ob);
      return { profile: p, onboarding: ob };
    } catch (e) {
      if (e.response?.status === 404) {
        setProfile(null);
        setOnboarding(defaultOnboarding());
        setError(null);
        return { profile: null, onboarding: defaultOnboarding() };
      }
      const msg = e.response?.data?.message || "Could not load profile";
      setError(msg);
      setProfile(null);
      setOnboarding(defaultOnboarding());
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, token, authTick]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    const onProfile = () => refreshProfile();
    window.addEventListener("app:profile-changed", onProfile);
    return () => window.removeEventListener("app:profile-changed", onProfile);
  }, [refreshProfile]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") refreshProfile();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refreshProfile]);

  const value = useMemo(
    () => ({
      user,
      userId,
      profile,
      onboarding,
      loading,
      error,
      refreshProfile,
      setProfile,
      setOnboarding,
    }),
    [user, userId, profile, onboarding, loading, error, refreshProfile]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return ctx;
}

export function useOptionalProfile() {
  return useContext(ProfileContext);
}
