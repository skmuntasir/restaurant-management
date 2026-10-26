const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Table = require("../models/tableModel");

/** Shared order rules used by the order and payment controllers. */

const TAX_RATE_PERCENT = 5.25; // keep in sync with frontend/src/utils/index.js
// Cashiers can give up to this much off; only admins can go higher.
const MAX_CASHIER_DISCOUNT_PERCENT = 20;

const r2 = (n) => Math.round(n * 100) / 100;

/** Bill maths in one place — mirrors computeBill() on the frontend. */
const buildBills = (subtotal, discountPercent = 0) => {
  const sub = r2(subtotal);
  const discountAmount = r2((sub * discountPercent) / 100);
  const total = r2(sub - discountAmount); // after discount, before tax
  const tax = r2((total * TAX_RATE_PERCENT) / 100);
  const totalWithTax = r2(total + tax);
  return { subtotal: sub, discountPercent, discountAmount, total, tax, totalWithTax };
};

/**
 * Applies a discount chosen AT PAYMENT TIME and recomputes the bill from the
 * order's own subtotal (the client never supplies a total).
 *   discount = { type: "percent" | "amount", value: number }
 * Cashiers are capped at MAX_CASHIER_DISCOUNT_PERCENT of the subtotal;
 * admins can go up to 100%.
 */
const applyPaymentDiscount = (order, discount, role) => {
  if (discount === undefined || discount === null) return;
  const type = discount.type;
  const value = Number(discount.value);
  if (!["percent", "amount"].includes(type) || !Number.isFinite(value) || value < 0) {
    throw createHttpError(400, "Invalid discount!");
  }
  const subtotal = order.bills.subtotal;
  const isAdmin = String(role || "").toLowerCase() === "admin";
  const capAmount = r2((subtotal * (isAdmin ? 100 : MAX_CASHIER_DISCOUNT_PERCENT)) / 100);

  let discountAmount;
  if (type === "percent") {
    if (value > 100) throw createHttpError(400, "Discount cannot be more than 100%!");
    discountAmount = r2((subtotal * value) / 100);
  } else {
    if (value > subtotal) throw createHttpError(400, "Discount cannot be more than the bill subtotal!");
    discountAmount = r2(value);
  }
  if (discountAmount > capAmount) {
    throw createHttpError(403, `Cashiers can give up to ${MAX_CASHIER_DISCOUNT_PERCENT}% off. Ask an admin for a bigger discount.`);
  }

  const total = r2(subtotal - discountAmount); // after discount, before tax
  const tax = r2((total * TAX_RATE_PERCENT) / 100);
  order.bills.discountPercent = subtotal > 0 ? r2((discountAmount / subtotal) * 100) : 0;
  order.bills.discountAmount = discountAmount;
  order.bills.total = total;
  order.bills.tax = tax;
  order.bills.totalWithTax = r2(total + tax);
};

// Aborts only if a transaction is still open — calling abortTransaction()
// after a commit throws, which would otherwise mask the real error.
const abortSafely = async (session) => {
  try {
    if (session.inTransaction()) await session.abortTransaction();
  } catch {
    /* transaction already finished */
  }
};

/**
 * Frees the order's main table and any extra tables (annexed / merged in).
 * Only tables that still belong to THIS order are touched, so closing an old
 * order can never free a table that has since been given to someone else.
 */
const releaseTablesForOrder = async (order, session) => {
  if (order.table) {
    await Table.updateOne(
      { _id: order.table, $or: [{ currentOrder: order._id }, { currentOrder: null }] },
      { status: "available", currentOrder: null, mergedInto: null },
      { session }
    );
  }
  await Table.updateMany(
    {
      $and: [
        { $or: [{ _id: { $in: order.mergedTables || [] } }, { mergedInto: order.table }] },
        { $or: [{ currentOrder: null }, { currentOrder: order._id }] },
      ],
    },
    { status: "available", currentOrder: null, mergedInto: null },
    { session }
  );
};

/**
 * Records a payment AND closes the order in one transaction: the order becomes
 * "completed" and its table(s) are freed. Paying is the single way to finish
 * an order, so the bill and the floor plan can never disagree.
 *
 * `check(order)` lets a caller add its own validation (e.g. the card session id).
 */
const settleOrderPayment = async (orderId, { method, check, paymentFields = {}, discount, role }) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await Order.findById(orderId).session(session);
    if (!order) throw createHttpError(404, "Order not found!");
    if (order.payment?.isPaid) throw createHttpError(400, "This order has already been paid!");
    if (order.orderStatus === "merged") throw createHttpError(400, "This order was merged into another table's order — pay that one instead.");
    if (order.orderStatus === "cancelled") throw createHttpError(400, "This order was cancelled and cannot be paid.");
    if (check) check(order);
    applyPaymentDiscount(order, discount, role);

    order.payment.isPaid = true;
    order.payment.method = method;
    order.payment.paidAt = new Date();
    Object.assign(order.payment, paymentFields);
    order.orderStatus = "completed";
    await order.save({ session });

    await releaseTablesForOrder(order, session);
    await session.commitTransaction();

    return Order.findById(order._id)
      .populate("table", "tableNo seats status")
      .populate("createdBy", "name role");
  } catch (error) {
    await abortSafely(session);
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  TAX_RATE_PERCENT,
  MAX_CASHIER_DISCOUNT_PERCENT,
  r2,
  buildBills,
  applyPaymentDiscount,
  abortSafely,
  releaseTablesForOrder,
  settleOrderPayment,
};
