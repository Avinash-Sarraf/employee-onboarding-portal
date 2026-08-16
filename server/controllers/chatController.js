const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Profile = require("../models/Profile");
const User = require("../models/User");
const { ok, fail } = require("../utils/apiResponse");
const { pushChatMessage } = require("../realtime/socketServer");
const {
  createNotification,
  createNotificationsMany,
} = require("../services/notificationService");

const preview = (text, n = 140) => {
  const s = String(text || "").trim().replace(/\s+/g, " ");
  return s.length <= n ? s : `${s.slice(0, n)}…`;
};

async function getOrCreateConversation(employeeUserId) {
  const id = String(employeeUserId).trim();
  let conv = await Conversation.findOne({ employeeUserId: id });
  if (!conv) {
    conv = await Conversation.create({
      employeeUserId: id,
      lastMessageAt: new Date(0),
    });
  }
  return conv;
}

function assertConversationAccess(req, conv) {
  if (!conv) {
    return { status: 404, message: "Conversation not found" };
  }
  if (req.user.role === "employee") {
    if (String(conv.employeeUserId) !== String(req.user.id)) {
      return { status: 403, message: "Forbidden" };
    }
  } else if (req.user.role !== "hr") {
    return { status: 403, message: "Forbidden" };
  }
  return null;
}

/** Employee: ensure + return their thread. HR: all threads with preview + names. */
const listConversations = async (req, res) => {
  try {
    if (req.user.role === "employee") {
      const conv = await getOrCreateConversation(req.user.id);
      const p = await Profile.findOne({ userId: String(req.user.id) })
        .select("personal.fullName personal.email")
        .lean();
      return ok(res, {
        data: [
          {
            id: conv._id.toString(),
            employeeUserId: conv.employeeUserId,
            employeeName: p?.personal?.fullName || "You",
            employeeEmail: p?.personal?.email || "",
            lastMessageAt: conv.lastMessageAt,
            lastMessagePreview: conv.lastMessagePreview || "",
            lastMessageFromUserId: conv.lastMessageFromUserId || "",
            updatedAt: conv.updatedAt,
          },
        ],
      });
    }

    if (req.user.role === "hr") {
      const list = await Conversation.find({})
        .sort({ lastMessageAt: -1 })
        .lean();

      const ids = list.map((c) => c.employeeUserId);
      const profiles = await Profile.find({ userId: { $in: ids } })
        .select("userId personal.fullName personal.email")
        .lean();
      const byUser = {};
      profiles.forEach((p) => {
        byUser[p.userId] = p;
      });

      const data = list.map((c) => {
        const p = byUser[c.employeeUserId];
        return {
          id: c._id.toString(),
          employeeUserId: c.employeeUserId,
          employeeName: p?.personal?.fullName || "Employee",
          employeeEmail: p?.personal?.email || "",
          lastMessageAt: c.lastMessageAt,
          lastMessagePreview: c.lastMessagePreview || "",
          lastMessageFromUserId: c.lastMessageFromUserId || "",
          updatedAt: c.updatedAt,
        };
      });

      return ok(res, { data });
    }

    return fail(res, "Forbidden", 403);
  } catch (err) {
    return fail(res, "Could not load conversations", 500, {
      error: err.message,
    });
  }
};

/**
 * Polling-friendly:
 * - No `since` / `before`: latest `limit` messages (chronological asc).
 * - `since` (ISO): messages with createdAt > since, asc (append-only poll).
 * - `before` (ISO): older page, messages with createdAt < before, desc then reversed to asc.
 */
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return fail(res, "Invalid conversation id", 400);
    }

    const conv = await Conversation.findById(conversationId);
    const denied = assertConversationAccess(req, conv);
    if (denied) {
      return fail(res, denied.message, denied.status);
    }

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 50, 1),
      100
    );
    const since = req.query.since;
    const before = req.query.before;

    const base = { conversationId: conv._id };

    if (since) {
      const d = new Date(since);
      if (!Number.isNaN(d.getTime())) {
        const msgs = await Message.find({ ...base, createdAt: { $gt: d } })
          .sort({ createdAt: 1 })
          .limit(limit)
          .lean();
        return ok(res, {
          data: msgs,
          meta: {
            mode: "since",
            serverTime: new Date().toISOString(),
          },
        });
      }
    }

    if (before) {
      const d = new Date(before);
      if (!Number.isNaN(d.getTime())) {
        const msgs = await Message.find({ ...base, createdAt: { $lt: d } })
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
        return ok(res, {
          data: msgs.reverse(),
          meta: {
            mode: "before",
            serverTime: new Date().toISOString(),
          },
        });
      }
    }

    const msgs = await Message.find(base)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return ok(res, {
      data: msgs.reverse(),
      meta: {
        mode: "latest",
        serverTime: new Date().toISOString(),
      },
    });
  } catch (err) {
    return fail(res, "Could not load messages", 500, { error: err.message });
  }
};

const postMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return fail(res, "Invalid conversation id", 400);
    }

    const body = String(req.body?.body || "").trim();
    if (!body) return fail(res, "Message body is required", 400);
    if (body.length > 5000) return fail(res, "Message too long", 400);

    const conv = await Conversation.findById(conversationId);
    const denied = assertConversationAccess(req, conv);
    if (denied) {
      return fail(res, denied.message, denied.status);
    }

    const me = String(req.user.id);
    const msg = await Message.create({
      conversationId: conv._id,
      fromUserId: me,
      body,
    });

    await Conversation.updateOne(
      { _id: conv._id },
      {
        $set: {
          lastMessageAt: msg.createdAt,
          lastMessagePreview: preview(body, 200),
          lastMessageFromUserId: me,
        },
      }
    );

    const sender = await User.findById(me).select("name role").lean();
    const senderName = sender?.name || (sender?.role === "hr" ? "HR" : "Employee");
    const empId = String(conv.employeeUserId);
    const employeeProfile = await Profile.findOne({ userId: empId })
      .select("personal.fullName personal.email")
      .lean();

    const conversationPayload = {
      id: conv._id.toString(),
      employeeUserId: empId,
      employeeName: employeeProfile?.personal?.fullName || "Employee",
      employeeEmail: employeeProfile?.personal?.email || "",
      lastMessageAt: msg.createdAt,
      lastMessagePreview: preview(body, 200),
      lastMessageFromUserId: me,
    };
    const messagePayload = {
      _id: msg._id.toString(),
      conversationId: conv._id.toString(),
      fromUserId: me,
      body: msg.body,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    };
    let realtimeRecipients = [];

    if (req.user.role === "employee") {
      const hrUsers = await User.find({ role: "hr" }).select("_id").lean();
      realtimeRecipients = [me, ...hrUsers.map((h) => h._id.toString())];
      if (hrUsers.length) {
        await createNotificationsMany(
          hrUsers.map((h) => ({
            userId: h._id.toString(),
            type: "chat_message",
            title: "New employee message",
            body: `${senderName}: ${preview(body)}`,
            meta: {
              conversationId: conv._id.toString(),
              messageId: msg._id.toString(),
              fromUserId: me,
            },
          }))
        );
      }
    } else if (req.user.role === "hr") {
      await createNotification({
        userId: empId,
        type: "chat_message",
        title: "New message from HR",
        body: `${senderName}: ${preview(body)}`,
        meta: {
          conversationId: conv._id.toString(),
          messageId: msg._id.toString(),
          fromUserId: me,
        },
      });
      const hrUsers = await User.find({ role: "hr" }).select("_id").lean();
      realtimeRecipients = [empId, ...hrUsers.map((h) => h._id.toString())];
    }

    if (realtimeRecipients.length) {
      const uniqueRecipients = [...new Set(realtimeRecipients)];
      uniqueRecipients.forEach((userId) => {
        pushChatMessage(userId, {
          conversation: conversationPayload,
          message: messagePayload,
        });
      });
    }

    return ok(res, { message: "Message sent", data: msg }, 201);
  } catch (err) {
    return fail(res, "Could not send message", 500, { error: err.message });
  }
};

/** HR: start (or open) a thread with an employee by user id. */
const ensureConversation = async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return fail(res, "Only HR can create a conversation this way", 403);
    }
    const { employeeUserId } = req.body;
    const id = String(employeeUserId || "").trim();
    if (!id) return fail(res, "employeeUserId is required", 400);

    const emp = await User.findById(id).lean();
    if (!emp || emp.role !== "employee") {
      return fail(res, "Invalid employee", 400);
    }

    const conv = await getOrCreateConversation(id);
    const p = await Profile.findOne({ userId: id })
      .select("personal.fullName personal.email")
      .lean();

    return ok(res, {
      data: {
        id: conv._id.toString(),
        employeeUserId: conv.employeeUserId,
        employeeName: p?.personal?.fullName || "Employee",
        employeeEmail: p?.personal?.email || "",
        lastMessageAt: conv.lastMessageAt,
        lastMessagePreview: conv.lastMessagePreview || "",
        lastMessageFromUserId: conv.lastMessageFromUserId || "",
      },
    });
  } catch (err) {
    return fail(res, "Could not open conversation", 500, {
      error: err.message,
    });
  }
};

module.exports = {
  listConversations,
  getMessages,
  postMessage,
  ensureConversation,
};
