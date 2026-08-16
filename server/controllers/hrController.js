const User = require("../models/User");
const Profile = require("../models/Profile");
const { ok, fail } = require("../utils/apiResponse");
const {
  isAllowedDocType,
  docTypeLabel,
} = require("../utils/documentConstants");
const { isValidOnboardingState } = require("../utils/hrOnboardingStates");
const {
  createNotification,
  createNotificationsMany,
} = require("../services/notificationService");

const normalizeComment = (v, maxLen) => {
  const s = String(v ?? "").trim();
  if (s.length > maxLen) return s.slice(0, maxLen);
  return s;
};

const normalizeMultiline = (v, maxLen) => {
  const s = String(v ?? "");
  if (s.length > maxLen) return s.slice(0, maxLen);
  return s;
};

const safeNotify = (fn) => {
  Promise.resolve(fn()).catch((e) =>
    console.error("[notification]", e?.message || e)
  );
};

const updateDocumentStatus = async (req, res) => {
  try {
    const { userId, docType, status, comment } = req.body;

    if (!userId || !docType || !status) {
      return fail(res, "userId, docType, and status are required", 400);
    }

    if (!["pending", "verified", "rejected"].includes(status)) {
      return fail(res, "Invalid status", 400);
    }

    if (!isAllowedDocType(docType)) {
      return fail(res, "Invalid document type", 400);
    }

    const c = normalizeComment(comment, 2000);

    if (status === "rejected" && c.length < 5) {
      return fail(
        res,
        "Please provide a rejection reason (at least 5 characters).",
        400
      );
    }

    const profile = await Profile.findOne({ userId: String(userId) });

    if (!profile) {
      return fail(res, "Profile not found", 404);
    }

    const docIndex = profile.documents.findIndex((d) => d.docType === docType);

    if (docIndex === -1) {
      return fail(res, "Document not found", 404);
    }

    profile.documents[docIndex].status = status;
    if (status === "verified") {
      profile.documents[docIndex].verificationComment = c || "";
    } else if (status === "rejected") {
      profile.documents[docIndex].verificationComment = c;
    } else {
      profile.documents[docIndex].verificationComment = c || "";
    }
    profile.documents[docIndex].reviewedAt = new Date();
    profile.documents[docIndex].reviewedBy = String(req.user.id);

    profile.markModified("documents");
    await profile.save();

    const label = docTypeLabel(docType);
    const recipient = String(userId);
    if (status === "verified") {
      safeNotify(() =>
        createNotification({
          userId: recipient,
          type: "document_verified",
          title: `${label} approved`,
          body: c
            ? `HR note: ${c.slice(0, 500)}`
            : "Your document has been verified.",
          meta: { docType },
        })
      );
    } else if (status === "rejected") {
      safeNotify(() =>
        createNotification({
          userId: recipient,
          type: "document_rejected",
          title: `${label} needs attention`,
          body: c || "Please review HR feedback and re-upload if needed.",
          meta: { docType },
        })
      );
    } else {
      safeNotify(() =>
        createNotification({
          userId: recipient,
          type: "document_pending",
          title: `${label} marked pending`,
          body: c || "Your document is pending review again.",
          meta: { docType },
        })
      );
    }

    return ok(res, {
      message: "Document status updated",
      data: { documents: profile.documents },
    });
  } catch (err) {
    return fail(res, "Error updating document", 500, { error: err.message });
  }
};

const updateProfileStatus = async (req, res) => {
  try {
    const { userId, status, comment } = req.body;

    if (!userId || !status) {
      return fail(res, "userId and status are required", 400);
    }

    if (!["pending", "verified", "rejected"].includes(status)) {
      return fail(res, "Invalid status", 400);
    }

    const c = normalizeComment(comment, 4000);

    if (status === "rejected" && c.length < 5) {
      return fail(
        res,
        "Please provide a rejection reason (at least 5 characters).",
        400
      );
    }

    const profile = await Profile.findOne({ userId: String(userId) });

    if (!profile) {
      return fail(res, "Profile not found", 404);
    }

    profile.hr = profile.hr || {};
    profile.hr.status = status;
    profile.hr.comment = c;
    profile.hr.reviewedAt = new Date();
    profile.hr.reviewedBy = String(req.user.id);

    profile.markModified("hr");
    await profile.save();

    const recipient = String(userId);
    if (status === "verified") {
      safeNotify(() =>
        createNotification({
          userId: recipient,
          type: "profile_verified",
          title: "Profile approved",
          body: c || "Your onboarding profile has been approved.",
          meta: {},
        })
      );
    } else if (status === "rejected") {
      safeNotify(() =>
        createNotification({
          userId: recipient,
          type: "profile_rejected",
          title: "Profile update required",
          body: c,
          meta: {},
        })
      );
    } else {
      safeNotify(() =>
        createNotification({
          userId: recipient,
          type: "profile_pending",
          title: "Profile pending review",
          body: c || "Your profile is pending HR review.",
          meta: {},
        })
      );
    }

    return ok(res, {
      message: "Onboarding status updated",
      data: { hr: profile.hr },
    });
  } catch (err) {
    return fail(res, "Error updating profile", 500, { error: err.message });
  }
};

/** HR-only employee fields: joining copy + pipeline state */
const updateEmployeeHrSettings = async (req, res) => {
  try {
    const {
      userId,
      joiningInstructions,
      onboardingState,
      assignedJoiningDate,
      reportingManagerUserId,
      officeLocation,
      reportingInstructions,
      professionalRole,
      professionalDepartment,
      professionalEmploymentType,
      professionalJoiningDate,
      professionalWorkLocation,
    } = req.body;

    if (!userId) {
      return fail(res, "userId is required", 400);
    }

    const hasJoiningPayload =
      joiningInstructions !== undefined ||
      onboardingState !== undefined ||
      assignedJoiningDate !== undefined ||
      reportingManagerUserId !== undefined ||
      officeLocation !== undefined ||
      reportingInstructions !== undefined ||
      professionalRole !== undefined ||
      professionalDepartment !== undefined ||
      professionalEmploymentType !== undefined ||
      professionalJoiningDate !== undefined ||
      professionalWorkLocation !== undefined;

    if (!hasJoiningPayload) {
      return fail(
        res,
        "Provide at least one field to update for this employee.",
        400
      );
    }

    if (
      onboardingState !== undefined &&
      !isValidOnboardingState(onboardingState)
    ) {
      return fail(res, "Invalid onboarding state", 400);
    }

    const profile = await Profile.findOne({ userId: String(userId) });
    if (!profile) return fail(res, "Profile not found", 404);

    profile.hr = profile.hr || {};
    if (joiningInstructions !== undefined) {
      profile.hr.joiningInstructions = normalizeMultiline(
        joiningInstructions,
        10000
      );
    }
    if (onboardingState !== undefined) {
      profile.hr.onboardingState = String(onboardingState).trim();
    }
    if (assignedJoiningDate !== undefined) {
      if (assignedJoiningDate === null || assignedJoiningDate === "") {
        profile.hr.assignedJoiningDate = null;
      } else {
        const d = new Date(assignedJoiningDate);
        if (Number.isNaN(d.getTime())) {
          return fail(res, "Invalid assignedJoiningDate", 400);
        }
        profile.hr.assignedJoiningDate = d;
      }
    }
    if (reportingManagerUserId !== undefined) {
      const rid = String(reportingManagerUserId || "").trim();
      if (rid) {
        const mgr = await User.findById(rid).select("_id").lean();
        if (!mgr) return fail(res, "Reporting manager user not found", 400);
        profile.hr.reportingManagerUserId = rid;
      } else {
        profile.hr.reportingManagerUserId = "";
      }
    }
    if (officeLocation !== undefined) {
      profile.hr.officeLocation = String(officeLocation || "")
        .trim()
        .slice(0, 500);
    }
    if (reportingInstructions !== undefined) {
      profile.hr.reportingInstructions = normalizeMultiline(
        reportingInstructions,
        10000
      );
    }

    if (
      professionalRole !== undefined ||
      professionalDepartment !== undefined ||
      professionalEmploymentType !== undefined ||
      professionalJoiningDate !== undefined ||
      professionalWorkLocation !== undefined
    ) {
      if (profile.hr?.status !== "verified") {
        return fail(
          res,
          "Assign professional details after the employee profile is verified.",
          403
        );
      }
      profile.professional = profile.professional || {};
      if (professionalRole !== undefined) {
        const role = String(professionalRole || "").trim();
        if (!role) {
          return fail(res, "Role cannot be empty.", 400);
        }
        profile.professional.role = role;
      }
      if (professionalDepartment !== undefined) {
        const department = String(professionalDepartment || "").trim();
        if (!department) {
          return fail(res, "Department cannot be empty.", 400);
        }
        profile.professional.department = department;
      }
      if (professionalEmploymentType !== undefined) {
        const employmentType = String(professionalEmploymentType || "").trim();
        if (!employmentType) {
          return fail(res, "Employment type cannot be empty.", 400);
        }
        if (!["Full-time", "Intern", "Contract"].includes(employmentType)) {
          return fail(res, "Invalid employment type.", 400);
        }
        profile.professional.employmentType = employmentType;
      }
      if (professionalJoiningDate !== undefined) {
        const d = new Date(professionalJoiningDate);
        if (Number.isNaN(d.getTime())) {
          return fail(res, "Invalid professional joining date.", 400);
        }
        profile.professional.joiningDate = d;
      }
      if (professionalWorkLocation !== undefined) {
        const workLocation = String(professionalWorkLocation || "").trim();
        if (!workLocation) {
          return fail(res, "Work location cannot be empty.", 400);
        }
        profile.professional.workLocation = workLocation.slice(0, 500);
      }
      profile.markModified("professional");
    }

    profile.markModified("hr");
    await profile.save();

    const notifyJoiningBundle =
      joiningInstructions !== undefined ||
      reportingInstructions !== undefined ||
      officeLocation !== undefined ||
      assignedJoiningDate !== undefined ||
      reportingManagerUserId !== undefined;

    if (notifyJoiningBundle) {
      const parts = [];
      if (profile.hr.assignedJoiningDate) {
        parts.push(
          `Joining date: ${profile.hr.assignedJoiningDate.toISOString().slice(0, 10)}`
        );
      }
      if (String(profile.hr.officeLocation || "").trim()) {
        parts.push(`Office: ${String(profile.hr.officeLocation).trim()}`);
      }
      if (String(profile.hr.reportingManagerUserId || "").trim()) {
        parts.push("Reporting manager assigned — see onboarding hub.");
      }
      const ji = String(profile.hr.joiningInstructions || "").trim();
      const ri = String(profile.hr.reportingInstructions || "").trim();
      if (ji) parts.push(ji.length > 200 ? `${ji.slice(0, 200)}…` : ji);
      else if (ri)
        parts.push(ri.length > 200 ? `${ri.slice(0, 200)}…` : ri);

      const body =
        parts.filter(Boolean).join("\n\n").slice(0, 4000) ||
        "Your HR-assigned joining details were updated. Open the onboarding hub for the full picture.";

      safeNotify(() =>
        createNotification({
          userId: String(userId),
          type: "joining_instructions",
          title: "Joining details updated",
          body,
          meta: {
            assignedJoiningDate: profile.hr.assignedJoiningDate,
            officeLocation: profile.hr.officeLocation || "",
            reportingManagerUserId: profile.hr.reportingManagerUserId || "",
          },
        })
      );
    }

    return ok(res, {
      message: "Employee HR settings updated",
      data: { hr: profile.hr, professional: profile.professional },
    });
  } catch (err) {
    return fail(res, "Error updating employee settings", 500, {
      error: err.message,
    });
  }
};

const listDirectoryUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role")
      .sort({ name: 1 })
      .lean();
    const data = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
    }));
    return ok(res, { data });
  } catch (err) {
    return fail(res, "Could not load directory", 500, { error: err.message });
  }
};

/** HR: training updates or announcements to employees */
const broadcastEmployeeNotifications = async (req, res) => {
  try {
    const { kind, title, body, audience, userIds } = req.body;

    const k = String(kind || "").trim();
    if (!["training_update", "hr_announcement"].includes(k)) {
      return fail(
        res,
        "kind must be training_update or hr_announcement",
        400
      );
    }

    const t = String(title || "").trim();
    const b = String(body || "").trim();
    if (!t || !b) {
      return fail(res, "title and body are required", 400);
    }

    const aud = String(audience || "all_employees").trim();
    let targets = [];

    if (aud === "all_employees") {
      const users = await User.find({ role: "employee" }).select("_id").lean();
      targets = users.map((u) => u._id.toString());
    } else if (aud === "selected") {
      const ids = Array.isArray(userIds) ? userIds : [];
      targets = [...new Set(ids.map((x) => String(x).trim()).filter(Boolean))];
      const valid = await User.find({
        _id: { $in: targets },
        role: "employee",
      })
        .select("_id")
        .lean();
      targets = valid.map((u) => u._id.toString());
    } else {
      return fail(res, "audience must be all_employees or selected", 400);
    }

    if (!targets.length) {
      return fail(res, "No employee recipients found", 400);
    }

    await createNotificationsMany(
      targets.map((userId) => ({
        userId,
        type: k,
        title: t.slice(0, 200),
        body: b.slice(0, 4000),
        meta: { fromHrId: String(req.user.id) },
      }))
    );

    return ok(res, {
      message: `Notification sent to ${targets.length} employee(s).`,
      data: { count: targets.length },
    });
  } catch (err) {
    return fail(res, "Broadcast failed", 500, { error: err.message });
  }
};

const getHrMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").lean();
    if (!user) return fail(res, "User not found", 404);
    return ok(res, {
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        jobTitle: user.jobTitle || "",
        department: user.department || "",
      },
    });
  } catch (err) {
    return fail(res, "Error loading profile", 500, { error: err.message });
  }
};

const updateHrMe = async (req, res) => {
  try {
    const { name, phone, jobTitle, department } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return fail(res, "User not found", 404);

    if (name !== undefined) {
      const n = String(name).trim();
      if (n.length < 2) return fail(res, "Name must be at least 2 characters", 400);
      user.name = n.slice(0, 120);
    }
    if (phone !== undefined) {
      user.phone = String(phone).trim().slice(0, 20);
    }
    if (jobTitle !== undefined) {
      user.jobTitle = String(jobTitle).trim().slice(0, 120);
    }
    if (department !== undefined) {
      user.department = String(department).trim().slice(0, 120);
    }

    await user.save();

    return ok(res, {
      message: "Profile updated",
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        jobTitle: user.jobTitle || "",
        department: user.department || "",
      },
    });
  } catch (err) {
    return fail(res, "Error updating profile", 500, { error: err.message });
  }
};

module.exports = {
  updateDocumentStatus,
  updateProfileStatus,
  updateEmployeeHrSettings,
  broadcastEmployeeNotifications,
  getHrMe,
  updateHrMe,
  listDirectoryUsers,
};
