const Profile = require("../models/Profile");
const User = require("../models/User");
const { ok, fail } = require("../utils/apiResponse");
const { ensureEmployeeProfile } = require("../utils/ensureProfile");
const {
  validateAll,
  sanitizeProfilePayload,
  computeOnboardingMeta,
  applyProfessionalFieldPolicy,
} = require("../utils/profileRules");

const saveProfile = async (req, res) => {
  try {
    const isHr = req.user.role === "hr";
    const targetUserId = String(
      isHr && req.body.userId ? req.body.userId : req.user.id
    );

    if (!targetUserId) {
      return fail(res, "User ID is required", 400);
    }

    if (
      req.user.role === "employee" &&
      req.body.userId &&
      String(req.body.userId) !== String(req.user.id)
    ) {
      return fail(res, "You may only save your own profile", 403);
    }

    const employeeSelfService = req.user.role === "employee";
    const existing = await Profile.findOne({ userId: targetUserId });

    const sanitized = sanitizeProfilePayload(req.body, targetUserId);
    const { role, department, employmentType, joiningDate, workLocation } = applyProfessionalFieldPolicy(
      existing,
      req.body,
      {
        isHr,
        targetUserId,
        requesterId: req.user.id,
      }
    );

    sanitized.professional.role = role;
    sanitized.professional.department = department;
    sanitized.professional.employmentType = employmentType;
    sanitized.professional.joiningDate = joiningDate;
    sanitized.professional.workLocation = workLocation;

    const validationInput = {
      ...sanitized,
      userId: targetUserId,
      documents: existing?.documents || [],
    };

    const fieldErrors = validateAll(validationInput, { employeeSelfService });
    if (Object.keys(fieldErrors).length > 0) {
      return fail(res, "Please fix the highlighted fields.", 400, {
        fieldErrors,
      });
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: targetUserId },
      {
        $set: {
          ...sanitized,
          documents: existing?.documents || [],
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    const onboarding = computeOnboardingMeta(profile);

    return ok(res, {
      message: "Profile saved successfully.",
      data: profile,
      meta: { onboarding },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const fieldErrors = {};
      Object.keys(error.errors).forEach((field) => {
        fieldErrors[field] = error.errors[field].message;
      });
      return fail(res, "Validation failed", 400, { fieldErrors });
    }
    console.error("saveProfile error:", error);
    return fail(res, "Server error", 500);
  }
};

const getMyProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.user.id });
    if (!profile && req.user.role === "employee") {
      const user = await User.findById(req.user.id).select("email name").lean();
      profile = await ensureEmployeeProfile(req.user.id, {
        email: user?.email,
        fullName: user?.name,
      });
    }
    if (!profile) {
      return fail(res, "Profile not found", 404);
    }
    const onboarding = computeOnboardingMeta(profile);
    return ok(res, { data: profile, meta: { onboarding } });
  } catch (err) {
    console.error("getMyProfile error:", err);
    return fail(res, "Server error", 500);
  }
};

const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    if (!profile) {
      return fail(res, "Profile not found", 404);
    }
    return ok(res, { data: profile });
  } catch {
    return fail(res, "Server error", 500);
  }
};

const getAllEmployees = async (req, res) => {
  try {
    const profiles = await Profile.find().sort({ createdAt: -1 });
    return ok(res, { data: profiles });
  } catch {
    return fail(res, "Server error", 500);
  }
};

const searchProfiles = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const filter = query
      ? {
          $or: [
            { "personal.fullName": { $regex: query, $options: "i" } },
            { "personal.email": { $regex: query, $options: "i" } },
            { "professional.role": { $regex: query, $options: "i" } },
            { "professional.department": { $regex: query, $options: "i" } },
            { userId: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const profiles = await Profile.find(filter).sort({ createdAt: -1 }).limit(200);
    return ok(res, { data: profiles });
  } catch {
    return fail(res, "Server error", 500);
  }
};

const deleteProfile = async (req, res) => {
  try {
    const targetUserId = String(req.params.userId);

    if (req.user.role !== "hr" && req.user.id !== targetUserId) {
      return fail(res, "You may only delete your own profile", 403);
    }

    const result = await Profile.deleteOne({ userId: targetUserId });
    if (!result.deletedCount) {
      return fail(res, "Profile not found", 404);
    }

    return ok(res, { message: "Profile deleted" });
  } catch {
    return fail(res, "Server error", 500);
  }
};

module.exports = {
  saveProfile,
  getProfile,
  getMyProfile,
  deleteProfile,
  getAllEmployees,
  searchProfiles,
};
