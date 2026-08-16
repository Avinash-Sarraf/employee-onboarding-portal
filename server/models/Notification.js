const mongoose = require("mongoose");

const NOTIFICATION_TYPES = [
  "profile_verified",
  "profile_rejected",
  "profile_pending",
  "document_verified",
  "document_rejected",
  "document_pending",
  "chat_message",
  "joining_instructions",
  "training_update",
  "hr_announcement",
];

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: NOTIFICATION_TYPES,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, default: "", maxlength: 4000 },
    read: { type: Boolean, default: false, index: true },
    readAt: Date,
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);