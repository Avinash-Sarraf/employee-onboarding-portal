const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const {
  saveProfile,
  getProfile,
  getMyProfile,
  deleteProfile,
  getAllEmployees,
  searchProfiles,
} = require("../controllers/profileController");

router.post("/", auth, saveProfile);

router.get("/me", auth, getMyProfile);

router.get("/search", auth, requireRole("hr"), searchProfiles);

router.get("/", auth, requireRole("hr"), getAllEmployees);

router.get("/:userId", auth, getProfile);

router.delete("/:userId", auth, deleteProfile);


module.exports = router;
