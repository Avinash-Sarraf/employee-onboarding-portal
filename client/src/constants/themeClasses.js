import { cn } from "../utils/cn";

/** Shared surface + form tokens for light/dark (Tailwind `dark:`) */

export const inputBase =
  "w-full rounded-xl border px-3 py-2.5 text-sm shadow-sm outline-none transition " +
  "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 " +
  "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 " +
  "dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 " +
  "dark:focus:border-indigo-400 dark:focus:ring-indigo-400/25 " +
  "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 " +
  "dark:disabled:bg-slate-800 dark:disabled:text-slate-400";

export function inputClass(error = false) {
  return cn(
    inputBase,
    error &&
      "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500 dark:focus:border-rose-400"
  );
}

export const selectClass = inputBase;

export const labelClass =
  "text-sm font-medium text-slate-700 dark:text-slate-200";

export const hintClass = "text-xs text-slate-500 dark:text-slate-400";

export const mutedClass = "text-sm text-slate-600 dark:text-slate-400";

export const headingClass = "text-lg font-semibold text-slate-900 dark:text-white";

export const subheadingClass =
  "text-sm font-semibold text-slate-900 dark:text-slate-100";

export const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80";

export const cardPadClass = cn(cardClass, "p-6");

export const cardHeaderClass =
  "border-b border-slate-200 px-6 py-5 dark:border-slate-800";

export const tableWrapClass =
  "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/60";

export const tableHeadClass =
  "border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300";

export const tableBodyClass =
  "divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900/40";

export const tableRowHoverClass =
  "transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50";

export const btnPrimaryClass =
  "rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400";

export const btnSecondaryClass =
  "rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

export const fileInputClass =
  "mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 " +
  "file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white " +
  "dark:text-slate-300 dark:file:bg-indigo-600";

/** HR dashboard surfaces — readable in both themes */
export const hrPanelClass =
  "rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/50";

export const hrTableWrapClass =
  "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900/70";

export const hrTableHeadClass =
  "border-b border-slate-200 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

export const hrTableBodyClass =
  "divide-y divide-slate-100 dark:divide-slate-800";

export const hrPageTitleClass =
  "text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl";

export const hrPageSubtitleClass =
  "mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400 sm:text-base";

export const hrEyebrowClass =
  "text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400";

/** Responsive page shell */
export const pageContainerClass =
  "mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:py-10";

export const pageHeaderClass =
  "text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl";

export const pageSubtitleClass =
  "mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400 sm:text-base";

export const transitionThemeClass = "transition-colors duration-200 ease-out";
