import React, { useMemo, useState, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken, getUser } from "../../utils/auth";
import { AppNavbar } from "./AppNavbar";
import { AppFooter } from "./AppFooter";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "./SidebarContext";

export function AppShellLayout() {
  const location = useLocation();
  const [authTick, setAuthTick] = useState(0);

  useEffect(() => {
    const bump = () => setAuthTick((t) => t + 1);
    window.addEventListener("app:auth-changed", bump);
    return () => window.removeEventListener("app:auth-changed", bump);
  }, []);

  const user = useMemo(() => getUser(), [authTick]);
  const token = getToken();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isChat = location.pathname === "/messages";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
        <AppNavbar variant="app" />
        <div className="flex min-h-0 flex-1">
          <AppSidebar role={user.role} />
          <main
            className={
              isChat
                ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                : "min-w-0 flex-1 overflow-x-hidden"
            }
          >
            <Outlet />
          </main>
        </div>
        {!isChat ? <AppFooter variant="app" /> : null}
      </div>
    </SidebarProvider>
  );
}
