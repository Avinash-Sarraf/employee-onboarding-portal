const Profile = require("../models/Profile");
const User = require("../models/User");
const TrainingAssignment = require("../models/TrainingAssignment");
const {
  findActiveAnnouncementsForEmployee,
} = require("../controllers/announcementController");
const { ok, fail } = require("../utils/apiResponse");

const getEmployeeOnboardingMe = async (req, res) => {
  try {
    const uid = String(req.user.id);
    const profile = await Profile.findOne({ userId: uid }).lean();

    const [trainings, announcements] = await Promise.all([
      TrainingAssignment.find({ employeeUserId: uid })
        .populate("moduleId")
        .sort({ updatedAt: -1 })
        .lean(),
      findActiveAnnouncementsForEmployee(uid, 15),
    ]);

    const hr = profile?.hr || {};
    let reportingManager = null;
    const mid = String(hr.reportingManagerUserId || "").trim();
    if (mid) {
      const u = await User.findById(mid).select("name email role").lean();
      if (u) {
        reportingManager = {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
        };
      }
    }

    const trainingRows = (trainings || [])
      .filter((r) => r.moduleId)
      .map((r) => ({
        assignmentId: r._id.toString(),
        status: r.status,
        progressPercent: r.progressPercent,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        updatedAt: r.updatedAt,
        module: {
          id: r.moduleId._id.toString(),
          title: r.moduleId.title,
          description: r.moduleId.description,
          estimatedMinutes: r.moduleId.estimatedMinutes,
          sortOrder: r.moduleId.sortOrder,
          isPublished: r.moduleId.isPublished,
        },
      }));

    const completed = trainingRows.filter(
      (t) => t.status === "completed"
    ).length;
    const trainingSummary = {
      total: trainingRows.length,
      completed,
      inProgress: trainingRows.filter((t) => t.status === "in_progress").length,
    };

    return ok(res, {
      data: {
        joining: {
          assignedJoiningDate: hr.assignedJoiningDate || null,
          reportingManager,
          officeLocation: hr.officeLocation || "",
          reportingInstructions: hr.reportingInstructions || "",
          joiningInstructions: hr.joiningInstructions || "",
          onboardingState: hr.onboardingState || "awaiting_profile",
        },
        trainings: trainingRows,
        trainingSummary,
        announcements,
      },
    });
  } catch (err) {
    return fail(res, "Could not load onboarding hub", 500, {
      error: err.message,
    });
  }
};

module.exports = { getEmployeeOnboardingMe };
