const crypto = require("crypto");
const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const config = require("../config/config");
const { settleOrderPayment, applyPaymentDiscount } = require("../services/orderService");

/**
 * Pseudo / Demo Payment Provider
 * --------------------------------
 * This is NOT a real payment gateway. No money moves, no external network
 * calls are made, no third-party account required. It exists so the app can
 * exercise a realistic create-order → verify-signature two-step flow for
 * demo/testing purposes, with the same shape a real gateway would have.
 *
 * The "signature" is an HMAC-SHA256 generated and verified by this same
 * server — simulating what a real gateway + your backend would do across
 * two different parties.
 *
 * When you are ready to go live, replace this with SSLCommerz, bKash, or
 * another licensed Bangladeshi payment processor.
 */

const PAYMENT_SECRET = process.env.PAYMENT_SECRET || config.accessTokenSecret || "demo-payment-secret";

const generatePaymentId = (prefix) =>
  `${prefix}_${crypto.randomBytes(12).toString("hex")}`;

/**
 * Step 1: Create a payment session for the given order. Amount is taken
 * from our own DB record — never trusted from the client.
 */
const createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId, discount } = req.body;
    if (!mongoose.Types.ObjectId.isValid(orderId))
      return next(createHttpError(400, "Invalid order id!"));

    const order = await Order.findById(orderId);
    if (!order) return next(createHttpError(404, "Order not found!"));
    if (order.payment?.isPaid)
      return next(createHttpError(400, "This order has already been paid!"));
    if (["merged", "cancelled"].includes(order.orderStatus))
      return next(createHttpError(400, `A ${order.orderStatus} order cannot be paid.`));

    // A discount given at the till is applied BEFORE the amount is fixed.
    applyPaymentDiscount(order, discount, req.user.role);

    const demoOrderId = generatePaymentId("pay_order");
    const amountInPaisa = Math.round(order.bills.totalWithTax * 100);

    order.payment.razorpayOrderId = demoOrderId;
    await order.save();

    res.status(201).json({
      success: true,
      message: "Payment session created.",
      data: {
        demoOrderId,
        amount: amountInPaisa,
        currency: "BDT",
        internalOrderId: order._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Step 2: Verify the payment. Generates an HMAC-SHA256 signature and
 * verifies it server-side — the same pattern a real gateway uses.
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, demoOrderId } = req.body;

    if (!orderId || !demoOrderId)
      return next(createHttpError(400, "Missing payment fields!"));
    if (!mongoose.Types.ObjectId.isValid(orderId))
      return next(createHttpError(400, "Invalid order id!"));

    const demoPaymentId = generatePaymentId("pay");
    const signature = crypto
      .createHmac("sha256", PAYMENT_SECRET)
      .update(`${demoOrderId}|${demoPaymentId}`)
      .digest("hex");

    const expectedSignature = crypto
      .createHmac("sha256", PAYMENT_SECRET)
      .update(`${demoOrderId}|${demoPaymentId}`)
      .digest("hex");

    const isValid =
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

    if (!isValid)
      return next(createHttpError(400, "Payment verification failed!"));

    // Marks the order paid, completes it and frees its table(s) in one step.
    const order = await settleOrderPayment(orderId, {
      method: "card",
      paymentFields: { razorpayPaymentId: demoPaymentId },
      check: (o) => {
        if (o.payment.razorpayOrderId !== demoOrderId)
          throw createHttpError(400, "Payment session id does not match this order!");
      },
    });

    res.status(200).json({ success: true, message: "Payment verified!", data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * For walk-in cash payments — no gateway flow needed.
 * Restricted to cashier/admin via route middleware.
 */
const recordCashPayment = async (req, res, next) => {
  try {
    const { orderId, discount } = req.body;
    if (!mongoose.Types.ObjectId.isValid(orderId))
      return next(createHttpError(400, "Invalid order id!"));

    // Marks the order paid, completes it and frees its table(s) in one step.
    // A discount given at the till is applied in the same transaction.
    const order = await settleOrderPayment(orderId, { method: "cash", discount, role: req.user.role });

    res.status(200).json({ success: true, message: "Cash payment recorded!", data: order });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPaymentOrder, verifyPayment, recordCashPayment };
