import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Menu, User } from "lucide-react";
import { clearAuth, getUser } from "../../utils/auth";
import { NotificationBell } from "../NotificationBell";
import { ThemeToggle } from "../ui/ThemeToggle";
import { getDashboardPath, PROJECT_NAME, publicNavbarLinks } from "./navConfig";
import { useOptionalSidebar } from "./SidebarContext";

const publicLinks = publicNavbarLinks;

export function AppNavbar({ variant = "app" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebar = useOptionalSidebar();
  const [authTick, setAuthTick] = useState(0);
  const [mobilePublicOpen, setMobilePublicOpen] = useState(false);

  const user = useMemo(() => getUser(), [authTick]);
  const isPublic = variant === "public";
  const isApp = variant === "app";

  useEffect(() => {
    const bump = () => setAuthTick((t) => t + 1);
    window.addEventListener("app:auth-changed", bump);
    return () => window.removeEventListener("app:auth-changed", bump);
  }, []);

  useEffect(() => {
    if (!isPublic) return;
    document.body.style.overflow = mobilePublicOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobilePublicOpen, isPublic]);

  const handleLogout = () => {
    clearAuth();
    window.dispatchEvent(new Event("app:auth-changed"));
    navigate("/login");
  };

  const goBack = () => {
    const homePaths = ["/", "/login", "/register"];
    const dashPath = user ? getDashboardPath(user.role) : "/";
    if (homePaths.includes(location.pathname)) {
      navigate("/");
      return;
    }
    if (location.pathname === dashPath) {
      navigate(isPublic ? "/" : dashPath);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(user ? dashPath : "/");
    }
  };

  const profilePath = user ? getDashboardPath(user.role) : "/login";
  const showBack =
    isPublic ||
    location.pathname !== (user ? getDashboardPath(user.role) : "/dashboard");

  const openSidebar = () => {
    if (sidebar) sidebar.openMobile();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {showBack ? (
            <button
              type="button"
              onClick={goBack}
              className="shrink-0 rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          ) : null}

          {isApp ? (
            <button
              type="button"
              className="shrink-0 rounded-xl border border-slate-200 p-2 text-slate-700 lg:hidden dark:border-slate-700 dark:text-slate-200"
              aria-label="Open navigation menu"
              onClick={openSidebar}
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              className="shrink-0 rounded-xl border border-slate-200 p-2 text-slate-700 md:hidden dark:border-slate-700 dark:text-slate-200"
              aria-label="Open menu"
              onClick={() => setMobilePublicOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link
            to={isPublic ? "/" : profilePath}
            className="flex min-w-0 items-center gap-2 sm:gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-xs font-bold text-white shadow-md sm:h-10 sm:w-10">
              {user?.role === "hr" ? "HR" : "OB"}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
                {PROJECT_NAME}
              </p>
              {isApp && user ? (
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user.role === "hr" ? "HR workspace" : "Employee workspace"}
                </p>
              ) : (
                <p className="hidden truncate text-xs text-slate-500 sm:block dark:text-slate-400">
                  Enterprise onboarding
                </p>
              )}
            </div>
          </Link>
        </div>

        {isPublic ? (
          <nav className="hidden items-center gap-1 md:flex">
            {publicLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {isApp && user ? (
            <>
              <NotificationBell />
              <button
                type="button"
                onClick={() => navigate(profilePath)}
                className="hidden max-w-[12rem] items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5 text-left transition hover:bg-slate-50 sm:flex md:max-w-[14rem] lg:max-w-xs dark:border-slate-700 dark:hover:bg-slate-800"
                title="Go to dashboard"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  <User className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {user.name || "User"}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {user.email}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate(profilePath)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 sm:hidden dark:bg-indigo-950 dark:text-indigo-300"
                aria-label="Go to dashboard"
              >
                <User className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:inline-flex dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Log out</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-rose-600 px-2.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500 sm:hidden"
              >
                Exit
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/register"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:inline dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Create account
              </Link>
              <Link
                to="/login"
                className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>

      {isPublic && mobilePublicOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMobilePublicOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(18rem,88vw)] flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="border-b border-slate-200 p-4 dark:border-slate-800">
              <p className="font-semibold text-slate-900 dark:text-white">Menu</p>
            </div>
            <nav className="flex flex-col gap-1 p-3">
              {publicNavbarLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobilePublicOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {label}
                </Link>
              ))}
              <Link
                to="/register"
                onClick={() => setMobilePublicOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Create account
              </Link>
              <Link
                to="/login"
                onClick={() => setMobilePublicOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-slate-800"
              >
                Sign in
              </Link>
              <div className="mt-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
