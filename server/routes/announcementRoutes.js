const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const announcementController = require("../controllers/announcementController");

router.get(
  "/feed",
  auth,
  requireRole("employee"),
  announcementController.listFeedEmployee
);

router.get(
  "/",
  auth,
  requireRole("hr"),
  announcementController.listAllHr
);

router.post(
  "/",
  auth,
  requireRole("hr"),
  announcementController.createAnnouncement
);

router.patch(
  "/:id",
  auth,
  requireRole("hr"),
  announcementController.patchAnnouncement
);

module.exports = router;
