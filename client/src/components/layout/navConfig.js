import {
  LayoutDashboard,
  User,
  FileText,
  MessageSquare,
  Bell,
  GraduationCap,
  BookOpen,
  Inbox,
  UserRound,
} from "lucide-react";

export const PROJECT_NAME = "Onboarding Portal";

export const employeeNavLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/document", label: "Documents", icon: FileText },
  { to: "/onboarding", label: "Onboarding hub", icon: GraduationCap },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export const hrNavLinks = [
  { to: "/hr-dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/hr/onboarding-tools", label: "Learning", icon: BookOpen },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/notifications", label: "Inbox", icon: Inbox },
  { to: "/hr/profile", label: "My profile", icon: UserRound },
];

/** Public top nav — avoid duplicating Log in / Register (those live in the header actions). */
export const publicNavbarLinks = [{ to: "/", label: "Home" }];

/** Footer quick links (theme-aware marketing pages). */
export const publicFooterQuickLinks = [
  { to: "/", label: "Home" },
  { to: "/login", label: "Sign in" },
  { to: "/register", label: "Create account" },
];

export const publicFooterLegalLinks = [
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms & Conditions" },
];

/** @deprecated Use publicNavbarLinks + publicFooterQuickLinks */
export const publicFooterLinks = [
  { to: "/", label: "Home" },
  { to: "/login", label: "Log in" },
  { to: "/register", label: "Register" },
];

export function getDashboardPath(role) {
  return role === "hr" ? "/hr-dashboard" : "/dashboard";
}

export function getNavLinksForRole(role) {
  return role === "hr" ? hrNavLinks : employeeNavLinks;
}
