const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const { ok, fail } = require("../utils/apiResponse");

const listNotifications = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 30, 1),
      100
    );
    const cursor = req.query.cursor;
    const query = { userId: String(req.user.id) };
    if (cursor) {
      const c = new Date(cursor);
      if (!Number.isNaN(c.getTime())) {
        query.createdAt = { $lt: c };
      }
    }

    const items = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = items.length > limit;
    const slice = hasMore ? items.slice(0, limit) : items;
    const nextCursor =
      hasMore && slice.length
        ? slice[slice.length - 1].createdAt?.toISOString()
        : null;

    return ok(res, {
      data: slice,
      meta: { nextCursor, hasMore },
    });
  } catch (err) {
    return fail(res, "Could not load notifications", 500, {
      error: err.message,
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: String(req.user.id),
      read: false,
    });
    return ok(res, { data: { count } });
  } catch (err) {
    return fail(res, "Could not count notifications", 500, {
      error: err.message,
    });
  }
};

const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, "Invalid notification id", 400);
    }
    const n = await Notification.findOneAndUpdate(
      { _id: id, userId: String(req.user.id) },
      { read: true, readAt: new Date() },
      { new: true }
    ).lean();

    if (!n) return fail(res, "Notification not found", 404);
    return ok(res, { data: n });
  } catch (err) {
    return fail(res, "Could not update notification", 500, {
      error: err.message,
    });
  }
};

const markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: String(req.user.id), read: false },
      { read: true, readAt: new Date() }
    );
    return ok(res, {
      message: "All notifications marked read",
      data: { modified: result.modifiedCount },
    });
  } catch (err) {
    return fail(res, "Could not update notifications", 500, {
      error: err.message,
    });
  }
};

module.exports = {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
};
