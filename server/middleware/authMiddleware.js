const jwt = require("jsonwebtoken");
const { fail } = require("../utils/apiResponse");

const JWT_SECRET = process.env.JWT_SECRET || "employee-onboarding-secret";

function extractToken(req) {
  const raw = req.header("Authorization") || req.header("authorization") || "";
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed.slice(7).trim() || null;
  }
  return trimmed || null;
}

/**
 * Verifies JWT and attaches req.user = { id, role } (both strings).
 */
function authMiddleware(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return fail(res, "Authentication required", 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const id = decoded.id != null ? String(decoded.id) : null;
    const role =
      decoded.role === "hr" || decoded.role === "employee" ? decoded.role : null;

    if (!id || !role) {
      return fail(res, "Invalid token payload", 401);
    }

    req.user = { id, role };
    next();
  } catch {
    return fail(res, "Invalid or expired token", 401);
  }
}

authMiddleware.extractToken = extractToken;
module.exports = authMiddleware;
