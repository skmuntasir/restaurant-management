const express = require("express");
const { register, login, getUserData, logout } = require("../controllers/userController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const rateLimit = require("../middlewares/rateLimit");
const router = express.Router();

// Limit brute-force attempts on login: 5 attempts per 15 minutes per IP
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again in 15 minutes.",
});

// Authentication Routes
router.route("/register").post(register);
router.route("/login").post(loginRateLimiter, login);
router.route("/logout").post(isVerifiedUser, logout)

router.route("/").get(isVerifiedUser , getUserData);

module.exports = router;
