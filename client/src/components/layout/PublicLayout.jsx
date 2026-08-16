import React from "react";
import { Outlet } from "react-router-dom";
import { AppNavbar } from "./AppNavbar";
import { AppFooter } from "./AppFooter";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-main text-slate-900 dark:text-slate-100">
      <AppNavbar variant="public" />
      <main className="flex-1">
        <Outlet />
      </main>
      <AppFooter variant="public" />
    </div>
  );
}
