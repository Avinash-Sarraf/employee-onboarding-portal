const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const notificationController = require("../controllers/notificationController");

router.get("/", auth, notificationController.listNotifications);
router.get("/unread-count", auth, notificationController.getUnreadCount);
router.patch("/:id/read", auth, notificationController.markRead);
router.post("/read-all", auth, notificationController.markAllRead);

module.exports = router;
