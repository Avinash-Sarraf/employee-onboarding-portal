import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { DOCUMENT_TYPES, DOC_STATUS_LABEL } from "../../constants/documents";
import { ONBOARDING_STATE_OPTIONS } from "../../constants/hrOnboarding";
import { HrSpinner } from "./HrSpinner";
import { DateInput } from "../forms/DateInput";
import { ClipboardList, FileText, LayoutDashboard, X } from "lucide-react";
import { validateProfessionalAssignment, validateHrDeskField } from "../../utils/hrValidation";

const docTypeLabel = (value) =>
  DOCUMENT_TYPES.find((d) => d.value === value)?.label || value;

const hrDocStatusClass = (status) => {
  switch (status) {
    case "verified":
      return "bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-500/30";
    case "rejected":
      return "bg-rose-100 text-rose-800 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-500/30";
    default:
      return "bg-amber-100 text-amber-900 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-100 dark:ring-amber-500/30";
  }
};

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "hr", label: "HR desk", icon: ClipboardList },
];

function docProgress(documents) {
  const list = documents || [];
  if (!list.length) return { pct: 0, verified: 0, total: 0, pending: 0 };
  const verified = list.filter((d) => d.status === "verified").length;
  const pending = list.filter((d) => d.status === "pending").length;
  return {
    pct: Math.round((verified / list.length) * 100),
    verified,
    total: list.length,
    pending,
  };
}

export function EmployeeDetailModal({
  open,
  userId,
  summary,
  onClose,
  onRefresh,
  apiOrigin,
}) {
  const toast = useToast();
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [profile, setProfile] = useState(null);

  const [docActionComments, setDocActionComments] = useState({});
  const [profileComment, setProfileComment] = useState("");
  const [joiningDraft, setJoiningDraft] = useState("");
  const [onboardingDraft, setOnboardingDraft] = useState("awaiting_profile");
  const [assignedJoinDate, setAssignedJoinDate] = useState("");
  const [managerId, setManagerId] = useState("");
  const [officeLoc, setOfficeLoc] = useState("");
  const [reportingInstr, setReportingInstr] = useState("");
  const [professionalRole, setProfessionalRole] = useState("NA");
  const [professionalDepartment, setProfessionalDepartment] = useState("NA");
  const [professionalEmploymentType, setProfessionalEmploymentType] = useState("");
  const [professionalJoiningDate, setProfessionalJoiningDate] = useState("");
  const [professionalWorkLocation, setProfessionalWorkLocation] = useState("");
  const [hrErrors, setHrErrors] = useState({});
  const [hrDeskErrors, setHrDeskErrors] = useState({});
  const [directoryUsers, setDirectoryUsers] = useState([]);
  const [savingHr, setSavingHr] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.get(`/profile/${userId}`);
      const p = res.data?.data;
      if (!p) throw new Error("empty");
      setProfile(p);
      setProfileComment(p.hr?.comment || "");
      setJoiningDraft(p.hr?.joiningInstructions || "");
      setOnboardingDraft(p.hr?.onboardingState || "awaiting_profile");
      setAssignedJoinDate(
        p.hr?.assignedJoiningDate
          ? String(p.hr.assignedJoiningDate).slice(0, 10)
          : ""
      );
      setManagerId(p.hr?.reportingManagerUserId || "");
      setOfficeLoc(p.hr?.officeLocation || "");
      setReportingInstr(p.hr?.reportingInstructions || "");
      setProfessionalRole(p.professional?.role || "NA");
      setProfessionalDepartment(p.professional?.department || "NA");
      setProfessionalEmploymentType(p.professional?.employmentType || "");
      setProfessionalJoiningDate(
        p.professional?.joiningDate ? String(p.professional.joiningDate).slice(0, 10) : ""
      );
      setProfessionalWorkLocation(p.professional?.workLocation || "");
      setDocActionComments({});
    } catch (e) {
      setLoadError(e.response?.data?.message || e.message || "Load failed");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!open || !userId) return;
    setTab("overview");
    load();
  }, [open, userId, load]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/hr/directory-users");
        const list = res.data?.data ?? [];
        if (!cancelled) setDirectoryUsers(list);
      } catch {
        if (!cancelled) setDirectoryUsers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const mergeDocuments = (documents) => {
    setProfile((prev) =>
      prev ? { ...prev, documents: documents || [] } : prev
    );
  };

  const mergeHr = (hr) => {
    setProfile((prev) => (prev ? { ...prev, hr: { ...prev.hr, ...hr } } : prev));
    if (hr?.comment !== undefined) setProfileComment(hr.comment || "");
    if (hr?.joiningInstructions !== undefined) {
      setJoiningDraft(hr.joiningInstructions || "");
    }
    if (hr?.onboardingState !== undefined) {
      setOnboardingDraft(hr.onboardingState || "awaiting_profile");
    }
    if (hr?.assignedJoiningDate !== undefined) {
      setAssignedJoinDate(
        hr.assignedJoiningDate
          ? String(hr.assignedJoiningDate).slice(0, 10)
          : ""
      );
    }
    if (hr?.reportingManagerUserId !== undefined) {
      setManagerId(hr.reportingManagerUserId || "");
    }
    if (hr?.officeLocation !== undefined) setOfficeLoc(hr.officeLocation || "");
    if (hr?.reportingInstructions !== undefined) {
      setReportingInstr(hr.reportingInstructions || "");
    }
  };

  const updateDocStatus = async (docType, status) => {
    const comment = (docActionComments[docType] || "").trim();
    if (status === "rejected" && comment.length < 5) {
      toast.error(
        "Enter a rejection reason (at least 5 characters) for this document."
      );
      return;
    }
    try {
      const res = await api.put("/hr/document-status", {
        userId,
        docType,
        status,
        comment,
      });
      const documents = res.data?.data?.documents;
      if (!Array.isArray(documents)) throw new Error("bad response");
      mergeDocuments(documents);
      setDocActionComments((prev) => {
        const n = { ...prev };
        delete n[docType];
        return n;
      });
      toast.success(res.data?.message || "Document updated.");
      onRefresh?.();
    } catch (e) {
      toast.error(
        e.response?.data?.message || e.message || "Document update failed."
      );
    }
  };

  const updateProfileStatus = async (status) => {
    const comment = profileComment.trim();
    if (status === "rejected" && comment.length < 5) {
      toast.error(
        "Enter an onboarding rejection reason (at least 5 characters)."
      );
      return;
    }
    try {
      const res = await api.put("/hr/profile-status", {
        userId,
        status,
        comment,
      });
      const hr = res.data?.data?.hr;
      if (hr) mergeHr(hr);
      toast.success(res.data?.message || "Onboarding updated.");
      onRefresh?.();
    } catch (e) {
      toast.error(
        e.response?.data?.message || e.message || "Onboarding update failed."
      );
    }
  };

  const saveHrSettings = async () => {
    const locked = profile?.hr?.status !== "verified";
    const validationErrors = validateProfessionalAssignment(
      {
        professionalRole,
        professionalDepartment,
        professionalEmploymentType,
        professionalJoiningDate,
        professionalWorkLocation,
      },
      locked
    );
    if (Object.keys(validationErrors).length > 0) {
      setHrErrors(validationErrors);
      toast.error("Fill all required professional fields before saving.");
      return;
    }
    
    const hrDeskValidationErrors = {
      joiningInstructions: validateHrDeskField("joiningInstructions", joiningDraft),
      reportingInstructions: validateHrDeskField("reportingInstructions", reportingInstr),
      officeLocation: validateHrDeskField("officeLocation", officeLoc),
      assignedJoiningDate: validateHrDeskField("assignedJoiningDate", assignedJoinDate),
    };
    const hasHrDeskErrors = Object.values(hrDeskValidationErrors).some(err => err);
    if (hasHrDeskErrors) {
      setHrDeskErrors(hrDeskValidationErrors);
      toast.error("Fix validation errors in HR desk fields.");
      return;
    }
    
    try {
      setSavingHr(true);
      const payload = {
        userId,
        joiningInstructions: joiningDraft,
        onboardingState: onboardingDraft,
        assignedJoiningDate: assignedJoinDate || null,
        reportingManagerUserId: managerId || "",
        officeLocation: officeLoc,
        reportingInstructions: reportingInstr,
      };
      if (profile?.hr?.status === "verified") {
        payload.professionalRole = professionalRole.trim();
        payload.professionalDepartment = professionalDepartment.trim();
        payload.professionalEmploymentType = professionalEmploymentType.trim();
        payload.professionalJoiningDate = professionalJoiningDate;
        payload.professionalWorkLocation = professionalWorkLocation.trim();
      }
      const res = await api.put("/hr/employee-settings", payload);
      const hr = res.data?.data?.hr;
      const professional = res.data?.data?.professional;
      if (hr) mergeHr(hr);
      if (professional) {
        setProfile((prev) =>
          prev ? { ...prev, professional: { ...prev.professional, ...professional } } : prev
        );
        setProfessionalRole(professional.role || "NA");
        setProfessionalDepartment(professional.department || "NA");
        setProfessionalEmploymentType(professional.employmentType || "");
        setProfessionalJoiningDate(
          professional.joiningDate ? String(professional.joiningDate).slice(0, 10) : ""
        );
        setProfessionalWorkLocation(professional.workLocation || "");
      }
      toast.success(res.data?.message || "HR settings saved.");
      setHrDeskErrors({});
      onRefresh?.();
    } catch (e) {
      toast.error(
        e.response?.data?.message || e.message || "Could not save HR settings."
      );
    } finally {
      setSavingHr(false);
    }
  };

  if (!open || !userId) return null;

  const title = summary?.name || profile?.personal?.fullName || "Employee";
  const subtitle =
    summary?.email || profile?.personal?.email || "—";
  const dp = docProgress(profile?.documents);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hr-employee-detail-title"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-slate-50/90 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
          <div className="min-w-0">
            <h2
              id="hr-employee-detail-title"
              className="truncate text-lg font-bold text-slate-900 dark:text-white sm:text-xl"
            >
              {title}
            </h2>
            <p className="truncate text-sm text-slate-400">{subtitle}</p>
            {summary?.department ? (
              <p className="mt-1 text-xs text-slate-500">
                Dept: {summary.department}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex shrink-0 gap-1 border-b border-slate-200 bg-slate-50/80 px-2 pt-2 dark:border-slate-800 dark:bg-slate-900/50 sm:px-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-t-lg px-3 py-2.5 text-sm font-medium transition sm:px-4 ${
                  active
                    ? "bg-white text-slate-900 ring-1 ring-slate-200 ring-b-0 dark:bg-slate-950 dark:text-white dark:ring-slate-700"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4 dark:bg-slate-950 sm:p-6">
          {loading ? <HrSpinner label="Loading employee record…" /> : null}
          {!loading && loadError ? (
            <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 p-4 text-sm text-rose-200">
              {loadError}
            </div>
          ) : null}
          {!loading && profile && !loadError ? (
            <>
              {tab === "overview" ? (
                <div className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        HR verification
                      </p>
                      <p className="mt-2 text-lg font-semibold capitalize text-slate-900 dark:text-white">
                        {profile.hr?.status || "pending"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Onboarding pipeline
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                        {ONBOARDING_STATE_OPTIONS.find(
                          (o) => o.value === (profile.hr?.onboardingState || "")
                        )?.label || profile.hr?.onboardingState}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Documents verified
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                        {dp.verified}/{dp.total}{" "}
                        <span className="text-sm font-normal text-slate-400">
                          ({dp.pct}%)
                        </span>
                      </p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${dp.pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      ["Full name", profile.personal?.fullName],
                      ["Email", profile.personal?.email],
                      ["Phone", profile.personal?.phone],
                      ["Department", profile.professional?.department],
                      ["Role", profile.professional?.role],
                      ["Work location", profile.professional?.workLocation],
                    ].map(([label, val]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40"
                      >
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {val || "—"}
                        </p>
                      </div>
                    ))}
                  </div>

                  {profile.hr?.comment ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Latest HR comment (verification)
                      </p>
                      <p className="mt-2 text-sm text-slate-200">
                        {profile.hr.comment}
                      </p>
                    </div>
                  ) : null}

                  {profile.hr?.joiningInstructions ||
                  profile.hr?.assignedJoiningDate ||
                  profile.hr?.officeLocation ||
                  profile.hr?.reportingManagerUserId ||
                  profile.hr?.reportingInstructions ? (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300/80">
                          Joining details (visible to employee)
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {profile.hr?.assignedJoiningDate ? (
                            <div>
                              <p className="text-xs text-slate-500">Joining date</p>
                              <p className="text-sm text-slate-800 dark:text-white">
                                {String(profile.hr.assignedJoiningDate).slice(0, 10)}
                              </p>
                            </div>
                          ) : null}
                          {profile.hr?.officeLocation ? (
                            <div>
                              <p className="text-xs text-slate-500">Office</p>
                              <p className="text-sm text-slate-800 dark:text-white">
                                {profile.hr.officeLocation}
                              </p>
                            </div>
                          ) : null}
                          {profile.hr?.reportingManagerUserId ? (
                            <div className="sm:col-span-2">
                              <p className="text-xs text-slate-500">Manager user id</p>
                              <p className="text-sm font-mono text-slate-300">
                                {profile.hr.reportingManagerUserId}
                              </p>
                            </div>
                          ) : null}
                        </div>
                        {profile.hr?.reportingInstructions ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">
                            {profile.hr.reportingInstructions}
                          </p>
                        ) : null}
                        {profile.hr?.joiningInstructions ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">
                            {profile.hr.joiningInstructions}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {tab === "documents" ? (
                <div className="space-y-4">
                  {!profile.documents?.length ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      No documents uploaded.
                    </p>
                  ) : (
                    profile.documents.map((doc) => (
                      <div
                        key={doc.docType}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {docTypeLabel(doc.docType)}
                            </h3>
                            <p className="text-xs text-slate-500">{doc.docType}</p>
                            <span
                              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${hrDocStatusClass(
                                doc.status
                              )}`}
                            >
                              {DOC_STATUS_LABEL[doc.status] || doc.status}
                            </span>
                            {doc.verificationComment ? (
                              <p className="mt-3 rounded-lg bg-black/25 p-3 text-sm text-slate-300">
                                {doc.verificationComment}
                              </p>
                            ) : null}
                          </div>
                          {doc.fileUrl ? (
                            <a
                              href={`${apiOrigin}/${String(
                                doc.fileUrl
                              ).replace(/^\//, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="shrink-0 rounded-xl border border-slate-600 px-4 py-2 text-center text-sm text-indigo-300 hover:bg-slate-800"
                            >
                              Preview
                            </a>
                          ) : null}
                        </div>
                        <label className="mt-4 block text-xs font-medium text-slate-500">
                          Comment (optional approve / required reject)
                        </label>
                        <textarea
                          value={docActionComments[doc.docType] ?? ""}
                          onChange={(e) =>
                            setDocActionComments((p) => ({
                              ...p,
                              [doc.docType]: e.target.value,
                            }))
                          }
                          rows={2}
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateDocStatus(doc.docType, "verified")
                            }
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateDocStatus(doc.docType, "rejected")
                            }
                            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold hover:bg-rose-500"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : null}

              {tab === "hr" ? (
                <div className="mx-auto max-w-3xl space-y-10">
                  <section className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Employee role
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Editable after profile verification. Default is NA until assigned.
                      </p>
                      <input
                        value={professionalRole}
                        onChange={(e) => {
                          const v = e.target.value;
                          setProfessionalRole(v);
                          setHrErrors((prev) => ({
                            ...prev,
                            professionalRole: validateProfessionalAssignment(
                              {
                                professionalRole: v,
                                professionalDepartment,
                                professionalEmploymentType,
                                professionalJoiningDate,
                                professionalWorkLocation,
                              },
                              profile?.hr?.status !== "verified"
                            ).professionalRole || "",
                          }));
                        }}
                        disabled={profile?.hr?.status !== "verified"}
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        placeholder="e.g. Software Engineer"
                      />
                      {hrErrors.professionalRole ? (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{hrErrors.professionalRole}</p>
                      ) : null}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Department
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Editable after profile verification.
                      </p>
                      <input
                        value={professionalDepartment}
                        onChange={(e) => {
                          const v = e.target.value;
                          setProfessionalDepartment(v);
                          setHrErrors((prev) => ({
                            ...prev,
                            professionalDepartment: validateProfessionalAssignment(
                              {
                                professionalRole,
                                professionalDepartment: v,
                                professionalEmploymentType,
                                professionalJoiningDate,
                                professionalWorkLocation,
                              },
                              profile?.hr?.status !== "verified"
                            ).professionalDepartment || "",
                          }));
                        }}
                        disabled={profile?.hr?.status !== "verified"}
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        placeholder="e.g. Engineering"
                      />
                      {hrErrors.professionalDepartment ? (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{hrErrors.professionalDepartment}</p>
                      ) : null}
                    </div>
                  </section>
                  <section className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Employment type
                      </h3>
                      <select
                        value={professionalEmploymentType}
                        onChange={(e) => {
                          const v = e.target.value;
                          setProfessionalEmploymentType(v);
                          setHrErrors((prev) => ({
                            ...prev,
                            professionalEmploymentType: validateProfessionalAssignment(
                              {
                                professionalRole,
                                professionalDepartment,
                                professionalEmploymentType: v,
                                professionalJoiningDate,
                                professionalWorkLocation,
                              },
                              profile?.hr?.status !== "verified"
                            ).professionalEmploymentType || "",
                          }));
                        }}
                        disabled={profile?.hr?.status !== "verified"}
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      >
                        <option value="">Select</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Intern">Intern</option>
                        <option value="Contract">Contract</option>
                      </select>
                      {hrErrors.professionalEmploymentType ? (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{hrErrors.professionalEmploymentType}</p>
                      ) : null}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Professional joining date
                      </h3>
                      <DateInput
                        value={professionalJoiningDate}
                        onChange={(e) => {
                          const v = e.target.value;
                          setProfessionalJoiningDate(v);
                          setHrErrors((prev) => ({
                            ...prev,
                            professionalJoiningDate: validateProfessionalAssignment(
                              {
                                professionalRole,
                                professionalDepartment,
                                professionalEmploymentType,
                                professionalJoiningDate: v,
                                professionalWorkLocation,
                              },
                              profile?.hr?.status !== "verified"
                            ).professionalJoiningDate || "",
                          }));
                        }}
                        disabled={profile?.hr?.status !== "verified"}
                        className="mt-3"
                      />
                      {hrErrors.professionalJoiningDate ? (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{hrErrors.professionalJoiningDate}</p>
                      ) : null}
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Work location
                      </h3>
                      <input
                        value={professionalWorkLocation}
                        onChange={(e) => {
                          const v = e.target.value;
                          setProfessionalWorkLocation(v);
                          setHrErrors((prev) => ({
                            ...prev,
                            professionalWorkLocation: validateProfessionalAssignment(
                              {
                                professionalRole,
                                professionalDepartment,
                                professionalEmploymentType,
                                professionalJoiningDate,
                                professionalWorkLocation: v,
                              },
                              profile?.hr?.status !== "verified"
                            ).professionalWorkLocation || "",
                          }));
                        }}
                        disabled={profile?.hr?.status !== "verified"}
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        placeholder="Assigned work location"
                      />
                      {hrErrors.professionalWorkLocation ? (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{hrErrors.professionalWorkLocation}</p>
                      ) : null}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Joining instructions
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Shown on the employee dashboard. Include reporting time,
                      location, dress code, and contacts.
                    </p>
                    <textarea
                      value={joiningDraft}
                      onChange={(e) => {
                        const v = e.target.value;
                        setJoiningDraft(v);
                        setHrDeskErrors((prev) => ({
                          ...prev,
                          joiningInstructions: validateHrDeskField("joiningInstructions", v),
                        }));
                      }}
                      rows={6}
                      className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      placeholder="e.g. Report to Reception B on Monday 9:00 AM with two ID copies…"
                    />
                    {hrDeskErrors.joiningInstructions ? (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{hrDeskErrors.joiningInstructions}</p>
                    ) : null}
                  </section>

                  <section className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Official joining date
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        HR-assigned start date (optional).
                      </p>
                      <DateInput
                        value={assignedJoinDate}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAssignedJoinDate(v);
                          setHrDeskErrors((prev) => ({
                            ...prev,
                            assignedJoiningDate: validateHrDeskField("assignedJoiningDate", v),
                          }));
                        }}
                        className="mt-3"
                      />
                      {hrDeskErrors.assignedJoiningDate ? (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{hrDeskErrors.assignedJoiningDate}</p>
                      ) : null}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Reporting manager
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Pick anyone in the directory.
                      </p>
                      <select
                        value={managerId}
                        onChange={(e) => setManagerId(e.target.value)}
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      >
                        <option value="">— None —</option>
                        {directoryUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role}) · {u.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Office location
                      </h3>
                      <input
                        value={officeLoc}
                        onChange={(e) => {
                          const v = e.target.value;
                          setOfficeLoc(v);
                          setHrDeskErrors((prev) => ({
                            ...prev,
                            officeLocation: validateHrDeskField("officeLocation", v),
                          }));
                        }}
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        placeholder="Building, floor, city…"
                      />
                      {hrDeskErrors.officeLocation ? (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{hrDeskErrors.officeLocation}</p>
                      ) : null}
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Reporting instructions
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Day-one reporting process, security desk, parking, etc.
                      </p>
                      <textarea
                        value={reportingInstr}
                        onChange={(e) => {
                          const v = e.target.value;
                          setReportingInstr(v);
                          setHrDeskErrors((prev) => ({
                            ...prev,
                            reportingInstructions: validateHrDeskField("reportingInstructions", v),
                          }));
                        }}
                        rows={5}
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                      {hrDeskErrors.reportingInstructions ? (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{hrDeskErrors.reportingInstructions}</p>
                      ) : null}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Onboarding pipeline state
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Internal workflow label for this hire (independent of
                      verification buttons below).
                    </p>
                    <select
                      value={onboardingDraft}
                      onChange={(e) => setOnboardingDraft(e.target.value)}
                      className="mt-3 w-full max-w-md rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      {ONBOARDING_STATE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </section>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={savingHr}
                      onClick={saveHrSettings}
                      className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {savingHr ? "Saving…" : "Save instructions & state"}
                    </button>
                  </div>

                  <hr className="border-slate-200 dark:border-slate-800" />

                  <section>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Profile verification decision
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Comment is optional when approving; required (5+
                      characters) when rejecting.
                    </p>
                    <textarea
                      value={profileComment}
                      onChange={(e) => setProfileComment(e.target.value)}
                      rows={4}
                      className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => updateProfileStatus("verified")}
                        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-500"
                      >
                        Approve profile
                      </button>
                      <button
                        type="button"
                        onClick={() => updateProfileStatus("rejected")}
                        className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold hover:bg-rose-500"
                      >
                        Reject profile
                      </button>
                      <button
                        type="button"
                        onClick={() => updateProfileStatus("pending")}
                        className="rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
                      >
                        Mark pending
                      </button>
                    </div>
                  </section>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
