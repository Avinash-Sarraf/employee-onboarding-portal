const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const trainingController = require("../controllers/trainingController");

router.get(
  "/modules",
  auth,
  requireRole("hr"),
  trainingController.listModulesHr
);
router.post(
  "/modules",
  auth,
  requireRole("hr"),
  trainingController.createModule
);
router.patch(
  "/modules/:moduleId",
  auth,
  requireRole("hr"),
  trainingController.updateModule
);
router.delete(
  "/modules/:moduleId",
  auth,
  requireRole("hr"),
  trainingController.deleteModule
);

router.post(
  "/assignments",
  auth,
  requireRole("hr"),
  trainingController.assignModules
);

router.get(
  "/my-modules",
  auth,
  requireRole("employee"),
  trainingController.listMyModules
);
router.patch(
  "/my-modules/:moduleId/progress",
  auth,
  requireRole("employee"),
  trainingController.updateMyProgress
);

module.exports = router;
