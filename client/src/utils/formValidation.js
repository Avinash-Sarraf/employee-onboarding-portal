/** Shared React-side validators (no native HTML validation). */

export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export const PASSWORD_POLICY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const PASSWORD_POLICY_MESSAGE =
  "At least 8 characters with uppercase, lowercase, a number, and a special character (@$!%*?&).";

export function validateEmail(email) {
  const value = String(email || "").trim();
  if (!value) return "Email is required.";
  if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address.";
  return "";
}

export function validatePassword(password, { minLength = 6, strict = false } = {}) {
  const value = String(password || "");
  if (!value) return "Password is required.";
  if (strict && !PASSWORD_POLICY.test(value)) return PASSWORD_POLICY_MESSAGE;
  if (value.length < minLength) {
    return `Password must be at least ${minLength} characters.`;
  }
  return "";
}

export function validateRequired(value, label = "This field") {
  if (!String(value || "").trim()) return `${label} is required.`;
  return "";
}

export function validateName(value, label = "Name") {
  const v = String(value || "").trim();
  if (!v) return `${label} is required.`;
  if (v.length < 2) return `${label} must be at least 2 characters.`;
  return "";
}
