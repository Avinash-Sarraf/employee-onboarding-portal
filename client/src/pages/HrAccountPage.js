import React, { useEffect, useState, useCallback } from "react";
import { getToken, setAuth } from "../utils/auth";
import api from "../api/client";
import { useToast } from "../context/ToastContext";
import { HrSpinner } from "../components/hr/HrSpinner";
import { validateHrAccountField } from "../utils/hrValidation";

const HrAccountPage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    jobTitle: "",
    department: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/hr/me");
      const u = res.data?.data;
      if (!u) throw new Error("empty");
      setForm({
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        jobTitle: u.jobTitle || "",
        department: u.department || "",
      });
      setErrors({});
    } catch (e) {
      toast.error(
        e.response?.data?.message || e.message || "Could not load your profile."
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const onChange = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateHrAccountField(field, value) }));
  };

  const validate = () => {
    const next = {};
    ["name", "phone", "jobTitle", "department"].forEach((field) => {
      const err = validateHrAccountField(field, form[field]);
      if (err) next[field] = err;
    });
    return next;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await api.put("/hr/me", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        jobTitle: form.jobTitle.trim(),
        department: form.department.trim(),
      });
      const u = res.data?.data;
      const token = getToken();
      if (token && u) {
        setAuth(token, u);
        window.dispatchEvent(new Event("app:auth-changed"));
      }
      toast.success(res.data?.message || "Profile saved.");
      if (u) {
        setForm((prev) => ({
          ...prev,
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          jobTitle: u.jobTitle || "",
          department: u.department || "",
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-10">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">HR profile</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Update how you appear in the portal. Email is read-only; contact an administrator to
          change it.
        </p>
      </header>

      {loading ? (
        <HrSpinner label="Loading your profile…" />
      ) : (
        <form
          onSubmit={handleSave}
          noValidate
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/40"
        >
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Full name
            </label>
            <input
              value={form.name}
              onChange={onChange("name")}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            {touched.name && errors.name ? (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.name}</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Email
            </label>
            <input
              readOnly
              value={form.email}
              className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Phone
            </label>
            <input
              value={form.phone}
              onChange={onChange("phone")}
              onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="+91 …"
            />
            {touched.phone && errors.phone ? (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.phone}</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Job title
            </label>
            <input
              value={form.jobTitle}
              onChange={onChange("jobTitle")}
              onBlur={() => setTouched((prev) => ({ ...prev, jobTitle: true }))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="e.g. HR Business Partner"
            />
            {touched.jobTitle && errors.jobTitle ? (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.jobTitle}</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Department / team
            </label>
            <input
              value={form.department}
              onChange={onChange("department")}
              onBlur={() => setTouched((prev) => ({ ...prev, department: true }))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="e.g. People Operations"
            />
            {touched.department && errors.department ? (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.department}</p>
            ) : null}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default HrAccountPage;
