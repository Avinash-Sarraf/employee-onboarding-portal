import React from "react";
import { Filter, RotateCcw } from "lucide-react";
import { ONBOARDING_STATE_OPTIONS } from "../../constants/hrOnboarding";
import {
  hrPanelClass,
  inputClass,
  labelClass,
  btnSecondaryClass,
  subheadingClass,
  mutedClass,
} from "../../constants/themeClasses";
import { cn } from "../../utils/cn";

const STATUS_OPTIONS = [
  { value: "all", label: "All verification" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const filterInputClass = cn(inputClass(), "mt-1");

export function HrFilterPanel({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterStatus,
  filterDepartment,
  onFilterDepartment,
  departmentOptions,
  filterEmail,
  onFilterEmail,
  filterOnboardingState,
  onFilterOnboardingState,
  onReset,
  resultCount,
  totalCount,
}) {
  return (
    <div className={hrPanelClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <div>
            <p className={subheadingClass}>Filters</p>
            <p className={mutedClass}>
              Showing {resultCount} of {totalCount} employees
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className={cn(btnSecondaryClass, "inline-flex items-center justify-center gap-2 self-start text-xs lg:self-auto")}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset filters
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <div className="xl:col-span-2">
          <label className={cn(labelClass, "text-xs")}>Search</label>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Name, email, department…"
            className={filterInputClass}
          />
        </div>
        <div>
          <label className={cn(labelClass, "text-xs")}>Verification</label>
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatus(e.target.value)}
            className={filterInputClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={cn(labelClass, "text-xs")}>Department</label>
          <select
            value={filterDepartment}
            onChange={(e) => onFilterDepartment(e.target.value)}
            className={filterInputClass}
          >
            {departmentOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={cn(labelClass, "text-xs")}>Email contains</label>
          <input
            type="text"
            value={filterEmail}
            onChange={(e) => onFilterEmail(e.target.value)}
            placeholder="@company.com"
            className={filterInputClass}
          />
        </div>
        <div>
          <label className={cn(labelClass, "text-xs")}>Onboarding state</label>
          <select
            value={filterOnboardingState}
            onChange={(e) => onFilterOnboardingState(e.target.value)}
            className={filterInputClass}
          >
            <option value="all">All states</option>
            {ONBOARDING_STATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
