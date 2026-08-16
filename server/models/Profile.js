const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, trim: true },

    personal: {
      fullName: { type: String, trim: true },
      dob: Date,
      gender: { type: String, enum: ["Male", "Female", "Other"] },
      phone: { type: String, match: /^[0-9]{10}$/ },
      email: { type: String, lowercase: true, trim: true },
      placeOfBirth: String,
      nationality: String,
      address: { present: String, permanent: String },
      bankDetails: { accountNumber: String, ifsc: String },
    },

    academic: {
      highestQualification: String,
      university: String,
      passingYear: Number,
      grades: String,
      branch: String,
    },

    professional: {
      role: String,
      department: String,
      employmentType: {
        type: String,
        enum: ["Full-time", "Intern", "Contract"],
      },
      joiningDate: Date,
      workLocation: String,
    },

    technicalSkills: [String],

    pastExperience: [
      {
        company: String,
        role: String,
        duration: String,
        location: String,
        technologies: [String],
      },
    ],

    documents: [
      {
        docType: {
          type: String,
          enum: [
            "RESUME",
            "AADHAR",
            "PAN",
            "DEGREE",
            "NDA",
            "EXPERIENCE_CERTIFICATE",
          ],
        },
        fileName: String,
        fileUrl: String,
        uploadDate: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        verificationComment: { type: String, default: "", maxlength: 2000 },
        reviewedAt: Date,
        reviewedBy: { type: String, trim: true },
      },
    ],

    ndaAgreement: {
      signed: Boolean,
      signedOn: Date,
      documentId: String,
    },

    hr: {
      status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
      comment: { type: String, default: "", maxlength: 4000 },
      reviewedAt: Date,
      reviewedBy: { type: String, trim: true },
      joiningInstructions: {
        type: String,
        default: "",
        maxlength: 10000,
      },
      /** HR-assigned official start date (may differ from profile professional.joiningDate) */
      assignedJoiningDate: { type: Date, default: null },
      /** User id of reporting manager (any user in directory, typically employee or HR) */
      reportingManagerUserId: { type: String, trim: true, default: "" },
      officeLocation: { type: String, trim: true, default: "", maxlength: 500 },
      reportingInstructions: {
        type: String,
        default: "",
        maxlength: 10000,
      },
      onboardingState: {
        type: String,
        enum: [
          "awaiting_profile",
          "profile_review",
          "documentation",
          "ready_to_join",
          "joined",
          "on_hold",
        ],
        default: "awaiting_profile",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", ProfileSchema);
