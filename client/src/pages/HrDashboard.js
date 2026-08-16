import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useToast } from "../context/ToastContext";
import { HrStatCard } from "../components/hr/HrStatCard";
import { HrSpinner } from "../components/hr/HrSpinner";
import { HrEmptyState } from "../components/hr/HrEmptyState";
import { HrFilterPanel } from "../components/hr/HrFilterPanel";
import { EmployeeDetailModal } from "../components/hr/EmployeeDetailModal";
import { computeHrDashboardStats } from "../utils/hrStats";
import { onboardingStateLabel } from "../constants/hrOnboarding";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  FileWarning,
  ChevronRight,
} from "lucide-react";
import {
  hrEyebrowClass,
  hrPageTitleClass,
  hrPageSubtitleClass,
  hrTableWrapClass,
  hrTableHeadClass,
  hrTableBodyClass,
  tableRowHoverClass,
  btnPrimaryClass,
  btnSecondaryClass,
} from "../constants/themeClasses";

const HrDashboard = () => {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterOnboardingState, setFilterOnboardingState] = useState("all");

  const [detailUserId, setDetailUserId] = useState(null);
  const [detailSummary, setDetailSummary] = useState(null);

  const apiOrigin =
    process.env.REACT_APP_API_ORIGIN || "http://localhost:5000";

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.get("/profile");
      const list = res.data?.data ?? [];
      const formatted = list.map((emp) => ({
        id: emp.userId,
        name: emp.personal?.fullName || "N/A",
        email: emp.personal?.email || "N/A",
        department: emp.professional?.department || "N/A",
        status: emp.hr?.status || "pending",
        onboardingState: emp.hr?.onboardingState || "awaiting_profile",
        documents: emp.documents || [],
        profile: emp,
        hr: emp.hr,
      }));
      setEmployees(formatted);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message || err.message || "Could not load data.";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const stats = useMemo(
    () => computeHrDashboardStats(employees),
    [employees]
  );

  const departmentOptions = useMemo(() => {
    const set = new Set();
    employees.forEach((e) => set.add(e.department || "N/A"));
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [
      { value: "all", label: "All departments" },
      ...sorted.map((d) => ({
        value: d === "N/A" ? "__na__" : d,
        label: d === "N/A" ? "Unassigned" : d,
      })),
    ];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const em = filterEmail.trim().toLowerCase();

    return employees.filter((emp) => {
      if (filterStatus !== "all" && emp.status !== filterStatus) return false;

      if (filterDepartment !== "all") {
        if (filterDepartment === "__na__") {
          if (emp.department !== "N/A") return false;
        } else if (emp.department !== filterDepartment) return false;
      }

      if (em && !emp.email.toLowerCase().includes(em)) return false;

      if (
        filterOnboardingState !== "all" &&
        emp.onboardingState !== filterOnboardingState
      ) {
        return false;
      }

      if (!q) return true;
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        onboardingStateLabel(emp.onboardingState).toLowerCase().includes(q)
      );
    });
  }, [
    employees,
    searchTerm,
    filterStatus,
    filterDepartment,
    filterEmail,
    filterOnboardingState,
  ]);

  const resetFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterDepartment("all");
    setFilterEmail("");
    setFilterOnboardingState("all");
  };

  const openEmployee = (emp) => {
    setDetailUserId(emp.id);
    setDetailSummary({
      name: emp.name,
      email: emp.email,
      department: emp.department,
    });
  };

  const topPipeline = useMemo(() => {
    const entries = Object.entries(stats.onboardingByState || {});
    entries.sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 4);
  }, [stats.onboardingByState]);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <header className="mb-10 border-b border-slate-200 pb-8 dark:border-slate-800">
          <p className={hrEyebrowClass}>HR console</p>
          <h1 className={`mt-2 ${hrPageTitleClass}`}>Workforce onboarding</h1>
          <p className={hrPageSubtitleClass}>
            Monitor verification decisions, document queues, and pipeline
            states. Open an employee to manage documents, joining instructions,
            and profile approval in one place.{" "}
            <Link
              to="/hr/onboarding-tools"
              className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              Training & announcements →
            </Link>
          </p>
        </header>

        {loading && employees.length === 0 ? (
          <HrSpinner label="Loading employee directory…" />
        ) : null}

        {loadError && !employees.length ? (
          <HrEmptyState
            title="Could not load employees"
            description={loadError}
            action={
              <button
                type="button"
                onClick={() => fetchEmployees()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Retry
              </button>
            }
          />
        ) : null}

        {!loading || employees.length > 0 ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <HrStatCard
                title="Total employees"
                value={stats.total}
                subtitle="Profiles in directory"
                tone="indigo"
                icon={<Users className="h-5 w-5" />}
              />
              <HrStatCard
                title="Pending verification"
                value={stats.verification.pending}
                subtitle="HR decision: pending"
                tone="amber"
                icon={<Clock className="h-5 w-5" />}
              />
              <HrStatCard
                title="Approved"
                value={stats.verification.verified}
                subtitle="Onboarding cleared"
                tone="emerald"
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
              <HrStatCard
                title="Rejected"
                value={stats.verification.rejected}
                subtitle="Needs follow-up"
                tone="rose"
                icon={<XCircle className="h-5 w-5" />}
              />
              <HrStatCard
                title="Document queue"
                value={stats.employeesWithPendingDocs}
                subtitle="Has ≥1 file pending review"
                tone="cyan"
                icon={<FileWarning className="h-5 w-5" />}
              />
              <HrStatCard
                title="Pipeline snapshot"
                value={topPipeline.length ? topPipeline[0][1] : 0}
                subtitle={
                  topPipeline.length
                    ? onboardingStateLabel(topPipeline[0][0])
                    : "No data"
                }
                tone="slate"
              />
            </section>

            {topPipeline.length > 1 ? (
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-500">
                  Onboarding mix:
                </span>
                {topPipeline.map(([state, n]) => (
                  <span
                    key={state}
                    className="rounded-full bg-slate-100 px-2 py-1 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
                  >
                    {onboardingStateLabel(state)} ({n})
                  </span>
                ))}
              </div>
            ) : null}

            <section className="mt-10 space-y-5">
              <HrFilterPanel
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterStatus={filterStatus}
                onFilterStatus={setFilterStatus}
                filterDepartment={filterDepartment}
                onFilterDepartment={setFilterDepartment}
                departmentOptions={departmentOptions}
                filterEmail={filterEmail}
                onFilterEmail={setFilterEmail}
                filterOnboardingState={filterOnboardingState}
                onFilterOnboardingState={setFilterOnboardingState}
                onReset={resetFilters}
                resultCount={filteredEmployees.length}
                totalCount={employees.length}
              />

              <div className={hrTableWrapClass}>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className={hrTableHeadClass}>
                      <tr>
                        <th className="px-4 py-4 font-medium sm:px-6">Employee</th>
                        <th className="px-4 py-4 font-medium sm:px-6">Department</th>
                        <th className="px-4 py-4 font-medium sm:px-6">Verification</th>
                        <th className="px-4 py-4 font-medium sm:px-6">Pipeline</th>
                        <th className="px-4 py-4 font-medium sm:px-6">Docs</th>
                        <th className="px-4 py-4 font-medium sm:px-6 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className={hrTableBodyClass}>
                      {filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-16 sm:px-6">
                            <HrEmptyState
                              title="No employees match"
                              description="Try widening search or resetting filters."
                              action={
                                <button
                                  type="button"
                                  onClick={resetFilters}
                                  className={btnSecondaryClass}
                                >
                                  Reset filters
                                </button>
                              }
                            />
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map((emp) => {
                          const docs = emp.documents || [];
                          const verified = docs.filter(
                            (d) => d.status === "verified"
                          ).length;
                          const pendingDocs = docs.filter(
                            (d) => d.status === "pending"
                          ).length;
                          const pct = docs.length
                            ? Math.round((verified / docs.length) * 100)
                            : 0;

                          return (
                            <tr
                              key={emp.id}
                              className={tableRowHoverClass}
                            >
                              <td className="px-4 py-4 sm:px-6">
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {emp.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {emp.email}
                                </p>
                              </td>
                              <td className="px-4 py-4 sm:px-6">
                                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                  {emp.department}
                                </span>
                              </td>
                              <td className="px-4 py-4 sm:px-6">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                    emp.status === "verified"
                                      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30"
                                      : emp.status === "rejected"
                                      ? "bg-rose-100 text-rose-800 ring-1 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30"
                                      : "bg-amber-100 text-amber-900 ring-1 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/30"
                                  }`}
                                >
                                  {emp.status}
                                </span>
                              </td>
                              <td className="max-w-[200px] px-4 py-4 text-xs text-slate-600 dark:text-slate-400 sm:px-6">
                                {onboardingStateLabel(emp.onboardingState)}
                              </td>
                              <td className="px-4 py-4 sm:px-6">
                                <div className="flex flex-col gap-1">
                                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                    <div
                                      className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {verified}/{docs.length || 0} verified
                                    {pendingDocs ? ` · ${pendingDocs} pending` : ""}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right sm:px-6">
                                <button
                                  type="button"
                                  onClick={() => openEmployee(emp)}
                                  className={`inline-flex items-center gap-1 ${btnPrimaryClass} px-3 py-2 text-xs sm:text-sm`}
                                >
                                  Manage
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        ) : null}
      <EmployeeDetailModal
        open={Boolean(detailUserId)}
        userId={detailUserId}
        summary={detailSummary}
        apiOrigin={apiOrigin}
        onClose={() => {
          setDetailUserId(null);
          setDetailSummary(null);
        }}
        onRefresh={fetchEmployees}
      />
    </div>
  );
};

export default HrDashboard;
