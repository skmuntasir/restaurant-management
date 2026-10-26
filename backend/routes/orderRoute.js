const express = require("express");
const { addOrder, addItemsToOrder, cancelOrder, getOrders, getPopularItems, getOrderById, updateOrder } = require("../controllers/orderController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const requireRole = require("../middlewares/requireRole");
const router = express.Router();

// Any logged-in staff (waiter/cashier/admin) can create and view orders.
// Changing order status (e.g. marking completed, which frees the table)
// is restricted to cashier/admin — a waiter shouldn't be able to close
// out an order/table on their own.
router.route("/").post(isVerifiedUser, addOrder).get(isVerifiedUser, getOrders);
// Must be registered before "/:id" or "popular" would be treated as an id.
router.route("/popular").get(isVerifiedUser, getPopularItems);
// Second round: add dishes to a table's open order.
router.route("/:id/items").patch(isVerifiedUser, addItemsToOrder);
// Void an unpaid order (reason required) — frees the table.
router.route("/:id/cancel").post(isVerifiedUser, requireRole(["admin", "cashier"]), cancelOrder);
router.route("/:id")
  .get(isVerifiedUser, getOrderById)
  .put(isVerifiedUser, requireRole(["admin", "cashier"]), updateOrder);

module.exports = router;
