const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { ensureEmployeeProfile } = require("../utils/ensureProfile");
const jwt = require("jsonwebtoken");
const { ok, fail } = require("../utils/apiResponse");
const {
  assertEmployeeRegistrationOnly,
  validateEmployeeRegistration,
  formatAuthUser,
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
 * Employee self-registration only. HR accounts must be provisioned by an administrator.
 */
exports.registerUser = async (req, res) => {
  try {
    const hrBlock = assertEmployeeRegistrationOnly(req.body);
    if (hrBlock) {
      return fail(res, hrBlock, 403);
    }

    const { name, email, password } = req.body;
    const validation = validateEmployeeRegistration({ name, email, password });

    if (!validation.valid) {
      return fail(res, "Please fix the highlighted fields.", 400, {
        errors: validation.errors,
      });
    }

    const { name: cleanName, email: cleanEmail, password: cleanPassword, role } =
      validation.data;

    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      return fail(res, "An account with this email already exists. Try logging in instead.", 409);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(cleanPassword, salt);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role,
    });

    await ensureEmployeeProfile(user._id.toString(), {
      email: cleanEmail,
      fullName: cleanName,
    });

    const token = signToken(user);

    return ok(
      res,
      {
        message: "Employee account created successfully.",
        token,
        user: formatAuthUser(user),
      },
      201
    );
  } catch (error) {
    if (error?.code === 11000) {
      return fail(res, "An account with this email already exists.", 409);
    }
    console.error("Register error:", error);
    return fail(res, "Unable to complete registration. Please try again later.", 500);
  }
};
