import React from "react";
import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "../../utils/cn";
import { getNavLinksForRole, PROJECT_NAME } from "./navConfig";
import { useSidebar } from "./SidebarContext";

const linkClass = ({ isActive }) =>
  cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
    isActive
      ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-500"
      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
  );

export function AppSidebar({ role }) {
  const { mobileOpen, closeMobile, collapsed, toggleCollapsed } = useSidebar();
  const links = getNavLinksForRole(role);
  const roleLabel = role === "hr" ? "HR console" : "Employee workspace";
  const labelsVisible = !collapsed || mobileOpen;

  const sidebarContent = (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-3 dark:border-slate-800">
        {labelsVisible ? (
          <div className="min-w-0 px-1">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {roleLabel}
            </p>
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{PROJECT_NAME}</p>
          </div>
        ) : (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
            {role === "hr" ? "HR" : "OB"}
          </div>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:block dark:text-slate-300 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={closeMobile}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={linkClass}
            onClick={closeMobile}
            title={collapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            {labelsVisible ? <span className="truncate transition-opacity duration-200">{label}</span> : null}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out lg:flex dark:border-slate-800 dark:bg-slate-950",
          collapsed ? "w-[4.5rem]" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            aria-label="Close menu overlay"
            onClick={closeMobile}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(18rem,88vw)] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out animate-in slide-in-from-left dark:border-slate-800 dark:bg-slate-950">
            {sidebarContent}
          </aside>
        </div>
      ) : null}
    </>
  );
}
