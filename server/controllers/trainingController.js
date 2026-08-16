const User = require("../models/User");
const TrainingModule = require("../models/TrainingModule");
const TrainingAssignment = require("../models/TrainingAssignment");
const { ok, fail } = require("../utils/apiResponse");
const { createNotification } = require("../services/notificationService");

const safeNotify = (fn) => {
  Promise.resolve(fn()).catch((e) =>
    console.error("[notification]", e?.message || e)
  );
};

const listModulesHr = async (req, res) => {
  try {
    const items = await TrainingModule.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    return ok(res, { data: items });
  } catch (err) {
    return fail(res, "Could not load modules", 500, { error: err.message });
  }
};

const createModule = async (req, res) => {
  try {
    const { title, description, estimatedMinutes, sortOrder, isPublished } =
      req.body;
    const t = String(title || "").trim();
    if (!t) return fail(res, "title is required", 400);

    const doc = await TrainingModule.create({
      title: t.slice(0, 200),
      description: String(description ?? "").slice(0, 8000),
      estimatedMinutes: Math.min(
        10080,
        Math.max(0, Number(estimatedMinutes) || 0)
      ),
      sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
      isPublished: Boolean(isPublished !== false),
      createdBy: String(req.user.id),
    });
    return ok(res, { message: "Module created", data: doc.toObject() }, 201);
  } catch (err) {
    return fail(res, "Could not create module", 500, { error: err.message });
  }
};

const updateModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const mod = await TrainingModule.findById(moduleId);
    if (!mod) return fail(res, "Module not found", 404);

    const { title, description, estimatedMinutes, sortOrder, isPublished } =
      req.body;
    if (title !== undefined) {
      const t = String(title).trim();
      if (!t) return fail(res, "title cannot be empty", 400);
      mod.title = t.slice(0, 200);
    }
    if (description !== undefined) {
      mod.description = String(description).slice(0, 8000);
    }
    if (estimatedMinutes !== undefined) {
      mod.estimatedMinutes = Math.min(
        10080,
        Math.max(0, Number(estimatedMinutes) || 0)
      );
    }
    if (sortOrder !== undefined) {
      mod.sortOrder = Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0;
    }
    if (isPublished !== undefined) mod.isPublished = Boolean(isPublished);

    await mod.save();
    return ok(res, { message: "Module updated", data: mod.toObject() });
  } catch (err) {
    return fail(res, "Could not update module", 500, { error: err.message });
  }
};

const deleteModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const mod = await TrainingModule.findById(moduleId);
    if (!mod) return fail(res, "Module not found", 404);

    await TrainingAssignment.deleteMany({ moduleId: mod._id });
    await mod.deleteOne();
    return ok(res, { message: "Module and its assignments removed" });
  } catch (err) {
    return fail(res, "Could not delete module", 500, { error: err.message });
  }
};

const assignModules = async (req, res) => {
  try {
    const { employeeUserIds, moduleIds } = req.body;
    const empIds = Array.isArray(employeeUserIds)
      ? [...new Set(employeeUserIds.map((x) => String(x).trim()).filter(Boolean))]
      : [];
    const modIds = Array.isArray(moduleIds)
      ? [...new Set(moduleIds.map((x) => String(x).trim()).filter(Boolean))]
      : [];

    if (!empIds.length || !modIds.length) {
      return fail(res, "employeeUserIds and moduleIds (non-empty) are required", 400);
    }

    const employees = await User.find({
      _id: { $in: empIds },
      role: "employee",
    })
      .select("_id")
      .lean();
    const validEmp = new Set(employees.map((u) => u._id.toString()));
    if (!validEmp.size) {
      return fail(res, "No valid employee ids", 400);
    }

    const modules = await TrainingModule.find({
      _id: { $in: modIds },
    }).lean();
    if (!modules.length) return fail(res, "No valid modules", 400);

    for (const eid of validEmp) {
      for (const m of modules) {
        await TrainingAssignment.findOneAndUpdate(
          { employeeUserId: eid, moduleId: m._id },
          {
            $setOnInsert: {
              employeeUserId: eid,
              moduleId: m._id,
              status: "assigned",
              progressPercent: 0,
              assignedBy: String(req.user.id),
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }

    const titles = modules.map((m) => m.title).join(", ");
    for (const eid of validEmp) {
      safeNotify(() =>
        createNotification({
          userId: eid,
          type: "training_update",
          title: "New training assigned",
          body:
            modules.length === 1
              ? `Module: ${titles}`
              : `${modules.length} modules: ${titles.slice(0, 350)}${
                  titles.length > 350 ? "…" : ""
                }`,
          meta: { moduleIds: modules.map((m) => m._id.toString()) },
        })
      );
    }

    return ok(res, {
      message: "Assignments updated",
      data: { employees: validEmp.size, modules: modules.length },
    });
  } catch (err) {
    return fail(res, "Assignment failed", 500, { error: err.message });
  }
};

const listMyModules = async (req, res) => {
  try {
    const uid = String(req.user.id);
    const rows = await TrainingAssignment.find({ employeeUserId: uid })
      .populate("moduleId")
      .sort({ updatedAt: -1 })
      .lean();

    const data = rows
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

    return ok(res, { data });
  } catch (err) {
    return fail(res, "Could not load training", 500, { error: err.message });
  }
};

const updateMyProgress = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { progressPercent, status } = req.body;
    const uid = String(req.user.id);

    const assignment = await TrainingAssignment.findOne({
      employeeUserId: uid,
      moduleId,
    }).populate("moduleId");

    if (!assignment) return fail(res, "Assignment not found", 404);

    if (progressPercent !== undefined) {
      const p = Math.min(100, Math.max(0, Number(progressPercent) || 0));
      assignment.progressPercent = p;
    }

    if (status !== undefined) {
      const s = String(status).trim();
      if (!["assigned", "in_progress", "completed"].includes(s)) {
        return fail(res, "Invalid status", 400);
      }
      assignment.status = s;
      if (s === "in_progress" && !assignment.startedAt) {
        assignment.startedAt = new Date();
      }
      if (s === "completed") {
        assignment.completedAt = new Date();
        if (assignment.progressPercent < 100) assignment.progressPercent = 100;
      }
    }

    await assignment.save();
    const lean = assignment.toObject();
    return ok(res, {
      message: "Progress saved",
      data: {
        assignmentId: lean._id.toString(),
        status: lean.status,
        progressPercent: lean.progressPercent,
        moduleId: String(lean.moduleId?._id || lean.moduleId),
      },
    });
  } catch (err) {
    return fail(res, "Could not save progress", 500, { error: err.message });
  }
};

module.exports = {
  listModulesHr,
  createModule,
  updateModule,
  deleteModule,
  assignModules,
  listMyModules,
  updateMyProgress,
};
