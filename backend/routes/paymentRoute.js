const express = require("express");
const { createPaymentOrder, verifyPayment, recordCashPayment } = require("../controllers/paymentController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const requireRole = require("../middlewares/requireRole");
const router = express.Router();

router.route("/create-order").post(isVerifiedUser, createPaymentOrder);
router.route("/verify").post(isVerifiedUser, verifyPayment);
router.route("/cash").post(isVerifiedUser, requireRole(["admin", "cashier"]), recordCashPayment);

module.exports = router;
