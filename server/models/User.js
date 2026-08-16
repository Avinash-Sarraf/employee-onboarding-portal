const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["employee", "hr"],
    default: "employee",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: { type: String, trim: true, default: "", maxlength: 20 },
  jobTitle: { type: String, trim: true, default: "", maxlength: 120 },
  department: { type: String, trim: true, default: "", maxlength: 120 },
});

module.exports = mongoose.model("User", userSchema);
