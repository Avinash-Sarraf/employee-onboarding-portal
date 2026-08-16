/**
 * Provision an HR user in the database (run once per environment).
 *
 * Usage:
 *   Set HR_SEED_EMAIL, HR_SEED_PASSWORD, and MONGO_URI in .env, then:
 *   node scripts/seedHr.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { normalizeEmail, normalizeName } = require("../utils/authValidation");

async function main() {
  const email = normalizeEmail(process.env.HR_SEED_EMAIL);
  const password = process.env.HR_SEED_PASSWORD;
  const name = normalizeName(process.env.HR_SEED_NAME || "HR Administrator");
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("MONGO_URI is required in .env");
    process.exit(1);
  }
  if (!email || !password) {
    console.error("HR_SEED_EMAIL and HR_SEED_PASSWORD are required in .env");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("HR_SEED_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "hr") {
      console.error(
        `User ${email} exists but role is "${existing.role}". Resolve manually before seeding HR.`
      );
      process.exit(1);
    }
    console.log(`HR user already exists: ${email}`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email,
    password: hash,
    role: "hr",
  });

  console.log(`HR user created: ${email}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
