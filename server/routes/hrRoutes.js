const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const hrController = require("../controllers/hrController");

router.put(
  "/document-status",
  auth,
  requireRole("hr"),
  hrController.updateDocumentStatus
);
router.put(
  "/profile-status",
  auth,
  requireRole("hr"),
  hrController.updateProfileStatus
);

router.put(
  "/employee-settings",
  auth,
  requireRole("hr"),
  hrController.updateEmployeeHrSettings
);

router.get("/me", auth, requireRole("hr"), hrController.getHrMe);
router.put("/me", auth, requireRole("hr"), hrController.updateHrMe);

router.get(
  "/directory-users",
  auth,
  requireRole("hr"),
  hrController.listDirectoryUsers
);

router.post(
  "/broadcast-notifications",
  auth,
  requireRole("hr"),
  hrController.broadcastEmployeeNotifications
);

module.exports = router;
