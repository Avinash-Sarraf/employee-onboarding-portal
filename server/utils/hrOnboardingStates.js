/** Allowed values for Profile.hr.onboardingState — keep in sync with client constants */
const ONBOARDING_STATES = [
  "awaiting_profile",
  "profile_review",
  "documentation",
  "ready_to_join",
  "joined",
  "on_hold",
];

function isValidOnboardingState(v) {
  return ONBOARDING_STATES.includes(String(v || "").trim());
}

module.exports = { ONBOARDING_STATES, isValidOnboardingState };
