import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useToast } from "../context/ToastContext";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Megaphone,
  UserCircle2,
  GraduationCap,
  ClipboardList,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";

function formatDate(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

const statusTone = (s) => {
  if (s === "completed") return "text-emerald-300 bg-emerald-500/15 ring-emerald-500/25";
  if (s === "in_progress") return "text-sky-300 bg-sky-500/15 ring-sky-500/25";
  return "text-amber-200 bg-amber-500/10 ring-amber-500/20";
};

export default function EmployeeOnboardingPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [hub, setHub] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/onboarding/me");
      setHub(res.data?.data ?? null);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || "Load failed");
      setHub(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProgress = async (moduleId, payload) => {
    try {
      await api.patch(`/training/my-modules/${moduleId}/progress`, payload);
      toast.success("Progress saved");
      load();
      window.dispatchEvent(new Event("app:notifications-changed"));
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || "Save failed");
    }
  };

  const joining = hub?.joining;
  const trainings = hub?.trainings ?? [];
  const announcements = hub?.announcements ?? [];
  const summary = hub?.trainingSummary ?? { total: 0, completed: 0, inProgress: 0 };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Onboarding hub
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
              Your joining plan, assigned learning, and company announcements in one
              place.
            </p>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : null}
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-lg dark:border-white/10 dark:from-indigo-950/80 dark:to-slate-900 sm:p-8">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-300">
              <ClipboardList className="h-6 w-6" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Joining plan</h2>
            </div>
            <dl className="mt-6 space-y-5">
              <div className="flex gap-3 rounded-2xl bg-black/20 p-4 ring-1 ring-white/5">
                <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Joining date
                  </dt>
                  <dd className="mt-1 text-lg font-medium text-slate-900 dark:text-white">
                    {formatDate(joining?.assignedJoiningDate)}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3 rounded-2xl bg-black/20 p-4 ring-1 ring-white/5">
                <UserCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reporting manager
                  </dt>
                  <dd className="mt-1 text-lg font-medium text-slate-900 dark:text-white">
                    {joining?.reportingManager?.name || "—"}
                  </dd>
                  {joining?.reportingManager?.email ? (
                    <dd className="text-sm text-slate-400">
                      {joining.reportingManager.email}
                    </dd>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-3 rounded-2xl bg-black/20 p-4 ring-1 ring-white/5">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Office location
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-slate-100">
                    {joining?.officeLocation?.trim() || "—"}
                  </dd>
                </div>
              </div>
            </dl>
            {joining?.reportingInstructions?.trim() ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reporting instructions
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {joining.reportingInstructions}
                </p>
              </div>
            ) : null}
            {joining?.joiningInstructions?.trim() ? (
              <div className="mt-4 rounded-2xl border border-indigo-200/80 bg-indigo-50/80 p-4 dark:border-indigo-500/20 dark:bg-indigo-950/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300/90">
                  General instructions from HR
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-100">
                  {joining.joiningInstructions}
                </p>
              </div>
            ) : null}
            {!joining?.assignedJoiningDate &&
            !joining?.reportingManager &&
            !joining?.officeLocation?.trim() &&
            !joining?.reportingInstructions?.trim() &&
            !joining?.joiningInstructions?.trim() ? (
              <p className="mt-6 text-sm text-slate-500">
                HR has not published detailed joining fields yet. Check back after your
                offer is finalized.
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-slate-900/80 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-violet-600 dark:text-violet-300">
                <Megaphone className="h-6 w-6" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Announcements</h2>
              </div>
            </div>
            {!announcements.length ? (
              <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No active announcements right now.
              </p>
            ) : (
              <ul className="mt-6 space-y-4">
                {announcements.map((a) => (
                  <li
                    key={a._id}
                    className={`rounded-2xl border p-4 ${
                      a.pinned
                        ? "border-amber-500/30 bg-amber-950/20"
                        : "border-white/10 bg-slate-900/40"
                    }`}
                  >
                    {a.pinned ? (
                      <span className="text-xs font-semibold uppercase tracking-wide text-amber-300/90 dark:text-amber-200">
                        Pinned
                      </span>
                    ) : null}
                    <h3 className="mt-1 font-semibold text-slate-900 dark:text-white">{a.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                      {a.body}
                    </p>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(a.createdAt)}
                      {a.expiresAt ? ` · Expires ${formatDate(a.expiresAt)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-slate-900/80 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3 text-emerald-300">
              <GraduationCap className="h-7 w-7" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Training modules</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {summary.total} assigned · {summary.completed} completed ·{" "}
                  {summary.inProgress} in progress
                </p>
              </div>
            </div>
          </div>

          {!trainings.length ? (
            <p className="mt-8 text-center text-sm text-slate-500">
              No training modules assigned yet.
            </p>
          ) : (
            <ul className="mt-8 grid gap-5 md:grid-cols-2">
              {trainings.map((row) => (
                <li
                  key={row.assignmentId}
                  className="flex flex-col rounded-2xl border border-white/10 bg-slate-950/50 p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{row.module.title}</h3>
                      {row.module.estimatedMinutes ? (
                        <p className="mt-1 text-xs text-slate-500">
                          ~{row.module.estimatedMinutes} min
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusTone(
                        row.status
                      )}`}
                    >
                      {row.status.replace("_", " ")}
                    </span>
                  </div>
                  {row.module.description ? (
                    <p className="mt-3 line-clamp-4 text-sm text-slate-400">
                      {row.module.description}
                    </p>
                  ) : null}

                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Progress</span>
                      <span>{row.progressPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={row.progressPercent}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setHub((prev) => {
                          if (!prev) return prev;
                          const next = { ...prev, trainings: [...prev.trainings] };
                          const i = next.trainings.findIndex(
                            (t) => t.assignmentId === row.assignmentId
                          );
                          if (i >= 0) {
                            next.trainings[i] = {
                              ...next.trainings[i],
                              progressPercent: v,
                            };
                          }
                          return next;
                        });
                      }}
                      onMouseUp={(e) =>
                        saveProgress(row.module.id, {
                          progressPercent: Number(e.target.value),
                        })
                      }
                      onTouchEnd={(e) => {
                        const t = e.target;
                        if (t && "value" in t) {
                          saveProgress(row.module.id, {
                            progressPercent: Number(t.value),
                          });
                        }
                      }}
                      className="mt-2 w-full accent-emerald-500"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        saveProgress(row.module.id, { status: "in_progress" })
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Circle className="h-3.5 w-3.5" />
                      Mark in progress
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        saveProgress(row.module.id, { status: "completed" })
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark complete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
    </div>
  );
}
