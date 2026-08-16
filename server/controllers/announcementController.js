const User = require("../models/User");
const Announcement = require("../models/Announcement");
const { ok, fail } = require("../utils/apiResponse");
const { createNotificationsMany } = require("../services/notificationService");

const safeNotify = (fn) => {
  Promise.resolve(fn()).catch((e) =>
    console.error("[notification]", e?.message || e)
  );
};

async function findActiveAnnouncementsForEmployee(userId, limit = 25) {
  const uid = String(userId);
  const now = new Date();
  return Announcement.find({
    active: true,
    $and: [
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
      {
        $or: [
          { audience: "all_employees" },
          { audience: "selected", targetUserIds: uid },
        ],
      },
    ],
  })
    .sort({ pinned: -1, createdAt: -1 })
    .limit(limit)
    .lean();
}

const listFeedEmployee = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25));
    const items = await findActiveAnnouncementsForEmployee(req.user.id, limit);
    return ok(res, { data: items });
  } catch (err) {
    return fail(res, "Could not load announcements", 500, {
      error: err.message,
    });
  }
};

const listAllHr = async (req, res) => {
  try {
    const items = await Announcement.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return ok(res, { data: items });
  } catch (err) {
    return fail(res, "Could not load announcements", 500, {
      error: err.message,
    });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, body, audience, targetUserIds, expiresAt, pinned } =
      req.body;
    const t = String(title || "").trim();
    const b = String(body || "").trim();
    if (!t || !b) return fail(res, "title and body are required", 400);

    const aud = String(audience || "all_employees").trim();
    if (!["all_employees", "selected"].includes(aud)) {
      return fail(res, "Invalid audience", 400);
    }

    let targets = [];
    if (aud === "selected") {
      const ids = Array.isArray(targetUserIds) ? targetUserIds : [];
      targets = [...new Set(ids.map((x) => String(x).trim()).filter(Boolean))];
      const valid = await User.find({
        _id: { $in: targets },
        role: "employee",
      })
        .select("_id")
        .lean();
      targets = valid.map((u) => u._id.toString());
      if (!targets.length) {
        return fail(res, "selected audience requires at least one employee id", 400);
      }
    }

    let exp = null;
    if (expiresAt !== undefined && expiresAt !== null && expiresAt !== "") {
      const d = new Date(expiresAt);
      if (Number.isNaN(d.getTime())) {
        return fail(res, "Invalid expiresAt", 400);
      }
      exp = d;
    }

    const doc = await Announcement.create({
      title: t.slice(0, 200),
      body: b.slice(0, 8000),
      audience: aud,
      targetUserIds: aud === "selected" ? targets : [],
      createdBy: String(req.user.id),
      expiresAt: exp,
      pinned: Boolean(pinned),
      active: true,
    });

    let notifyIds = [];
    if (aud === "all_employees") {
      const users = await User.find({ role: "employee" }).select("_id").lean();
      notifyIds = users.map((u) => u._id.toString());
    } else {
      notifyIds = targets;
    }

    if (notifyIds.length) {
      const preview =
        b.length > 400 ? `${b.slice(0, 400)}… (see dashboard for full text)` : b;
      safeNotify(() =>
        createNotificationsMany(
          notifyIds.map((userId) => ({
            userId,
            type: "hr_announcement",
            title: t.slice(0, 200),
            body: preview,
            meta: {
              announcementId: doc._id.toString(),
              fromHrId: String(req.user.id),
            },
          }))
        )
      );
    }

    return ok(res, { message: "Announcement published", data: doc.toObject() }, 201);
  } catch (err) {
    return fail(res, "Could not create announcement", 500, {
      error: err.message,
    });
  }
};

const patchAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { active, pinned, expiresAt } = req.body;
    const doc = await Announcement.findById(id);
    if (!doc) return fail(res, "Announcement not found", 404);

    if (active !== undefined) doc.active = Boolean(active);
    if (pinned !== undefined) doc.pinned = Boolean(pinned);
    if (expiresAt !== undefined) {
      if (expiresAt === null || expiresAt === "") doc.expiresAt = null;
      else {
        const d = new Date(expiresAt);
        if (Number.isNaN(d.getTime())) return fail(res, "Invalid expiresAt", 400);
        doc.expiresAt = d;
      }
    }
    await doc.save();
    return ok(res, { message: "Updated", data: doc.toObject() });
  } catch (err) {
    return fail(res, "Update failed", 500, { error: err.message });
  }
};

module.exports = {
  findActiveAnnouncementsForEmployee,
  listFeedEmployee,
  listAllHr,
  createAnnouncement,
  patchAnnouncement,
};
