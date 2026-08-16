const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const auth = require("../middleware/authMiddleware");

const { uploadDocument, deleteDocument } = require("../controllers/uploadController");

router.post("/", auth, upload.single("file"), uploadDocument);
router.delete("/", auth, deleteDocument);

module.exports = router;
