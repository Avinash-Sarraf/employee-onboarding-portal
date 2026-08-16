import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Globe, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { getUser } from "../../utils/auth";
import {
  PROJECT_NAME,
  employeeNavLinks,
  getDashboardPath,
  hrNavLinks,
  publicFooterQuickLinks,
  publicFooterLegalLinks,
  publicNavbarLinks,
} from "./navConfig";

const ORG_EMAIL = "support@company.com";
const ORG_PHONE = "+1 (555) 010-4200";
const ORG_ADDRESS = "100 Enterprise Way, Suite 400";

export function AppFooter({ variant = "public" }) {
  const user = useMemo(() => getUser(), []);
  const year = new Date().getFullYear();

  const quickLinks =
    variant === "app" && user
      ? user.role === "hr"
        ? hrNavLinks.slice(0, 5)
        : employeeNavLinks.slice(0, 5)
      : publicFooterQuickLinks;

  return (
    <footer className="mt-auto border-t border-slate-200/90 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <p className="text-base font-semibold text-slate-900 dark:text-white">{PROJECT_NAME}</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              A professional onboarding platform for new hires—profile, documents, training, and
              secure messaging in one place. Built for clarity from day one.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                aria-label="Website"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                aria-label="Community"
              >
                <MessageSquare className="h-4 w-4" />
              </a>
              <a
                href={`mailto:${ORG_EMAIL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Product
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {publicNavbarLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-slate-600 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quick links
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {quickLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-slate-600 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                  >
                    {label}
                  </Link>
                </li>
              ))}
              {variant === "app" && user ? (
                <li>
                  <Link
                    to={getDashboardPath(user.role)}
                    className="text-sm text-slate-600 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                  >
                    Dashboard
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Contact
            </p>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
                <span>{ORG_ADDRESS}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
                <a href={`tel:${ORG_PHONE.replace(/\D/g, "")}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  {ORG_PHONE}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
                <a href={`mailto:${ORG_EMAIL}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  {ORG_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-8 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-500">
            © {year} {PROJECT_NAME}. All rights reserved.
          </p>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {publicFooterLegalLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-slate-600 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
