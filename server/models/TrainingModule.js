const mongoose = require("mongoose");

const TrainingModuleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 8000 },
    estimatedMinutes: { type: Number, min: 0, max: 10080, default: 0 },
    sortOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true, index: true },
    createdBy: { type: String, required: true, trim: true, index: true },
  },
  { timestamps: true }
);

TrainingModuleSchema.index({ sortOrder: 1, createdAt: -1 });

module.exports = mongoose.model("TrainingModule", TrainingModuleSchema);
