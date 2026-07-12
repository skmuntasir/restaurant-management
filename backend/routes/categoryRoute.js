const express = require("express");
const { addCategory, getCategories, updateCategory, deleteCategory } = require("../controllers/categoryController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const requireRole = require("../middlewares/requireRole");
const router = express.Router();

// Any logged-in staff can view categories (needed to browse the menu).
// Only admins can create/edit/delete categories.
router.route("/")
  .post(isVerifiedUser, requireRole(["admin"]), addCategory)
  .get(isVerifiedUser, getCategories);

router.route("/:id")
  .put(isVerifiedUser, requireRole(["admin"]), updateCategory)
  .delete(isVerifiedUser, requireRole(["admin"]), deleteCategory);

module.exports = router;
