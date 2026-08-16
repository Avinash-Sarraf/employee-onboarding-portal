/**
 * Profile validation + onboarding metadata (mirrors client rules).
 * CommonJS for Node — keep in sync with client/src/components/profileFormValidation.js
 */

const QUALIFICATIONS_IT = [
  "B.Tech (IT)",
  "B.Tech (CSE)",
  "B.E (IT)",
  "B.E (CSE)",
  "BCA",
  "MCA",
  "M.Tech (IT)",
  "M.Tech (CSE)",
  "M.Sc (IT)",
  "B.Sc (IT)",
  "Diploma (IT)",
  "Diploma (CSE)",
  "Other (IT Related)",
];

const IT_SKILLS = [
  "C",
  "C++",
  "Java",
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "MongoDB",
  "MySQL",
  "PostgreSQL",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Git",
  "GitHub",
  "Docker",
  "AWS",
  "REST API",
];

const onlyLetters = (v) => /^[A-Za-z ]+$/.test(String(v || "").trim());
const isEmail = (v) =>
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
    String(v || "").trim()
  );

const parseDate = (yyyyMmDd) => {
  if (!yyyyMmDd) return null;
  const d = new Date(yyyyMmDd);
  return Number.isNaN(d.getTime()) ? null : d;
};

const yearsBetween = (fromDate, toDate) => {
  let years = toDate.getFullYear() - fromDate.getFullYear();
  const m = toDate.getMonth() - fromDate.getMonth();
  if (m < 0 || (m === 0 && toDate.getDate() < fromDate.getDate())) years--;
  return years;
};

const normalizeIndianPhone = (raw) => {
  const s = String(raw || "").trim();
  const digits = s.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  if (digits.length === 10) return digits;
  return digits;
};

const isIndianMobile = (raw) => {
  const n = normalizeIndianPhone(raw);
  return /^[6-9][0-9]{9}$/.test(n);
};

const isValidYear = (v) => /^[0-9]{4}$/.test(String(v || "").trim());

const isGrade = (v) => {
  const s = String(v || "").trim();
  if (!s) return false;
  if (!/^\d+(\.\d+)?$/.test(s)) return false;
  const num = Number(s);
  return Number.isFinite(num) && num >= 0 && num <= 100;
};

const isDurationNumber = (v) => /^[0-9]+$/.test(String(v || "").trim());

const isAllowedSkill = (skill) => {
  const s = String(skill || "").trim();
  if (!s) return false;
  return IT_SKILLS.map((x) => x.toLowerCase()).includes(s.toLowerCase());
};

const isAlphaNum = (v) => /^[A-Za-z0-9]+$/.test(String(v || "").trim());

const startOfToday = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const subtractMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
};

const isDateInRange = (dateStr, minDate, maxDate) => {
  const d = parseDate(dateStr);
  if (!d) return false;
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);

  const min = new Date(minDate);
  min.setHours(0, 0, 0, 0);

  const max = new Date(maxDate);
  max.setHours(0, 0, 0, 0);

  return x >= min && x <= max;
};

const naExperience = () => [
  { company: "NA", role: "NA", duration: "0", location: "NA" },
];

const makeBlank = (userId, email) => ({
  userId: userId || "",
  personal: {
    fullName: "",
    dob: "",
    gender: "",
    phone: "",
    email: email || "",
    placeOfBirth: "",
    nationality: "",
    address: { present: "", permanent: "" },
    bankDetails: { accountNumber: "", ifsc: "" },
  },
  academic: {
    highestQualification: "",
    university: "",
    passingYear: "",
    grades: "",
    branch: "",
  },
  professional: {
    role: "NA",
    department: "NA",
    employmentType: "",
    joiningDate: "",
    workLocation: "",
  },
  technicalSkills: [],
  pastExperience: [],
  ndaAgreement: { signed: false, signedOn: "", documentId: "" },
});

const getPassingYearBounds = (dobStr) => {
  const nowY = new Date().getFullYear();
  const dob = parseDate(String(dobStr || "").trim());
  const min = dob ? dob.getFullYear() + 18 : nowY;
  const max = nowY + 1;
  return { min, max };
};

const validatePassingYear = (passingYear, dobStr) => {
  const raw = String(passingYear ?? "").trim();
  if (!raw) return "Passing year is required.";
  if (!isValidYear(raw)) return "Enter a valid 4-digit passing year.";
  const y = Number(raw);
  const { min, max } = getPassingYearBounds(dobStr);
  if (y < min) {
    return `Passing year must be at least ${min} (18 years after your birth year).`;
  }
  if (y > max) {
    return `Passing year cannot be later than ${max}.`;
  }
  return null;
};

const validateAll = (data, options = {}) => {
  const { employeeSelfService = false } = options;
  const err = {};
  if (!String(data.userId || "").trim()) {
    err.userId = "Session missing. Please login again.";
    return err;
  }

  const fullName = String(data.personal?.fullName || "").trim();
  if (!fullName) err.fullName = "Full name is required.";
  else if (fullName.length < 3)
    err.fullName = "Full name must be at least 3 characters.";
  else if (!onlyLetters(fullName))
    err.fullName = "Full name must contain only alphabets.";

  const dobStr = String(
    data.personal?.dob instanceof Date
      ? data.personal.dob.toISOString().slice(0, 10)
      : data.personal?.dob || ""
  ).trim();
  if (!dobStr) err.dob = "Date of birth is required.";
  else {
    const dob = parseDate(dobStr);
    if (!dob) err.dob = "Enter a valid date of birth.";
    else {
      const age = yearsBetween(dob, new Date());
      if (age < 19 || age > 50) err.dob = "Age must be between 19 and 50.";
    }
  }

  const gender = String(data.personal?.gender || "").trim();
  if (!gender) err.gender = "Gender is required.";

  const phone = String(data.personal?.phone || "").trim();
  if (!phone) err.phone = "Phone number is required.";
  else if (!isIndianMobile(phone))
    err.phone = "Enter a valid Indian mobile number.";

  const email = String(data.personal?.email || "").trim();
  if (!email) err.email = "Email is required.";
  else if (!isEmail(email)) err.email = "Enter a valid email address.";

  const pob = String(data.personal?.placeOfBirth || "").trim();
  if (!pob) err.placeOfBirth = "Place of birth is required.";
  else if (!onlyLetters(pob))
    err.placeOfBirth = "Place of birth must contain only alphabets.";

  const nat = String(data.personal?.nationality || "").trim();
  if (!nat) err.nationality = "Nationality is required.";
  else if (!onlyLetters(nat))
    err.nationality = "Nationality must contain only alphabets.";

  const presentAddr = String(data.personal?.address?.present || "").trim();
  if (!presentAddr) err.presentAddress = "Present address is required.";

  const permanentAddr = String(data.personal?.address?.permanent || "").trim();
  if (!permanentAddr) err.permanentAddress = "Permanent address is required.";

  const acc = String(data.personal?.bankDetails?.accountNumber || "").trim();
  if (!acc) err.accountNumber = "Account number is required.";
  else if (!/^[0-9]{9,18}$/.test(acc))
    err.accountNumber = "Account number must be 9–18 digits.";

  const ifsc = String(data.personal?.bankDetails?.ifsc || "")
    .trim()
    .toUpperCase();
  if (!ifsc) err.ifsc = "IFSC is required.";
  else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc))
    err.ifsc = "Enter a valid IFSC code.";

  const q = String(data.academic?.highestQualification || "").trim();
  if (!q) err.highestQualification = "Highest qualification is required.";
  else if (!QUALIFICATIONS_IT.includes(q))
    err.highestQualification = "Select a valid qualification option.";

  const uni = String(data.academic?.university || "").trim();
  if (!uni) err.university = "University is required.";
  else if (!onlyLetters(uni))
    err.university = "University must contain only alphabets.";

  const dobForYear = String(
    data.personal?.dob instanceof Date
      ? data.personal.dob.toISOString().slice(0, 10)
      : data.personal?.dob || ""
  ).trim();
  const passingYearMsg = validatePassingYear(data.academic?.passingYear, dobForYear);
  if (passingYearMsg) err.passingYear = passingYearMsg;

  const grades = String(data.academic?.grades || "").trim();
  if (!grades) err.grades = "Grades are required.";
  else if (!isGrade(grades)) err.grades = "Grades must be a number (0–100).";

  const branch = String(data.academic?.branch || "").trim();
  if (!branch) err.branch = "Branch is required.";
  else if (!onlyLetters(branch))
    err.branch = "Branch must contain only alphabets.";

  if (!employeeSelfService) {
    const role = String(data.professional?.role || "").trim();
    if (!role) err.role = "Role is required.";
    else if (!onlyLetters(role) && role.toUpperCase() !== "NA")
      err.role = "Role must contain only alphabets.";

    const dept = String(data.professional?.department || "").trim();
    if (!dept) err.department = "Department is required.";
    else if (!onlyLetters(dept) && dept.toUpperCase() !== "NA")
      err.department = "Department must contain only alphabets.";
  }

  if (!employeeSelfService) {
    const emp = String(data.professional?.employmentType || "").trim();
    if (!emp) err.employmentType = "Employment type is required.";

    const joinStr = String(
      data.professional?.joiningDate instanceof Date
        ? data.professional.joiningDate.toISOString().slice(0, 10)
        : data.professional?.joiningDate || ""
    ).trim();
    if (!joinStr) err.joiningDate = "Joining date is required.";
    else {
      const today = startOfToday();
      const max = addMonths(today, 1);
      if (!isDateInRange(joinStr, today, max)) {
        err.joiningDate = "Joining date must be between today and next 1 month.";
      }
    }

    const wl = String(data.professional?.workLocation || "").trim();
    if (!wl) err.workLocation = "Work location is required.";
  }

  const skills = Array.isArray(data.technicalSkills) ? data.technicalSkills : [];
  if (skills.length === 0)
    err.technicalSkills = "Add at least one technical skill.";
  else if (skills.some((s) => !isAllowedSkill(s)))
    err.technicalSkills = "Enter only allowed IT skills.";

  const past = Array.isArray(data.pastExperience) ? data.pastExperience : [];
  if (past.length > 0) {
    past.forEach((exp, i) => {
      const company = String(exp?.company || "").trim();
      const r = String(exp?.role || "").trim();
      const duration = String(exp?.duration || "").trim();
      const location = String(exp?.location || "").trim();

      if (!company) err[`pastCompany_${i}`] = "Company is required.";
      else if (!onlyLetters(company) && company.toUpperCase() !== "NA")
        err[`pastCompany_${i}`] = "Company must contain only alphabets.";

      if (!r) err[`pastRole_${i}`] = "Role is required.";
      else if (!onlyLetters(r) && r.toUpperCase() !== "NA")
        err[`pastRole_${i}`] = "Role must contain only alphabets.";

      if (!location) err[`pastLocation_${i}`] = "Location is required.";
      else if (!onlyLetters(location) && location.toUpperCase() !== "NA")
        err[`pastLocation_${i}`] = "Location must contain only alphabets.";

      if (!duration) err[`pastDuration_${i}`] = "Duration is required.";
      else if (!isDurationNumber(duration))
        err[`pastDuration_${i}`] = "Duration must be a number.";
    });
  }

  const signed = data.ndaAgreement?.signed;
  if (signed !== true && signed !== false)
    err.ndaSigned = "Select NDA status.";

  if (signed === true) {
    const signedOn = String(
      data.ndaAgreement?.signedOn instanceof Date
        ? data.ndaAgreement.signedOn.toISOString().slice(0, 10)
        : data.ndaAgreement?.signedOn || ""
    ).trim();
    if (!signedOn) err.signedOn = "Signed date is required.";
    else {
      const today = startOfToday();
      const min = subtractMonths(today, 1);
      if (!isDateInRange(signedOn, min, today)) {
        err.signedOn = "Signed date must be within the last 1 month.";
      }
    }

    const docId = String(data.ndaAgreement?.documentId || "").trim();
    if (!docId) err.documentId = "Document ID is required.";
    else if (!isAlphaNum(docId))
      err.documentId = "Document ID must be alphanumeric.";
  }

  return err;
};

const toDateOrNull = (v) => {
  if (v == null || v === "") return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const sanitizeProfilePayload = (body, userId) => {
  const phoneDigits = normalizeIndianPhone(body?.personal?.phone || "");
  const ifsc = String(body?.personal?.bankDetails?.ifsc || "")
    .trim()
    .toUpperCase();

  const passingYearRaw = body?.academic?.passingYear;
  const passingYearNum =
    passingYearRaw === "" || passingYearRaw == null
      ? undefined
      : Number(String(passingYearRaw).trim());

  return {
    userId: String(userId),
    personal: {
      fullName: String(body?.personal?.fullName || "").trim(),
      dob: toDateOrNull(body?.personal?.dob),
      gender: String(body?.personal?.gender || "").trim() || undefined,
      phone: phoneDigits || String(body?.personal?.phone || "").trim(),
      email: String(body?.personal?.email || "").trim().toLowerCase(),
      placeOfBirth: String(body?.personal?.placeOfBirth || "").trim(),
      nationality: String(body?.personal?.nationality || "").trim(),
      address: {
        present: String(body?.personal?.address?.present || "").trim(),
        permanent: String(body?.personal?.address?.permanent || "").trim(),
      },
      bankDetails: {
        accountNumber: String(
          body?.personal?.bankDetails?.accountNumber || ""
        ).trim(),
        ifsc,
      },
    },
    academic: {
      highestQualification: String(
        body?.academic?.highestQualification || ""
      ).trim(),
      university: String(body?.academic?.university || "").trim(),
      passingYear:
        Number.isFinite(passingYearNum) && !Number.isNaN(passingYearNum)
          ? passingYearNum
          : body?.academic?.passingYear,
      grades: String(body?.academic?.grades || "").trim(),
      branch: String(body?.academic?.branch || "").trim(),
    },
    professional: {
      role: String(body?.professional?.role || "").trim(),
      department: String(body?.professional?.department || "").trim(),
      employmentType:
        String(body?.professional?.employmentType || "").trim() ||
        undefined,
      joiningDate: toDateOrNull(body?.professional?.joiningDate),
      workLocation: String(body?.professional?.workLocation || "").trim(),
    },
    technicalSkills: Array.isArray(body?.technicalSkills)
      ? body.technicalSkills.map((s) => String(s || "").trim()).filter(Boolean)
      : [],
    pastExperience: Array.isArray(body?.pastExperience)
      ? body.pastExperience.map((e) => ({
          company: String(e?.company || "").trim(),
          role: String(e?.role || "").trim(),
          duration: String(e?.duration || "").trim(),
          location: String(e?.location || "").trim(),
          technologies: Array.isArray(e?.technologies) ? e.technologies : [],
        }))
      : [],
    ndaAgreement: {
      signed:
        body?.ndaAgreement?.signed === true ||
        body?.ndaAgreement?.signed === false
          ? body.ndaAgreement.signed
          : false,
      signedOn: toDateOrNull(body?.ndaAgreement?.signedOn),
      documentId: String(body?.ndaAgreement?.documentId || "").trim(),
    },
  };
};

const stepDefinitions = (profile) => {
  const p = profile || {};
  const errors = validateAll({
    ...p,
    userId: p.userId || "placeholder",
  });

  const pastKeys = Object.keys(errors).filter((k) => k.startsWith("past"));
  const personalKeys = [
    "fullName",
    "dob",
    "gender",
    "phone",
    "email",
    "placeOfBirth",
    "nationality",
    "presentAddress",
    "permanentAddress",
  ];
  const bankKeys = ["accountNumber", "ifsc"];
  const academicKeys = [
    "highestQualification",
    "university",
    "passingYear",
    "grades",
    "branch",
  ];
  const profKeys = ["employmentType", "joiningDate", "workLocation"];

  const steps = [
    {
      id: "personal",
      label: "Personal details",
      done: !personalKeys.some((k) => errors[k]),
    },
    {
      id: "bank",
      label: "Bank details",
      done: !bankKeys.some((k) => errors[k]),
    },
    {
      id: "academic",
      label: "Academic details",
      done: !academicKeys.some((k) => errors[k]),
    },
    {
      id: "professional",
      label: "Professional details",
      done: !profKeys.some((k) => errors[k]),
    },
    {
      id: "skills",
      label: "Technical skills",
      done: !errors.technicalSkills,
    },
    {
      id: "experience",
      label: "Past experience",
      done: pastKeys.length === 0,
    },
    {
      id: "nda",
      label: "NDA agreement",
      done:
        !errors.ndaSigned &&
        !errors.signedOn &&
        !errors.documentId,
    },
    {
      id: "documents",
      label: "Documents uploaded",
      done: Array.isArray(p.documents) && p.documents.length > 0,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const completionPercent = Math.round((completed / total) * 100);

  const checklist = steps.map((s) => ({
    id: s.id,
    label: s.label,
    done: s.done,
  }));

  return {
    completionPercent,
    checklist,
    fieldErrors: errors,
    isComplete: Object.keys(errors).length === 0 && checklist.every((c) => c.done),
  };
};

/**
 * Employees cannot change HR-controlled professional fields.
 */
const applyProfessionalFieldPolicy = (existing, body, { isHr, targetUserId, requesterId }) => {
  const currentRole = String(existing?.professional?.role || "").trim() || "NA";
  const currentDept =
    String(existing?.professional?.department || "").trim() || "NA";
  const currentEmploymentType =
    String(existing?.professional?.employmentType || "").trim();
  const currentJoiningDate = existing?.professional?.joiningDate || null;
  const currentWorkLocation =
    String(existing?.professional?.workLocation || "").trim();

  const managingOtherEmployee =
    isHr && String(targetUserId) !== String(requesterId);

  if (!managingOtherEmployee) {
    return {
      role: currentRole,
      department: currentDept,
      employmentType: currentEmploymentType,
      joiningDate: currentJoiningDate,
      workLocation: currentWorkLocation,
    };
  }

  let role = currentRole;
  let department = currentDept;
  let employmentType = currentEmploymentType;
  let joiningDate = currentJoiningDate;
  let workLocation = currentWorkLocation;

  if (body?.professional?.role !== undefined) {
    const next = String(body.professional.role || "").trim();
    if (next) role = next;
  }
  if (body?.professional?.department !== undefined) {
    const next = String(body.professional.department || "").trim();
    if (next) department = next;
  }
  if (body?.professional?.employmentType !== undefined) {
    const next = String(body.professional.employmentType || "").trim();
    if (next) employmentType = next;
  }
  if (body?.professional?.joiningDate !== undefined) {
    const next = toDateOrNull(body.professional.joiningDate);
    if (next) joiningDate = next;
  }
  if (body?.professional?.workLocation !== undefined) {
    const next = String(body.professional.workLocation || "").trim();
    if (next) workLocation = next;
  }

  return { role, department, employmentType, joiningDate, workLocation };
};

const computeOnboardingMeta = (profile) => {
  const base = stepDefinitions(profile);
  return {
    completionPercent: base.completionPercent,
    checklist: base.checklist,
    isComplete: base.isComplete,
    missingFieldCount: Object.keys(base.fieldErrors).length,
  };
};

module.exports = {
  validateAll,
  validatePassingYear,
  getPassingYearBounds,
  makeBlank,
  naExperience,
  sanitizeProfilePayload,
  applyProfessionalFieldPolicy,
  computeOnboardingMeta,
  stepDefinitions,
};
