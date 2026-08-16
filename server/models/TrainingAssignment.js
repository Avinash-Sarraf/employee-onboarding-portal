const mongoose = require("mongoose");

const STATUS = ["assigned", "in_progress", "completed"];

const TrainingAssignmentSchema = new mongoose.Schema(
  {
    employeeUserId: { type: String, required: true, trim: true, index: true },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrainingModule",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: STATUS,
      default: "assigned",
      index: true,
    },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    assignedBy: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

TrainingAssignmentSchema.index(
  { employeeUserId: 1, moduleId: 1 },
  { unique: true }
);

module.exports = mongoose.model("TrainingAssignment", TrainingAssignmentSchema);
