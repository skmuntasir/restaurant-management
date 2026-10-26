const express = require("express");
const { register, login, getUserData, logout, registerConfig, listUsers, listPendingSignups, approveSignup, rejectSignup, updateUserRole, deleteUser } = require("../controllers/userController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const requireRole = require("../middlewares/requireRole");
const rateLimit = require("../middlewares/rateLimit");
const router = express.Router();

// Limit brute-force attempts on login: 10 FAILED attempts per 15 minutes per
// IP. Successful sign-ins don't count, so a shared terminal/office network
// isn't locked out just because several staff log in during a shift.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: "Too many failed login attempts. Please try again in 15 minutes.",
});

// Authentication Routes
router.route("/register").post(register);
router.route("/register-config").get(registerConfig);
router.route("/login").post(loginRateLimiter, login);
// Logout needs no auth: clearing a cookie is always safe, and it must still
// work when the session token has already expired or is invalid.
router.route("/logout").post(logout);

router.route("/").get(isVerifiedUser , getUserData);

// Team management — admins only
router.route("/all").get(isVerifiedUser, requireRole(["admin"]), listUsers);
router.route("/pending").get(isVerifiedUser, requireRole(["admin"]), listPendingSignups);
router.route("/:id/approve").patch(isVerifiedUser, requireRole(["admin"]), approveSignup);
router.route("/:id/reject").patch(isVerifiedUser, requireRole(["admin"]), rejectSignup);
router.route("/:id/role").patch(isVerifiedUser, requireRole(["admin"]), updateUserRole);
router.route("/:id").delete(isVerifiedUser, requireRole(["admin"]), deleteUser);

module.exports = router;
