const Profile = require("../models/Profile");
const User = require("../models/User");

/**
 * Ensures an employee has a profile shell (documents array, HR defaults).
 * Used before document upload and when loading /profile/me.
 */
async function ensureEmployeeProfile(userId, hints = {}) {
  const id = String(userId).trim();
  if (!id) return null;

  const existing = await Profile.findOne({ userId: id });
  if (existing) return existing;

  let email = hints.email ? String(hints.email).trim().toLowerCase() : "";
  let fullName = hints.fullName ? String(hints.fullName).trim() : "";

  if (!email || !fullName) {
    const user = await User.findById(id).select("email name").lean();
    if (user) {
      if (!email) email = user.email || "";
      if (!fullName) fullName = user.name || "";
    }
  }

  try {
    const profile = await Profile.findOneAndUpdate(
      { userId: id },
      {
        $setOnInsert: {
          userId: id,
          personal: { email, fullName },
          professional: { role: "NA", department: "NA" },
          documents: [],
          technicalSkills: [],
          pastExperience: [],
          hr: {
            status: "pending",
            onboardingState: "awaiting_profile",
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return profile;
  } catch (err) {
    if (err?.code === 11000) {
      return Profile.findOne({ userId: id });
    }
    throw err;
  }
}

module.exports = { ensureEmployeeProfile };
