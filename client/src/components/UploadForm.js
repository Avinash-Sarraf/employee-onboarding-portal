import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import api from "../api/client";
import { getUser } from "../utils/auth";
import { useToast } from "../context/ToastContext";
import {
  DOCUMENT_TYPES,
  DOC_STATUS_LABEL,
  statusBadgeClass,
} from "../constants/documents";
import {
  cardPadClass,
  headingClass,
  mutedClass,
  labelClass,
  selectClass,
  fileInputClass,
  btnPrimaryClass,
  btnSecondaryClass,
  tableWrapClass,
  tableHeadClass,
  tableBodyClass,
  tableRowHoverClass,
} from "../constants/themeClasses";
import { cn } from "../utils/cn";
import { getApiErrorMessage } from "../utils/apiError";

const apiOrigin =
  (process.env.REACT_APP_API_ORIGIN || "http://localhost:5000").replace(
    /\/$/,
    ""
  );

const UploadForm = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const user = getUser();
  const userId = user?.id;

  const [pickType, setPickType] = useState("");
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingType, setDeletingType] = useState(null);

  const byType = useMemo(() => {
    const m = {};
    documents.forEach((d) => {
      if (d?.docType) m[d.docType] = d;
    });
    return m;
  }, [documents]);

  const fetchDocuments = useCallback(async () => {
    if (!userId) {
      setDocuments([]);
      setLoadError(null);
      setLoadingList(false);
      return;
    }
    setLoadingList(true);
    setLoadError(null);
    try {
      const res = await api.get("/profile/me");
      const profile = res.data?.data;
      setDocuments(Array.isArray(profile?.documents) ? profile.documents : []);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.userMessage || getApiErrorMessage(err, "Could not load documents.");

      if (status === 404) {
        setDocuments([]);
        setLoadError(null);
      } else {
        setDocuments([]);
        setLoadError(msg);
        toastRef.current.error(msg, "Could not load documents");
      }
    } finally {
      setLoadingList(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    const onAuth = () => fetchDocuments();
    const onProfile = () => fetchDocuments();
    window.addEventListener("app:auth-changed", onAuth);
    window.addEventListener("app:profile-changed", onProfile);
    return () => {
      window.removeEventListener("app:auth-changed", onAuth);
      window.removeEventListener("app:profile-changed", onProfile);
    };
  }, [fetchDocuments]);

  const validateUpload = () => {
    if (!pickType) return "Select a document type.";
    if (!file) return "Choose a file to upload.";
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.type)) {
      return "Only PDF, JPG, or PNG files are allowed.";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "File must be 5 MB or smaller.";
    }
    return "";
  };

  const handleUpload = async () => {
    if (!userId) {
      toast.error("Please log in again.");
      return;
    }
    const uploadError = validateUpload();
    if (uploadError) {
      toast.error(uploadError);
      return;
    }

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("docType", pickType);
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await api.post("/upload", formData);
      const next = res.data?.data?.documents;
      if (Array.isArray(next)) setDocuments(next);
      setLoadError(null);
      toast.success(res.data?.message || "Uploaded successfully.");
      setFile(null);
      setPickType("");
      const fileInput = document.getElementById("employee-doc-file-input");
      if (fileInput) fileInput.value = "";
      window.dispatchEvent(new Event("app:profile-changed"));
    } catch (err) {
      toast.error(err.userMessage || getApiErrorMessage(err, "Upload failed."));
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = (docType) => {
    setPickType(docType);
    toast.info(`Select a new file below, then click Upload to replace ${docType}.`);
    const el = document.getElementById("employee-doc-upload-anchor");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = async (docType) => {
    if (!userId) return;
    if (!window.confirm(`Remove ${docType} from your profile?`)) return;
    try {
      setDeletingType(docType);
      const res = await api.delete("/upload", {
        data: { userId, docType },
      });
      const next = res.data?.data?.documents;
      if (Array.isArray(next)) setDocuments(next);
      toast.success(res.data?.message || "Document removed.");
      window.dispatchEvent(new Event("app:profile-changed"));
    } catch (err) {
      toast.error(err.userMessage || getApiErrorMessage(err, "Delete failed."));
    } finally {
      setDeletingType(null);
    }
  };

  const previewUrl = (doc) =>
    doc?.fileUrl ? `${apiOrigin}/${doc.fileUrl.replace(/^\//, "")}` : null;

  if (!userId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
        Sign in as an employee to upload documents.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {loadError ? (
        <div
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100"
          role="alert"
        >
          <p className="font-semibold">Unable to load your documents</p>
          <p className="mt-1 text-rose-800/90 dark:text-rose-200/90">{loadError}</p>
          <button
            type="button"
            onClick={() => fetchDocuments()}
            className={cn(btnSecondaryClass, "mt-3 text-xs")}
          >
            Try again
          </button>
        </div>
      ) : null}

      <div id="employee-doc-upload-anchor" className={cardPadClass}>
        <h2 className={headingClass}>Upload or replace a document</h2>
        <p className={cn("mt-1", mutedClass)}>
          PDF, JPG, or PNG — max 5 MB. Replacing a file resets verification to
          pending.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={cn(labelClass, "text-xs uppercase tracking-wide")}>
              Document type
            </label>
            <select
              value={pickType}
              onChange={(e) => setPickType(e.target.value)}
              className={cn(selectClass, "mt-1")}
              disabled={loadingList}
            >
              <option value="">Select type</option>
              {DOCUMENT_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={cn(labelClass, "text-xs uppercase tracking-wide")}>
              File
            </label>
            <input
              id="employee-doc-file-input"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className={fileInputClass}
              disabled={loadingList}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || loadingList || !pickType || !file}
          className={cn(btnPrimaryClass, "mt-5 w-full px-4 py-3 sm:w-auto sm:min-w-[160px]")}
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>

      <div className={cardPadClass}>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className={headingClass}>Your documents</h3>
            <p className={mutedClass}>
              HR will verify each file. Rejected items show the reviewer&apos;s
              comment.
            </p>
          </div>
          {loadingList ? (
            <span className="text-xs font-medium text-slate-400">Loading…</span>
          ) : null}
        </div>

        {loadingList ? (
          <div className="mt-6 space-y-3" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : (
          <div className={cn(tableWrapClass, "mt-6 overflow-x-auto")}>
            <table className="min-w-full text-left text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="px-4 py-3 font-medium">Document</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Uploaded</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={tableBodyClass}>
                {DOCUMENT_TYPES.map(({ value, label }) => {
                  const doc = byType[value];
                  const busy = deletingType === value;
                  return (
                    <tr
                      key={value}
                      className={cn("align-top", tableRowHoverClass)}
                    >
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {label}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {value}
                        </p>
                        {doc?.status === "rejected" &&
                        doc?.verificationComment ? (
                          <div className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-900 ring-1 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900/50">
                            <span className="font-semibold">HR: </span>
                            {doc.verificationComment}
                          </div>
                        ) : null}
                        {doc?.status === "verified" &&
                        doc?.verificationComment ? (
                          <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/50">
                            {doc.verificationComment}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        {doc ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusBadgeClass(
                              doc.status
                            )}`}
                          >
                            {DOC_STATUS_LABEL[doc.status] || doc.status}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">
                            Not uploaded
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                        {doc?.uploadDate
                          ? new Date(doc.uploadDate).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {doc?.fileUrl ? (
                            <a
                              href={previewUrl(doc)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                btnSecondaryClass,
                                "px-3 py-1.5 text-xs"
                              )}
                            >
                              Open
                            </a>
                          ) : null}
                          {doc ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleReplace(value)}
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 dark:bg-indigo-500"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleDelete(value)}
                                className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/50"
                              >
                                {busy ? "…" : "Delete"}
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loadingList &&
        !loadError &&
        DOCUMENT_TYPES.every(({ value }) => !byType[value]) ? (
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            No documents yet. Upload your résumé and ID proofs to speed up
            onboarding.
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default UploadForm;
