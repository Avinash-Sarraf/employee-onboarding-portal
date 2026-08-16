const mongoose = require("mongoose");

/**
 * One conversation per employee with HR (shared inbox for all HR users).
 */
const ConversationSchema = new mongoose.Schema(
  {
    employeeUserId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    lastMessageAt: { type: Date, default: () => new Date(0), index: true },
    lastMessagePreview: { type: String, default: "", maxlength: 200 },
    lastMessageFromUserId: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema);
