const express = require("express");
const { addOrder, getOrders, getOrderById, updateOrder } = require("../controllers/orderController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const requireRole = require("../middlewares/requireRole");
const router = express.Router();

// Any logged-in staff (waiter/cashier/admin) can create and view orders.
// Changing order status (e.g. marking completed, which frees the table)
// is restricted to cashier/admin — a waiter shouldn't be able to close
// out an order/table on their own.
router.route("/").post(isVerifiedUser, addOrder).get(isVerifiedUser, getOrders);
router.route("/:id")
  .get(isVerifiedUser, getOrderById)
  .put(isVerifiedUser, requireRole(["admin", "cashier"]), updateOrder);

module.exports = router;
