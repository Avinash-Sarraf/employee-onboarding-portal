const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const chatController = require("../controllers/chatController");

router.get("/conversations", auth, chatController.listConversations);
router.post("/conversations/ensure", auth, chatController.ensureConversation);

router.get(
  "/conversations/:conversationId/messages",
  auth,
  chatController.getMessages
);
router.post(
  "/conversations/:conversationId/messages",
  auth,
  chatController.postMessage
);

module.exports = router;
