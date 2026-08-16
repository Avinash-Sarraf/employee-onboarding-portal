const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ok, fail } = require("../utils/apiResponse");
const {
  validateLogin,
  isAllowedRole,
  formatAuthUser,
  ROLES,
} = require("../utils/authValidation");

const JWT_SECRET = process.env.JWT_SECRET || "employee-onboarding-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: "employee-onboarding-portal",
      subject: user._id.toString(),
    }
  );
}

/**
 * Login for employees and HR. Role is always read from the database — never from the client.
 */
exports.loginUser = async (req, res) => {
  try {
    const validation = validateLogin(req.body);

    if (!validation.valid) {
      return fail(res, "Please check your email and password.", 400, {
        errors: validation.errors,
      });
    }

    const { email, password } = validation.data;

    const user = await User.findOne({ email });
    if (!user) {
      return fail(res, "Invalid email or password.", 401);
    }

    if (!isAllowedRole(user.role)) {
      console.error("Login blocked: invalid role on user", user._id, user.role);
      return fail(res, "Account configuration error. Contact support.", 403);
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return fail(res, "Invalid email or password.", 401);
    }

    const token = signToken(user);
    const roleLabel = user.role === ROLES.HR ? "HR" : "Employee";

    return ok(res, {
      message: `${roleLabel} sign-in successful.`,
      token,
      user: formatAuthUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return fail(res, "Unable to sign in. Please try again later.", 500);
  }
};
