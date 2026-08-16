const { fail } = require("../utils/apiResponse");

/**
 * Require one of the given roles (e.g. requireRole("hr")).
 * Must run after authMiddleware.
 */
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return fail(res, "Authentication required", 401);
  }
  if (!allowedRoles.includes(req.user.role)) {
    return fail(res, "You do not have permission to access this resource", 403);
  }
  next();
};

module.exports = { requireRole };
