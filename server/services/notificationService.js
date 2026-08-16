const Notification = require("../models/Notification");
const { pushNotification } = require("../realtime/socketServer");

function emitCreated(doc) {
  if (!doc?.userId) return;
  pushNotification(String(doc.userId), {
    notification: {
      _id: doc._id?.toString?.() || doc._id,
      type: doc.type,
      title: doc.title,
      body: doc.body,
      read: doc.read,
      createdAt: doc.createdAt,
      meta: doc.meta,
    },
  });
}

/**
 * @param {{ userId: string, type: string, title: string, body?: string, meta?: object }} p
 */
async function createNotification(p) {
  const doc = await Notification.create({
    userId: String(p.userId),
    type: p.type,
    title: String(p.title || "").slice(0, 200),
    body: String(p.body || "").slice(0, 4000),
    meta: p.meta && typeof p.meta === "object" ? p.meta : {},
    read: false,
  });
  emitCreated(doc);
  return doc;
}

/**
 * @param {Array<{ userId: string, type: string, title: string, body?: string, meta?: object }>} items
 */
async function createNotificationsMany(items) {
  if (!items.length) return [];
  const docs = await Notification.insertMany(
    items.map((p) => ({
      userId: String(p.userId),
      type: p.type,
      title: String(p.title || "").slice(0, 200),
      body: String(p.body || "").slice(0, 4000),
      meta: p.meta && typeof p.meta === "object" ? p.meta : {},
      read: false,
    }))
  );
  docs.forEach(emitCreated);
  return docs;
}

module.exports = { createNotification, createNotificationsMany };
