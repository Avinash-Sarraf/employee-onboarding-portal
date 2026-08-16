import React, { useEffect, useMemo, useState, useCallback } from "react";
import api from "../api/client";
import { getUser } from "../utils/auth";
import { useToast } from "../context/ToastContext";
import { useOptionalProfile } from "../context/ProfileContext";
import {
  QUALIFICATIONS_IT,
  makeBlank,
  validateAll,
  naExperience,
  dirtyValidationKey,
} from "./profileFormValidation";
import {
  FormField as Field,
  TextInput as Input,
  SelectInput as Select,
  Chip,
} from "./forms/FormControls";
import { DateInput } from "./forms/DateInput";
import { cardClass, cardHeaderClass, subheadingClass } from "../constants/themeClasses";

const ProfileForm = ({ onProfileLoaded, onSaved }) => {
  const toast = useToast();
  const profileCtx = useOptionalProfile();
  const storedUser = getUser() || {};
  const userId = profileCtx?.userId || storedUser?.id;

  const userEmail =
    profileCtx?.user?.email || getUser()?.email || "";

  const [formData, setFormData] = useState(makeBlank(userId, userEmail));
  const [isEditMode, setIsEditMode] = useState(true);
  const [loading, setLoading] = useState(false);

  const [loadedForUser, setLoadedForUser] = useState(null);

  useEffect(() => {
    setLoadedForUser(null);
  }, [userId]);

  const [touched, setTouched] = useState({});
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [dirty, setDirty] = useState({});
  const [serverFieldErrors, setServerFieldErrors] = useState({});

  const [skillInput, setSkillInput] = useState("");

  const touch = (key) => setTouched((p) => ({ ...p, [key]: true }));

  const markDirty = useCallback((key) => {
    if (!key) return;
    setDirty((p) => ({ ...p, [key]: true }));
    setServerFieldErrors((p) => {
      if (!p[key]) return p;
      const next = { ...p };
      delete next[key];
      return next;
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      if (loadedForUser === userId) return;

      setLoading(true);
      try {
        const res = await api.get("/profile/me");
        const body = res.data?.data;
        if (!body) throw new Error("empty");

        const merged = {
          ...makeBlank(userId, userEmail),
          ...body,
          userId,
          personal: {
            ...makeBlank(userId, userEmail).personal,
            ...(body.personal || {}),
            email: body.personal?.email || userEmail,
            dob: body.personal?.dob
              ? String(body.personal.dob).slice(0, 10)
              : "",
          },
          professional: {
            ...makeBlank(userId, userEmail).professional,
            ...(body.professional || {}),
            role: String(body.professional?.role || "").trim() || "NA",
            department: String(body.professional?.department || "").trim() || "NA",
            joiningDate: body.professional?.joiningDate
              ? String(body.professional.joiningDate).slice(0, 10)
              : "",
          },
          ndaAgreement: {
            ...makeBlank(userId, userEmail).ndaAgreement,
            ...(body.ndaAgreement || {}),
            signedOn: body.ndaAgreement?.signedOn
              ? String(body.ndaAgreement.signedOn).slice(0, 10)
              : "",
          },
        };

        setFormData(merged);
        setIsEditMode(false);
        setServerFieldErrors({});
        setDirty({});
        onProfileLoaded && onProfileLoaded(merged);
      } catch (e) {
        if (e?.response?.status === 404) {
          const blank = makeBlank(userId, userEmail);
          setFormData(blank);
          setIsEditMode(true);
          setServerFieldErrors({});
          setDirty({});
          onProfileLoaded && onProfileLoaded(null);
        } else {
          const blank = makeBlank(userId, userEmail);
          setFormData(blank);
          setIsEditMode(true);
          onProfileLoaded && onProfileLoaded(null);
          toast.error(
            e?.response?.data?.message || "Unable to load your profile."
          );
        }
      } finally {
        setLoadedForUser(userId);
        setLoading(false);
      }
    };

    load();
  }, [userId, userEmail, loadedForUser, onProfileLoaded, toast]);

  const computedErrors = useMemo(
    () => validateAll(formData, { employeeSelfService: true }),
    [formData]
  );

  const fieldError = useCallback(
    (key) => {
      if (serverFieldErrors[key]) return serverFieldErrors[key];
      if (dirty[key] || saveAttempted || touched[key])
        return computedErrors[key] || "";
      return "";
    },
    [serverFieldErrors, dirty, saveAttempted, touched, computedErrors]
  );

  const handleChange = (section, field, value, subfield = null) => {
    if (!isEditMode) return;

    const dk = dirtyValidationKey(section, field, subfield);
    if (dk) markDirty(dk);
    if (section === "personal" && field === "dob") {
      markDirty("passingYear");
    }

    setFormData((prev) => {
      const updated = { ...prev };

      if (!section) {
        updated[field] = value;
      } else if (subfield) {
        updated[section] = {
          ...prev[section],
          [field]: {
            ...prev[section][field],
            [subfield]: value,
          },
        };
      } else {
        updated[section] = {
          ...prev[section],
          [field]: value,
        };
      }

      if (section === "ndaAgreement" && field === "signed" && value === false) {
        updated.ndaAgreement = {
          ...updated.ndaAgreement,
          signedOn: "",
          documentId: "",
        };
      }

      return updated;
    });
  };

  const addSkill = () => {
    if (!isEditMode) return;
    const s = String(skillInput || "").trim();
    if (!s) return;

    markDirty("technicalSkills");
    setFormData((prev) => ({
      ...prev,
      technicalSkills: [...prev.technicalSkills, s],
    }));
    setSkillInput("");
    touch("technicalSkills");
  };

  const removeSkill = (index) => {
    if (!isEditMode) return;
    const updated = [...formData.technicalSkills];
    updated.splice(index, 1);
    setFormData({ ...formData, technicalSkills: updated });
    markDirty("technicalSkills");
    touch("technicalSkills");
  };

  const addExperience = () => {
    if (!isEditMode) return;
    setFormData((prev) => ({
      ...prev,
      pastExperience: [
        ...prev.pastExperience,
        { company: "", role: "", duration: "", location: "" },
      ],
    }));
  };

  const handleExpChange = (index, field, value) => {
    if (!isEditMode) return;
    const map = {
      company: `pastCompany_${index}`,
      role: `pastRole_${index}`,
      duration: `pastDuration_${index}`,
      location: `pastLocation_${index}`,
    };
    if (map[field]) markDirty(map[field]);
    const updated = [...formData.pastExperience];
    updated[index][field] = value;
    setFormData({ ...formData, pastExperience: updated });
  };

  const handleSave = async () => {
    setSaveAttempted(true);

    let payload = { ...formData, userId };

    if (!payload.pastExperience || payload.pastExperience.length === 0) {
      payload.pastExperience = naExperience();
    }

    const errors = validateAll(payload, { employeeSelfService: true });

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }

    const {
      role: _r,
      department: _d,
      joiningDate: _j,
      employmentType: _e,
      workLocation: _w,
      ...professionalRest
    } = payload.professional || {};
    const securePayload = {
      ...payload,
      professional: professionalRest,
    };

    try {
      const res = await api.post("/profile", securePayload);
      const saved = res.data?.data;
      const normalized = saved
        ? {
            ...saved,
            personal: {
              ...saved.personal,
              dob: saved.personal?.dob
                ? String(saved.personal.dob).slice(0, 10)
                : "",
            },
            professional: {
              ...saved.professional,
              joiningDate: saved.professional?.joiningDate
                ? String(saved.professional.joiningDate).slice(0, 10)
                : "",
            },
            ndaAgreement: {
              ...saved.ndaAgreement,
              signedOn: saved.ndaAgreement?.signedOn
                ? String(saved.ndaAgreement.signedOn).slice(0, 10)
                : "",
            },
          }
        : payload;
      setFormData(normalized);
      setIsEditMode(false);
      setServerFieldErrors({});
      setDirty({});

      if (res.data?.meta?.onboarding && profileCtx?.setOnboarding) {
        profileCtx.setOnboarding(res.data.meta.onboarding);
      }

      if (typeof onSaved === "function") {
        onSaved(normalized);
      }

      window.dispatchEvent(new Event("app:profile-changed"));
      
      // Force a profile refresh to ensure onboarding data is updated
      if (profileCtx?.refreshProfile) {
        setTimeout(() => profileCtx.refreshProfile(), 100);
      }
      
      toast.success("Your profile was saved successfully.");
    } catch (e) {
      console.error(e);
      const fe = e.response?.data?.fieldErrors;
      if (fe && typeof fe === "object") {
        setServerFieldErrors(fe);
        toast.error(
          e.response?.data?.message ||
            "The server could not validate some fields."
        );
      } else {
        toast.error(
          e.response?.data?.message || "Could not save profile. Try again."
        );
      }
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setTouched({});
    setSaveAttempted(false);
    setServerFieldErrors({});
    setDirty({});
  };

  if (!userId) {
    return (
      <div className="py-6 text-center text-sm text-slate-600 dark:text-slate-400">
        Please log in as an employee to manage your profile.
      </div>
    );
  }

  if (loading && loadedForUser !== userId) {
    return (
      <div className="py-6 text-center text-sm text-slate-600 dark:text-slate-400">Loading profile…</div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className={cardClass}>
        <div className={cardHeaderClass}>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Employee Profile</h2>
        </div>

        <div className="px-6 py-6 space-y-10">
          <section>
            <div className="mb-4">
              <h3 className={subheadingClass}>
                Personal Details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Full Name">
                <Input
                  value={formData.personal.fullName}
                  disabled={!isEditMode}
                  placeholder="Enter full name"
                  onChange={(e) =>
                    handleChange("personal", "fullName", e.target.value)
                  }
                  onBlur={() => touch("fullName")}
                  error={fieldError("fullName")}
                />
              </Field>

              <Field label="Date of Birth">
                <DateInput
                  value={formData.personal.dob}
                  disabled={!isEditMode}
                  onChange={(e) =>
                    handleChange("personal", "dob", e.target.value)
                  }
                  onBlur={() => touch("dob")}
                  error={fieldError("dob")}
                />
              </Field>

              <Field label="Gender">
                <Select
                  value={formData.personal.gender}
                  disabled={!isEditMode}
                  onChange={(e) =>
                    handleChange("personal", "gender", e.target.value)
                  }
                  onBlur={() => touch("gender")}
                  error={fieldError("gender")}
                >
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </Select>
              </Field>

              <Field label="Phone" hint="Indian mobile">
                <Input
                  value={formData.personal.phone}
                  disabled={!isEditMode}
                  placeholder="e.g. 9876543210"
                  inputMode="numeric"
                  onChange={(e) =>
                    handleChange("personal", "phone", e.target.value)
                  }
                  onBlur={() => touch("phone")}
                  error={fieldError("phone")}
                />
              </Field>

              <Field label="Email">
                <Input
                  value={formData.personal.email}
                  disabled={!isEditMode}
                  placeholder="e.g. name@gmail.com"
                  onChange={(e) =>
                    handleChange("personal", "email", e.target.value)
                  }
                  onBlur={() => touch("email")}
                  error={fieldError("email")}
                />
              </Field>

              <Field label="Place of Birth">
                <Input
                  value={formData.personal.placeOfBirth}
                  disabled={!isEditMode}
                  placeholder="e.g. Chennai"
                  onChange={(e) =>
                    handleChange("personal", "placeOfBirth", e.target.value)
                  }
                  onBlur={() => touch("placeOfBirth")}
                  error={fieldError("placeOfBirth")}
                />
              </Field>

              <Field label="Nationality">
                <Input
                  value={formData.personal.nationality}
                  disabled={!isEditMode}
                  placeholder="e.g. Indian"
                  onChange={(e) =>
                    handleChange("personal", "nationality", e.target.value)
                  }
                  onBlur={() => touch("nationality")}
                  error={fieldError("nationality")}
                />
              </Field>

              <Field label="Present Address">
                <Input
                  value={formData.personal.address.present}
                  disabled={!isEditMode}
                  placeholder="Enter present address"
                  onChange={(e) =>
                    handleChange(
                      "personal",
                      "address",
                      e.target.value,
                      "present"
                    )
                  }
                  onBlur={() => touch("presentAddress")}
                  error={fieldError("presentAddress")}
                />
              </Field>

              <Field label="Permanent Address">
                <Input
                  value={formData.personal.address.permanent}
                  disabled={!isEditMode}
                  placeholder="Enter permanent address"
                  onChange={(e) =>
                    handleChange(
                      "personal",
                      "address",
                      e.target.value,
                      "permanent"
                    )
                  }
                  onBlur={() => touch("permanentAddress")}
                  error={fieldError("permanentAddress")}
                />
              </Field>
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h3 className={subheadingClass}>
                Bank Details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Account Number">
                <Input
                  value={formData.personal.bankDetails.accountNumber}
                  disabled={!isEditMode}
                  placeholder="9–18 digits"
                  inputMode="numeric"
                  onChange={(e) =>
                    handleChange(
                      "personal",
                      "bankDetails",
                      e.target.value,
                      "accountNumber"
                    )
                  }
                  onBlur={() => touch("accountNumber")}
                  error={fieldError("accountNumber")}
                />
              </Field>

              <Field label="IFSC Code">
                <Input
                  value={formData.personal.bankDetails.ifsc}
                  disabled={!isEditMode}
                  placeholder="e.g. HDFC0ABC123"
                  onChange={(e) =>
                    handleChange(
                      "personal",
                      "bankDetails",
                      e.target.value,
                      "ifsc"
                    )
                  }
                  onBlur={() => touch("ifsc")}
                  error={fieldError("ifsc")}
                />
              </Field>
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h3 className={subheadingClass}>
                Academic Details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Highest Qualification">
                <Select
                  value={formData.academic.highestQualification}
                  disabled={!isEditMode}
                  onChange={(e) =>
                    handleChange(
                      "academic",
                      "highestQualification",
                      e.target.value
                    )
                  }
                  onBlur={() => touch("highestQualification")}
                  error={fieldError("highestQualification")}
                >
                  <option value="">Select</option>
                  {QUALIFICATIONS_IT.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="University">
                <Input
                  value={formData.academic.university}
                  disabled={!isEditMode}
                  placeholder="Alphabets only"
                  onChange={(e) =>
                    handleChange("academic", "university", e.target.value)
                  }
                  onBlur={() => touch("university")}
                  error={fieldError("university")}
                />
              </Field>

              <Field label="Passing Year">
                <Input
                  value={formData.academic.passingYear}
                  disabled={!isEditMode}
                  placeholder="YYYY"
                  inputMode="numeric"
                  onChange={(e) =>
                    handleChange("academic", "passingYear", e.target.value)
                  }
                  onBlur={() => touch("passingYear")}
                  error={fieldError("passingYear")}
                />
              </Field>

              <Field label="Grades (0–100)">
                <Input
                  value={formData.academic.grades}
                  disabled={!isEditMode}
                  placeholder="e.g. 85.5"
                  inputMode="decimal"
                  onChange={(e) =>
                    handleChange("academic", "grades", e.target.value)
                  }
                  onBlur={() => touch("grades")}
                  error={fieldError("grades")}
                />
              </Field>

              <Field label="Branch">
                <Input
                  value={formData.academic.branch}
                  disabled={!isEditMode}
                  placeholder="Alphabets only"
                  onChange={(e) =>
                    handleChange("academic", "branch", e.target.value)
                  }
                  onBlur={() => touch("branch")}
                  error={fieldError("branch")}
                />
              </Field>
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h3 className={subheadingClass}>
                Professional Details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field
                label="Role"
                hint="Assigned by HR after verification"
              >
                <Input
                  value={formData.professional.role || "NA"}
                  disabled
                  readOnly
                  placeholder="NA"
                />
              </Field>

              <Field
                label="Department"
                hint="Assigned by HR after verification"
              >
                <Input
                  value={formData.professional.department || "NA"}
                  disabled
                  readOnly
                  placeholder="NA"
                />
              </Field>

              <Field label="Employment Type">
                <Select
                  value={formData.professional.employmentType}
                  disabled
                  readOnly
                  onBlur={() => touch("employmentType")}
                  error={fieldError("employmentType")}
                >
                  <option value="">Select</option>
                  <option>Full-time</option>
                  <option>Intern</option>
                  <option>Contract</option>
                </Select>
              </Field>

              <Field label="Joining Date">
                <DateInput
                  value={formData.professional.joiningDate}
                  disabled
                  readOnly
                  onBlur={() => touch("joiningDate")}
                  error={fieldError("joiningDate")}
                />
              </Field>

              <Field label="Work Location">
                <Input
                  value={formData.professional.workLocation}
                  disabled
                  readOnly
                  placeholder="Enter work location"
                  onBlur={() => touch("workLocation")}
                  error={fieldError("workLocation")}
                />
              </Field>
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h3 className={subheadingClass}>
                Technical Skills
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={skillInput}
                disabled={!isEditMode}
                placeholder="Type skill (e.g. React)"
                onChange={(e) => {
                  setSkillInput(e.target.value);
                  markDirty("technicalSkills");
                }}
                onBlur={() => touch("technicalSkills")}
              />
              <button
                type="button"
                onClick={addSkill}
                disabled={!isEditMode}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:bg-slate-300"
              >
                Add Skill
              </button>
            </div>

            {fieldError("technicalSkills") ? (
              <p className="mt-2 text-xs text-red-600">
                {fieldError("technicalSkills")}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              {formData.technicalSkills.map((s, i) => (
                <Chip
                  key={`${s}-${i}`}
                  disabled={!isEditMode}
                  onRemove={() => removeSkill(i)}
                >
                  {s}
                </Chip>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h3 className={subheadingClass}>
                Past Experience
              </h3>
            </div>

            {isEditMode && (
              <button
                type="button"
                onClick={addExperience}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                + Add Experience
              </button>
            )}

            <div className="mt-4 space-y-4">
              {formData.pastExperience.map((exp, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Company">
                      <Input
                        value={exp.company}
                        disabled={!isEditMode}
                        onChange={(e) =>
                          handleExpChange(i, "company", e.target.value)
                        }
                        onBlur={() => touch(`pastCompany_${i}`)}
                        error={fieldError(`pastCompany_${i}`)}
                      />
                    </Field>
                    <Field label="Role">
                      <Input
                        value={exp.role}
                        disabled={!isEditMode}
                        onChange={(e) =>
                          handleExpChange(i, "role", e.target.value)
                        }
                        onBlur={() => touch(`pastRole_${i}`)}
                        error={fieldError(`pastRole_${i}`)}
                      />
                    </Field>
                    <Field label="Duration (months)">
                      <Input
                        value={exp.duration}
                        disabled={!isEditMode}
                        inputMode="numeric"
                        onChange={(e) =>
                          handleExpChange(i, "duration", e.target.value)
                        }
                        onBlur={() => touch(`pastDuration_${i}`)}
                        error={fieldError(`pastDuration_${i}`)}
                      />
                    </Field>
                    <Field label="Location">
                      <Input
                        value={exp.location}
                        disabled={!isEditMode}
                        onChange={(e) =>
                          handleExpChange(i, "location", e.target.value)
                        }
                        onBlur={() => touch(`pastLocation_${i}`)}
                        error={fieldError(`pastLocation_${i}`)}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h3 className={subheadingClass}>NDA</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="NDA Signed">
                <Select
                  value={String(formData.ndaAgreement.signed)}
                  disabled={!isEditMode}
                  onChange={(e) =>
                    handleChange(
                      "ndaAgreement",
                      "signed",
                      e.target.value === "true"
                    )
                  }
                  onBlur={() => touch("ndaSigned")}
                  error={fieldError("ndaSigned")}
                >
                  <option value="">Select</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              </Field>

              <Field label="Signed Date" hint="Today or last 1 month">
                <DateInput
                  value={formData.ndaAgreement.signedOn}
                  disabled={
                    !isEditMode || formData.ndaAgreement.signed !== true
                  }
                  onChange={(e) =>
                    handleChange("ndaAgreement", "signedOn", e.target.value)
                  }
                  onBlur={() => touch("signedOn")}
                  error={fieldError("signedOn")}
                />
              </Field>

              <Field label="Document ID" hint="Alphanumeric">
                <Input
                  value={formData.ndaAgreement.documentId}
                  disabled={
                    !isEditMode || formData.ndaAgreement.signed !== true
                  }
                  placeholder="e.g. NDA12345"
                  onChange={(e) =>
                    handleChange("ndaAgreement", "documentId", e.target.value)
                  }
                  onBlur={() => touch("documentId")}
                  error={fieldError("documentId")}
                />
              </Field>
            </div>
          </section>

          <div className="mt-10 border-t border-slate-200 pt-6 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={handleEdit}
              disabled={isEditMode}
              className="w-full sm:w-auto rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:bg-slate-300"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!isEditMode}
              className="w-full sm:w-auto rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:bg-slate-300"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
