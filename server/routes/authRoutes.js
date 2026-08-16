const express = require("express");
const { loginUser } = require("../controllers/authLogin");
const { registerUser } = require("../controllers/authRegister");
const auth = require("../middleware/authMiddleware");
const registrationGuard = require("../middleware/registrationGuard");
const { ok } = require("../utils/apiResponse");

const router = express.Router();

router.post("/register", registrationGuard, registerUser);
router.post("/login", loginUser);

router.get("/dashboard", auth, (req, res) => {
  return ok(res, {
    message: "Welcome to dashboard",
    data: { userId: req.user.id, role: req.user.role },
  });
});

module.exports = router;
