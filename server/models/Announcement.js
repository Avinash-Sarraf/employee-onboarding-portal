const mongoose = require("mongoose");

const AnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 8000 },
    audience: {
      type: String,
      enum: ["all_employees", "selected"],
      default: "all_employees",
      index: true,
    },
    targetUserIds: [{ type: String, trim: true }],
    createdBy: { type: String, required: true, trim: true, index: true },
    expiresAt: { type: Date, default: null, index: true },
    pinned: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ active: 1, pinned: -1, createdAt: -1 });

module.exports = mongoose.model("Announcement", AnnouncementSchema);
