const validator = require("validator");

const ROLES = Object.freeze({
  EMPLOYEE: "employee",
  HR: "hr",
});

const PASSWORD_POLICY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (@$!%*?&).";

function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

function normalizeName(name) {
  if (typeof name !== "string") return "";
  return name.trim().replace(/\s+/g, " ");
}

/**
 * Reject self-service HR registration (API must never create HR via /register).
 */
function assertEmployeeRegistrationOnly(body) {
  const role = body?.role;
  if (role == null || role === "") return null;

  const normalized = String(role).trim().toLowerCase();
  if (normalized === ROLES.HR) {
    return "HR accounts cannot be created through registration. Contact your administrator.";
  }
  if (normalized !== ROLES.EMPLOYEE) {
    return "Invalid role. Only employee registration is allowed.";
  }
  return null;
}

function validateEmployeeRegistration({ name, email, password }) {
  const errors = {};

  const cleanName = normalizeName(name);
  if (!cleanName) errors.name = "Full name is required.";
  else if (cleanName.length < 2) errors.name = "Full name must be at least 2 characters.";

  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) errors.email = "Email is required.";
  else if (!validator.isEmail(cleanEmail)) errors.email = "Enter a valid email address.";

  if (!password) errors.password = "Password is required.";
  else if (!PASSWORD_POLICY.test(password)) errors.password = PASSWORD_POLICY_MESSAGE;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      name: cleanName,
      email: cleanEmail,
      password,
      role: ROLES.EMPLOYEE,
    },
  };
}

function validateLogin({ email, password }) {
  const errors = {};

  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) errors.email = "Email is required.";
  else if (!validator.isEmail(cleanEmail)) errors.email = "Enter a valid email address.";

  if (!password) errors.password = "Password is required.";
  else if (typeof password !== "string" || password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { email: cleanEmail, password },
  };
}

function isAllowedRole(role) {
  return role === ROLES.EMPLOYEE || role === ROLES.HR;
}

function formatAuthUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || "",
    jobTitle: user.jobTitle || "",
    department: user.department || "",
  };
}

module.exports = {
  ROLES,
  PASSWORD_POLICY,
  PASSWORD_POLICY_MESSAGE,
  normalizeEmail,
  normalizeName,
  assertEmployeeRegistrationOnly,
  validateEmployeeRegistration,
  validateLogin,
  isAllowedRole,
  formatAuthUser,
};
