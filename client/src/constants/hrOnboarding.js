export const ONBOARDING_STATE_OPTIONS = [
  { value: "awaiting_profile", label: "Awaiting profile" },
  { value: "profile_review", label: "Profile in review" },
  { value: "documentation", label: "Documentation" },
  { value: "ready_to_join", label: "Ready to join" },
  { value: "joined", label: "Joined" },
  { value: "on_hold", label: "On hold" },
];

export function onboardingStateLabel(value) {
  return (
    ONBOARDING_STATE_OPTIONS.find((o) => o.value === value)?.label ||
    value ||
    "—"
  );
}
