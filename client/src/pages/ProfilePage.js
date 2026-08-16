import React, { useState, useCallback } from "react";
import ProfileForm from "../components/ProfileForm";
import { useOptionalProfile } from "../context/ProfileContext";

const Field = ({ label, value }) => (
  <div className="text-sm">
    <div className="text-slate-500 dark:text-slate-400">{label}</div>
    <div className="font-medium text-slate-900 dark:text-slate-100">{value || "-"}</div>
  </div>
);

const OnboardingSidebar = ({ onboarding, loading }) => {
  const pct = onboarding?.completionPercent ?? 0;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/90">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Onboarding progress</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Updates automatically when you save your profile.
        </p>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>Completion</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {loading ? <p className="text-xs text-slate-500 dark:text-slate-400">Refreshing…</p> : null}

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            Checklist
          </h3>
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {(onboarding?.checklist || []).map((item) => (
              <li
                key={item.id}
                className={`flex items-start gap-2 text-sm ${
                  item.done ? "text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"
                }`}
              >
                <span className="mt-0.5">{item.done ? "✓" : "○"}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const [open, setOpen] = useState(false);
  const ctx = useOptionalProfile();
  const savedProfile = ctx?.profile ?? null;
  const onboarding = ctx?.onboarding;
  const loading = ctx?.loading ?? false;
  const refreshProfile = ctx?.refreshProfile;

  const handleProfileLoaded = useCallback(() => {
    refreshProfile?.();
  }, [refreshProfile]);

  const handleSaved = useCallback(() => {
    refreshProfile?.();
  }, [refreshProfile]);

  const p = savedProfile;

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <aside className="space-y-6 xl:col-span-3">
          <OnboardingSidebar onboarding={onboarding} loading={loading} />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Quick tips</h3>
            <ul className="list-disc space-y-2 pl-4 text-xs text-slate-600 dark:text-slate-400">
              <li>Fields validate as you type after the first change.</li>
              <li>Save sends the same checks the server runs.</li>
              <li>Document upload is available in the Documents page.</li>
            </ul>
          </div>
        </aside>

        <div className="space-y-6 xl:col-span-9">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Employee profile</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  All sections are required for HR verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!savedProfile) return;
                  setOpen(true);
                }}
                disabled={!savedProfile}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:bg-slate-300 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
              >
                Preview saved profile
              </button>
            </div>
            <div className="p-4 md:p-6">
              <ProfileForm onProfileLoaded={handleProfileLoaded} onSaved={handleSaved} />
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg dark:bg-slate-900">
            <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Saved Profile</h2>

            {!p ? (
              <p className="text-slate-600 dark:text-slate-400">No profile saved</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Personal</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Full Name" value={p.personal?.fullName} />
                    <Field label="Email" value={p.personal?.email} />
                    <Field label="Phone" value={p.personal?.phone} />
                    <Field label="Gender" value={p.personal?.gender} />
                    <Field label="DOB" value={p.personal?.dob?.slice?.(0, 10)} />
                    <Field label="Place of Birth" value={p.personal?.placeOfBirth} />
                    <Field label="Nationality" value={p.personal?.nationality} />
                    <Field label="Present Address" value={p.personal?.address?.present} />
                    <Field label="Permanent Address" value={p.personal?.address?.permanent} />
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Bank</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Account Number" value={p.personal?.bankDetails?.accountNumber} />
                    <Field label="IFSC" value={p.personal?.bankDetails?.ifsc} />
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Academic</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Qualification" value={p.academic?.highestQualification} />
                    <Field label="University" value={p.academic?.university} />
                    <Field label="Passing Year" value={p.academic?.passingYear} />
                    <Field label="Grades" value={p.academic?.grades} />
                    <Field label="Branch" value={p.academic?.branch} />
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Professional</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Role" value={p.professional?.role} />
                    <Field label="Department" value={p.professional?.department} />
                    <Field label="Employment Type" value={p.professional?.employmentType} />
                    <Field label="Joining Date" value={p.professional?.joiningDate?.slice?.(0, 10)} />
                    <Field label="Work Location" value={p.professional?.workLocation} />
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Documents</h3>
                  {p.documents?.length ? (
                    p.documents.map((d, i) => (
                      <div
                        key={i}
                        className="mb-2 flex justify-between rounded border border-slate-200 p-2 dark:border-slate-700"
                      >
                        <span>{d.docType}</span>
                        <span>{d.status}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">No documents</p>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 rounded bg-slate-200 px-4 py-2 text-slate-900 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
