import React, { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";
import { useOptionalProfile } from "../context/ProfileContext";
import api from "../api/client";
import { Badge } from "../components/ui/Badge";
import { hrVerificationTone } from "../utils/hrStatusBadges";
import { DOCUMENT_TYPES } from "../constants/documents";

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(value || 0)));

const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  return String(value ?? "").trim().length > 0;
};

const getByPath = (obj, path) => {
  const keys = path.split(".");
  let cursor = obj;
  for (const key of keys) {
    cursor = cursor?.[key];
    if (cursor == null) return "";
  }
  return cursor;
};

const buildDashboardProgress = (profile) => {
  const p = profile || {};
  const docs = Array.isArray(p.documents) ? p.documents : [];
  const docByType = new Set(docs.filter((d) => hasValue(d?.docType)).map((d) => d.docType));

  const sections = [
    {
      id: "personal",
      label: "Personal details",
      action: "Complete personal details",
      fields: [
        "personal.fullName",
        "personal.dob",
        "personal.gender",
        "personal.placeOfBirth",
        "personal.nationality",
      ],
    },
    {
      id: "contact",
      label: "Contact details",
      action: "Add contact and address details",
      fields: [
        "personal.email",
        "personal.phone",
        "personal.address.present",
        "personal.address.permanent",
      ],
    },
    {
      id: "professional",
      label: "Professional details",
      action: "Complete professional details",
      fields: [
        "professional.employmentType",
        "professional.joiningDate",
        "professional.workLocation",
      ],
    },
    {
      id: "required",
      label: "Required profile fields",
      action: "Finish required onboarding fields",
      fields: [
        "personal.bankDetails.accountNumber",
        "personal.bankDetails.ifsc",
        "academic.highestQualification",
        "academic.university",
        "academic.passingYear",
        "academic.grades",
        "academic.branch",
      ],
      customChecks: [
        {
          key: "technicalSkills",
          label: "Add at least one technical skill",
          done: hasValue(p.technicalSkills),
        },
        {
          key: "ndaAgreement",
          label: "Complete NDA agreement details",
          done:
            p.ndaAgreement?.signed === true &&
            hasValue(p.ndaAgreement?.signedOn) &&
            hasValue(p.ndaAgreement?.documentId),
        },
      ],
    },
    {
      id: "documents",
      label: "Uploaded documents",
      action: "Upload pending required documents",
      fields: [],
      customChecks: DOCUMENT_TYPES.map((d) => ({
        key: `doc:${d.value}`,
        label: `Upload ${d.label}`,
        done: docByType.has(d.value),
      })),
    },
  ];

  const sectionStats = sections.map((section) => {
    const fieldChecks = section.fields.map((fieldPath) => ({
      key: fieldPath,
      label: fieldPath,
      done: hasValue(getByPath(p, fieldPath)),
    }));
    const customChecks = section.customChecks || [];
    const checks = [...fieldChecks, ...customChecks];
    const total = checks.length;
    const done = checks.filter((c) => c.done).length;
    return {
      ...section,
      checks,
      total,
      done,
      percent: total ? clampPercent((done / total) * 100) : 0,
      complete: total > 0 && done === total,
    };
  });

  const totals = sectionStats.reduce(
    (acc, section) => {
      acc.done += section.done;
      acc.total += section.total;
      return acc;
    },
    { done: 0, total: 0 }
  );

  const completionPercent = totals.total
    ? clampPercent((totals.done / totals.total) * 100)
    : 0;

  const checklist = sectionStats.map((section) => ({
    id: section.id,
    label: `${section.label} (${section.done}/${section.total})`,
    done: section.complete,
  }));

  const nextActions = sectionStats
    .filter((section) => !section.complete)
    .map((section) => {
      const remaining = section.total - section.done;
      return `${section.action} (${remaining} remaining)`;
    });

  return {
    completionPercent,
    checklist,
    nextActions,
  };
};

const Dashboard = () => {
  const navigate = useNavigate();
  const ctx = useOptionalProfile();
  const user = ctx?.user || getUser();
  const profile = ctx?.profile ?? null;
  const loading = ctx?.loading ?? false;

  const [hub, setHub] = useState(null);
  const [hubLoading, setHubLoading] = useState(true);

  const loadHub = useCallback(async () => {
    setHubLoading(true);
    try {
      const res = await api.get("/onboarding/me");
      setHub(res.data?.data ?? null);
    } catch {
      setHub(null);
    } finally {
      setHubLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHub();
  }, [loadHub]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") loadHub();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [loadHub]);

  const computed = useMemo(() => buildDashboardProgress(profile), [profile]);
  const progress = computed.completionPercent;
  const profileComplete = progress === 100;
  const ringColor = profileComplete ? "#22c55e" : "#3b82f6";
  const checklist = computed.checklist;
  const pendingFromChecklist = computed.nextActions;
  const [animatedProgress, setAnimatedProgress] = useState(progress);
  const previousProgressRef = useRef(progress);

  useEffect(() => {
    let rafId = 0;
    const start = performance.now();
    const from = previousProgressRef.current;
    const to = progress;
    const duration = 550;

    const tick = (ts) => {
      const elapsed = ts - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (to - from) * eased;
      setAnimatedProgress(clampPercent(value));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        previousProgressRef.current = to;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [progress]);

  const hrJoin = profile?.hr || {};

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {loading && !profile ? (
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            Syncing your onboarding profile…
          </div>
        ) : null}

        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-100 via-white to-indigo-50 p-8 shadow-xl dark:border-white/10 dark:from-slate-900 dark:via-indigo-950/80 dark:to-slate-900 dark:shadow-2xl">
          <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/20" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="mb-3 text-4xl font-bold text-slate-900 dark:text-white">
                Welcome back,
                <span className="text-blue-600 dark:text-blue-400">
                  {" "}
                  {profile?.personal?.fullName || user?.name || "Employee"}
                </span>{" "}
                👋
              </h1>

              <p className="text-lg text-slate-600 dark:text-slate-300">
                Complete your onboarding journey smoothly with real-time tracking
              </p>

              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
                >
                  Continue Process
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/document")}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-800 transition hover:bg-white dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                >
                  View Documents
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/onboarding")}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-white dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                >
                  Onboarding hub
                </button>
              </div>
            </div>

            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <div
                className="flex h-36 w-36 items-center justify-center rounded-full transition-[background,box-shadow] duration-700 ease-out"
                style={{
                  background: `conic-gradient(${ringColor} ${animatedProgress * 3.6}deg, rgba(148,163,184,0.35) 0deg)`,
                  boxShadow: profileComplete
                    ? "0 0 0 4px rgba(34,197,94,0.15)"
                    : undefined,
                }}
              >
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700">
                  <span
                    className={`text-3xl font-bold transition-colors duration-700 ease-out ${
                      profileComplete
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {animatedProgress}%
                  </span>

                  <span
                    className={`text-sm transition-colors duration-700 ease-out ${
                      profileComplete
                        ? "text-emerald-600/90 dark:text-emerald-400/90"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {profileComplete ? "Complete" : "In progress"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm dark:border-violet-500/25 dark:from-violet-950/50 dark:to-slate-900 dark:shadow-none">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Announcements</h3>
              <span className="text-xl" aria-hidden>
                📣
              </span>
            </div>
            {hubLoading ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
            ) : !hub?.announcements?.length ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                No active announcements. You are all caught up.
              </p>
            ) : (
              <ul className="mt-4 space-y-3 max-h-52 overflow-y-auto pr-1">
                {hub.announcements.slice(0, 4).map((a) => (
                  <li
                    key={a._id}
                    className="rounded-xl border border-slate-200 bg-white/80 p-3 text-sm dark:border-white/10 dark:bg-black/20"
                  >
                    {a.pinned ? (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-amber-400 dark:text-amber-300">
                        Pinned
                      </span>
                    ) : null}
                    <p className="font-medium text-slate-900 dark:text-white">{a.title}</p>
                    <p className="mt-1 line-clamp-2 text-slate-600 dark:text-slate-400">{a.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => navigate("/onboarding")}
              className="mt-4 text-sm font-semibold text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
            >
              Open full hub →
            </button>
          </div>

          <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white p-6 shadow-sm dark:border-emerald-500/25 dark:from-emerald-950/30 dark:to-slate-900 dark:shadow-none">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Training</h3>
              <span className="text-xl" aria-hidden>
                🎓
              </span>
            </div>
            {hubLoading ? (
              <p className="mt-4 text-sm text-slate-500">Loading…</p>
            ) : (
              <>
                <p className="mt-4 text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                  {hub?.trainingSummary?.completed ?? 0}
                  <span className="text-lg font-normal text-slate-500 dark:text-slate-500">
                    /{hub?.trainingSummary?.total ?? 0}
                  </span>
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  modules completed
                  {hub?.trainingSummary?.inProgress
                    ? ` · ${hub.trainingSummary.inProgress} in progress`
                    : ""}
                </p>
                {!hub?.trainingSummary?.total ? (
                  <p className="mt-3 text-xs text-slate-500">
                    HR will assign learning paths when you are ready.
                  </p>
                ) : null}
              </>
            )}
            <button
              type="button"
              onClick={() => navigate("/onboarding")}
              className="mt-4 text-sm font-semibold text-emerald-800 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200"
            >
              View modules →
            </button>
          </div>

          <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 to-white p-6 shadow-sm dark:border-indigo-500/25 dark:from-indigo-950/40 dark:to-slate-900 dark:shadow-none">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Joining snapshot</h3>
              <span className="text-xl" aria-hidden>
                🗓️
              </span>
            </div>
            {hubLoading ? (
              <p className="mt-4 text-sm text-slate-500">Loading…</p>
            ) : (
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Date
                  </dt>
                  <dd className="text-slate-100">
                    {hub?.joining?.assignedJoiningDate
                      ? String(hub.joining.assignedJoiningDate).slice(0, 10)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Manager
                  </dt>
                  <dd className="text-slate-100">
                    {hub?.joining?.reportingManager?.name || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Office
                  </dt>
                  <dd className="line-clamp-3 text-slate-100">
                    {hub?.joining?.officeLocation?.trim() || "—"}
                  </dd>
                </div>
              </dl>
            )}
            <button
              type="button"
              onClick={() => navigate("/onboarding")}
              className="mt-4 text-sm font-semibold text-indigo-800 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              Full joining details →
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none dark:hover:bg-slate-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Verification Status</h3>

              <span className="text-2xl">🛡️</span>
            </div>

            <Badge tone={hrVerificationTone(profile?.hr?.status || "pending")}>
              {profile?.hr?.status || "pending"}
            </Badge>

            <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm">
              {profile?.hr?.status === "rejected" ? (
                <span className="block rounded-lg bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/20">
                  {profile.hr?.comment?.trim()
                    ? profile.hr.comment
                    : "Your onboarding was rejected. Check your email or contact HR for next steps."}
                </span>
              ) : profile?.hr?.status === "verified" ? (
                <span className="text-emerald-700 dark:text-emerald-300">
                  {profile.hr?.comment?.trim()
                    ? profile.hr.comment
                    : "Onboarding approved."}
                </span>
              ) : (
                "Waiting for HR approval and verification"
              )}
            </p>
            {hrJoin.assignedJoiningDate ||
            hrJoin.officeLocation ||
            hrJoin.reportingManagerUserId ||
            hrJoin.reportingInstructions ||
            hrJoin.joiningInstructions?.trim() ? (
              <div className="mt-4 space-y-2 rounded-xl border border-indigo-200/80 bg-indigo-50/80 p-4 text-left dark:border-indigo-500/20 dark:bg-indigo-950/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800 dark:text-indigo-300/90">
                  HR joining details
                </p>
                {hrJoin.assignedJoiningDate ? (
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    <span className="text-slate-500 dark:text-slate-400">Date: </span>
                    {String(hrJoin.assignedJoiningDate).slice(0, 10)}
                  </p>
                ) : null}
                {hrJoin.officeLocation ? (
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    <span className="text-slate-500 dark:text-slate-400">Office: </span>
                    {hrJoin.officeLocation}
                  </p>
                ) : null}
                {hrJoin.joiningInstructions?.trim() ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-100">
                    {hrJoin.joiningInstructions}
                  </p>
                ) : hrJoin.reportingInstructions?.trim() ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-100">
                    {hrJoin.reportingInstructions}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none dark:hover:bg-slate-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Onboarding checklist</h3>

              <span className="text-2xl">✅</span>
            </div>

            {pendingFromChecklist.length === 0 ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                All checklist items are complete.
              </p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {checklist.map((item) => (
                  <li
                    key={item.id}
                    className={`text-sm flex items-center gap-2 ${
                      item.done
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-300"
                    }`}
                  >
                    <span>{item.done ? "✓" : "○"}</span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none dark:hover:bg-slate-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Next actions</h3>

              <span className="text-2xl">⚠️</span>
            </div>

            {pendingFromChecklist.length === 0 ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">You are all caught up.</p>
            ) : (
              <ul className="space-y-2">
                {pendingFromChecklist.map((a, i) => (
                  <li key={i} className="text-sm text-amber-700 dark:text-amber-300">
                    • {a}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
            <h3 className="text-2xl font-semibold mb-6">Profile Snapshot</h3>

            {!profile ? (
              <p className="text-slate-400 text-sm">
                No saved profile yet. Visit the profile page to get started.
              </p>
            ) : (
              <div className="space-y-5">
                <div className="flex justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Email</span>
                  <span>{profile?.personal?.email || "-"}</span>
                </div>

                <div className="flex justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Phone</span>
                  <span>{profile?.personal?.phone || "-"}</span>
                </div>

                <div className="flex justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Location</span>
                  <span>{profile?.personal?.address?.present || "-"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Role</span>
                  <span>{profile?.professional?.role || "-"}</span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
            <h3 className="text-2xl font-semibold mb-6">Document Summary</h3>

            {!profile?.documents?.length ? (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                📄 No documents uploaded
              </div>
            ) : (
              profile.documents.map((doc, i) => (
                <div
                  key={doc.docType || i}
                  className="flex flex-col gap-2 rounded-xl bg-white/5 p-4 mb-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-medium">{doc.docType}</span>
                    {doc.status === "rejected" && doc.verificationComment ? (
                      <p className="mt-1 text-xs text-rose-300">
                        {doc.verificationComment}
                      </p>
                    ) : null}
                  </div>

                  <span
                    className={
                      doc.status === "verified"
                        ? "text-green-400 shrink-0"
                        : doc.status === "pending"
                        ? "text-yellow-400 shrink-0"
                        : "text-red-400 shrink-0"
                    }
                  >
                    {doc.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

    </div>
  );
};

export default Dashboard;
