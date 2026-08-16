import React, { useCallback, useEffect, useState } from "react";
import api from "../api/client";
import { useToast } from "../context/ToastContext";
import { HrSpinner } from "../components/hr/HrSpinner";
import {
  BookOpen,
  Plus,
  Trash2,
  Megaphone,
  Users,
  Send,
  Pin,
  Archive,
} from "lucide-react";
import {
  validateModuleField,
  validateAnnouncementField,
} from "../utils/hrValidation";

export default function HrOnboardingToolsPage() {
  const toast = useToast();
  const [modules, setModules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modTitle, setModTitle] = useState("");
  const [modDesc, setModDesc] = useState("");
  const [modEst, setModEst] = useState(30);
  const [modPub, setModPub] = useState(true);
  const [moduleErrors, setModuleErrors] = useState({});
  const [announcementErrors, setAnnouncementErrors] = useState({});

  const [selEmp, setSelEmp] = useState({});
  const [selMod, setSelMod] = useState({});

  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annAudience, setAnnAudience] = useState("all_employees");
  const [annPinned, setAnnPinned] = useState(false);
  const [annExpires, setAnnExpires] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, eRes, aRes] = await Promise.all([
        api.get("/training/modules"),
        api.get("/profile"),
        api.get("/announcements"),
      ]);
      setModules(mRes.data?.data ?? []);
      setEmployees(eRes.data?.data ?? []);
      setAnnouncements(aRes.data?.data ?? []);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const createModule = async (e) => {
    e.preventDefault();
    const nextErrors = {
      title: validateModuleField("title", modTitle),
      estimatedMinutes: validateModuleField("estimatedMinutes", modEst),
    };
    if (nextErrors.title || nextErrors.estimatedMinutes) {
      setModuleErrors(nextErrors);
      toast.error(nextErrors.title || nextErrors.estimatedMinutes);
      return;
    }
    const t = modTitle.trim();
    try {
      const res = await api.post("/training/modules", {
        title: t,
        description: modDesc,
        estimatedMinutes: modEst,
        isPublished: modPub,
      });
      toast.success(res.data?.message || "Module created.");
      setModTitle("");
      setModDesc("");
      setModEst(30);
      setModPub(true);
      setModuleErrors({});
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Create failed");
    }
  };

  const togglePublish = async (mod) => {
    try {
      await api.patch(`/training/modules/${mod._id}`, {
        isPublished: !mod.isPublished,
      });
      toast.success("Module updated.");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || "Update failed");
    }
  };

  const removeModule = async (id) => {
    if (!window.confirm("Delete this module and its assignments?")) return;
    try {
      await api.delete(`/training/modules/${id}`);
      toast.success("Module removed.");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || "Delete failed");
    }
  };

  const runAssign = async () => {
    const employeeUserIds = Object.keys(selEmp).filter((id) => selEmp[id]);
    const moduleIds = Object.keys(selMod).filter((id) => selMod[id]);
    if (!employeeUserIds.length || !moduleIds.length) {
      toast.error("Select at least one employee and one module.");
      return;
    }
    try {
      const res = await api.post("/training/assignments", {
        employeeUserIds,
        moduleIds,
      });
      toast.success(res.data?.message || "Assigned.");
      setSelEmp({});
      setSelMod({});
      window.dispatchEvent(new Event("app:notifications-changed"));
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || "Assign failed");
    }
  };

  const publishAnnouncement = async (e) => {
    e.preventDefault();
    const nextErrors = {
      title: validateAnnouncementField("title", annTitle),
      body: validateAnnouncementField("body", annBody),
    };
    if (nextErrors.title || nextErrors.body) {
      setAnnouncementErrors(nextErrors);
      toast.error(nextErrors.title || nextErrors.body);
      return;
    }
    const t = annTitle.trim();
    const b = annBody.trim();
    const payload = {
      title: t,
      body: b,
      audience: annAudience,
      pinned: annPinned,
    };
    if (annAudience === "selected") {
      const ids = Object.keys(selEmp).filter((id) => selEmp[id]);
      if (!ids.length) {
        toast.error("Select employees for a targeted announcement.");
        return;
      }
      payload.targetUserIds = ids;
    }
    if (annExpires.trim()) {
      payload.expiresAt = new Date(annExpires).toISOString();
    }
    try {
      const res = await api.post("/announcements", payload);
      toast.success(res.data?.message || "Published.");
      setAnnTitle("");
      setAnnBody("");
      setAnnPinned(false);
      setAnnExpires("");
      setAnnAudience("all_employees");
      setAnnouncementErrors({});
      load();
      window.dispatchEvent(new Event("app:notifications-changed"));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Publish failed");
    }
  };

  const archiveAnnouncement = async (id) => {
    try {
      await api.patch(`/announcements/${id}`, { active: false });
      toast.success("Announcement archived.");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || "Archive failed");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            HR tools
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Learning & announcements
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            Create training modules, assign them to hires, and publish dashboard
            announcements with automatic employee notifications.
          </p>
        </header>

        {loading ? <HrSpinner label="Loading tools…" /> : null}

        {!loading ? (
          <div className="space-y-12">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:shadow-lg sm:p-8">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
                <BookOpen className="h-6 w-6" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Training modules</h2>
              </div>

              <form
                onSubmit={createModule}
                noValidate
                className="mt-6 grid gap-4 border-b border-slate-200 pb-8 dark:border-slate-800 md:grid-cols-2"
              >
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-500">Title</label>
                  <input
                    value={modTitle}
                    onChange={(e) => {
                      const v = e.target.value;
                      setModTitle(v);
                      setModuleErrors((prev) => ({ ...prev, title: validateModuleField("title", v) }));
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="e.g. Security & compliance basics"
                  />
                  {moduleErrors.title ? (
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{moduleErrors.title}</p>
                  ) : null}
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-500">
                    Description
                  </label>
                  <textarea
                    value={modDesc}
                    onChange={(e) => setModDesc(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">
                    Est. minutes
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={modEst}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setModEst(v);
                      setModuleErrors((prev) => ({
                        ...prev,
                        estimatedMinutes: validateModuleField("estimatedMinutes", v),
                      }));
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  {moduleErrors.estimatedMinutes ? (
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{moduleErrors.estimatedMinutes}</p>
                  ) : null}
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={modPub}
                      onChange={(e) => setModPub(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600"
                    />
                    Published (visible when assigned)
                  </label>
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    <Plus className="h-4 w-4" />
                    Create module
                  </button>
                </div>
              </form>

              <div className="mt-8 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                      <th className="py-3 pr-4 font-medium">Title</th>
                      <th className="py-3 pr-4 font-medium">Minutes</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                      <th className="py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((m) => (
                      <tr key={m._id} className="border-b border-slate-200/80 dark:border-slate-800/80">
                        <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">{m.title}</td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{m.estimatedMinutes}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={
                              m.isPublished
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-300"
                            }
                          >
                            {m.isPublished ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => togglePublish(m)}
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              Toggle publish
                            </button>
                            <button
                              type="button"
                              onClick={() => removeModule(m._id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-900/50 px-2 py-1 text-xs text-rose-300 hover:bg-rose-950/40"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!modules.length ? (
                  <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    No modules yet. Create one above.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:shadow-lg sm:p-8">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-300">
                <Users className="h-6 w-6" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Assign training</h2>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Select employees and modules, then assign. Employees receive a
                notification.
              </p>

              <div className="mt-6 grid gap-8 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Employees</h3>
                  <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    {employees.map((emp) => (
                      <label
                        key={emp.userId}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      >
                        <input
                          type="checkbox"
                          checked={!!selEmp[emp.userId]}
                          onChange={(e) =>
                            setSelEmp((p) => ({
                              ...p,
                              [emp.userId]: e.target.checked,
                            }))
                          }
                        />
                        <span className="truncate text-sm">
                          {emp.personal?.fullName || "—"}{" "}
                          <span className="text-slate-500 dark:text-slate-400">
                            ({emp.personal?.email || emp.userId})
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Modules</h3>
                  <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    {modules.map((m) => (
                      <label
                        key={m._id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      >
                        <input
                          type="checkbox"
                          checked={!!selMod[m._id]}
                          onChange={(e) =>
                            setSelMod((p) => ({
                              ...p,
                              [m._id]: e.target.checked,
                            }))
                          }
                        />
                        <span className="text-sm">{m.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={runAssign}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
              >
                <Send className="h-4 w-4" />
                Assign selected
              </button>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:shadow-lg sm:p-8">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Megaphone className="h-6 w-6" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Announcements</h2>
              </div>

              <form onSubmit={publishAnnouncement} noValidate className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500">Title</label>
                  <input
                    value={annTitle}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAnnTitle(v);
                      setAnnouncementErrors((prev) => ({
                        ...prev,
                        title: validateAnnouncementField("title", v),
                      }));
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  {announcementErrors.title ? (
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{announcementErrors.title}</p>
                  ) : null}
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Body</label>
                  <textarea
                    value={annBody}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAnnBody(v);
                      setAnnouncementErrors((prev) => ({
                        ...prev,
                        body: validateAnnouncementField("body", v),
                      }));
                    }}
                    rows={5}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                  {announcementErrors.body ? (
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{announcementErrors.body}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="aud"
                      checked={annAudience === "all_employees"}
                      onChange={() => setAnnAudience("all_employees")}
                    />
                    All employees
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="aud"
                      checked={annAudience === "selected"}
                      onChange={() => setAnnAudience("selected")}
                    />
                    Selected employees
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={annPinned}
                      onChange={(e) => setAnnPinned(e.target.checked)}
                    />
                    <Pin className="h-3.5 w-3.5" />
                    Pin to top
                  </label>
                </div>
                {annAudience === "selected" ? (
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    {employees.map((emp) => (
                      <label
                        key={emp.userId}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={!!selEmp[emp.userId]}
                          onChange={(e) =>
                            setSelEmp((p) => ({
                              ...p,
                              [emp.userId]: e.target.checked,
                            }))
                          }
                        />
                        <span className="truncate">
                          {emp.personal?.fullName || emp.userId}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : null}
                <div>
                  <label className="text-xs font-medium text-slate-500">
                    Expires (optional, local)
                  </label>
                  <input
                    type="datetime-local"
                    value={annExpires}
                    onChange={(e) => setAnnExpires(e.target.value)}
                    className="mt-1 w-full max-w-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-500"
                >
                  Publish announcement
                </button>
              </form>

              <div className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-400">Recent</h3>
                <ul className="mt-4 space-y-3">
                  {announcements.slice(0, 12).map((a) => (
                    <li
                      key={a._id}
                      className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white">{a.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                          {a.body}
                        </p>
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-500">
                          {a.audience === "all_employees" ? "All staff" : "Selected"} ·{" "}
                          {a.active ? "Active" : "Archived"}
                          {a.pinned ? " · Pinned" : ""}
                        </p>
                      </div>
                      {a.active ? (
                        <button
                          type="button"
                          onClick={() => archiveAnnouncement(a._id)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Archive className="h-3.5 w-3.5" />
                          Archive
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        ) : null}
    </div>
  );
}
