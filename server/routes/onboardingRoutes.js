const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const onboardingController = require("../controllers/onboardingController");

router.get(
  "/me",
  auth,
  requireRole("employee"),
  onboardingController.getEmployeeOnboardingMe
);

module.exports = router;
