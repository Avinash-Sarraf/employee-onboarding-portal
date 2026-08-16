const { fail } = require("../utils/apiResponse");
const { assertEmployeeRegistrationOnly } = require("../utils/authValidation");

/**
 * Blocks HR (or unknown) role values on the public registration endpoint.
 */
function registrationGuard(req, res, next) {
  const message = assertEmployeeRegistrationOnly(req.body);
  if (message) {
    return fail(res, message, 403);
  }
  next();
}

module.exports = registrationGuard;
