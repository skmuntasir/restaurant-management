const express = require("express");
const { addMenuItem, getMenuItems, updateMenuItem, toggleAvailability, deleteMenuItem } = require("../controllers/menuItemController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const requireRole = require("../middlewares/requireRole");
const router = express.Router();

// Any logged-in staff can browse the menu.
// Only admins can create/edit/delete dishes.
// Admin or cashier can toggle availability (the common "86 this item"
// action needs to be quick during service, not admin-only).
router.route("/")
  .post(isVerifiedUser, requireRole(["admin"]), addMenuItem)
  .get(isVerifiedUser, getMenuItems);

router.route("/:id")
  .put(isVerifiedUser, requireRole(["admin"]), updateMenuItem)
  .delete(isVerifiedUser, requireRole(["admin"]), deleteMenuItem);

router.route("/:id/toggle-availability")
  .patch(isVerifiedUser, requireRole(["admin", "cashier"]), toggleAvailability);

module.exports = router;
