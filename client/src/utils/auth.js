const TOKEN_KEY = "token";
const USER_KEY = "user";

/**
 * Normalize stored/API user to always use `id` (never rely on `_id` on the client).
 */
export function normalizeUser(u) {
  if (!u || typeof u !== "object") return null;
  const id =
    u.id != null
      ? String(u.id)
      : u._id != null
      ? String(u._id)
      : null;
  if (!id) return null;
  return {
    id,
    name: u.name || "",
    email: u.email || "",
    role: u.role === "hr" ? "hr" : "employee",
    phone: u.phone != null ? String(u.phone) : "",
    jobTitle: u.jobTitle != null ? String(u.jobTitle) : "",
    department: u.department != null ? String(u.department) : "",
  };
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return normalizeUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function setAuth(token, user) {
  if (!token) return;
  const normalized = normalizeUser(user);
  if (!normalized) return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(normalized));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isHr() {
  return getUser()?.role === "hr";
}

export function isEmployee() {
  return getUser()?.role === "employee";
}
