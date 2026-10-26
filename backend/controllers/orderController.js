const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Table = require("../models/tableModel");
const MenuItem = require("../models/menuItemModel");
const mongoose = require("mongoose");
const {
  MAX_CASHIER_DISCOUNT_PERCENT,
  r2,
  buildBills,
  abortSafely,
  releaseTablesForOrder,
} = require("../services/orderService");

const PHONE_REGEX = /^01\d{9}$/;

const validateAndComputeBills = async (items, discountPercent = 0) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw createHttpError(400, "Order must contain at least one item!");
  }
  if (typeof discountPercent !== "number" || Number.isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw createHttpError(400, "Discount must be a number between 0 and 100!");
  }

  // Validate every line first...
  for (const rawItem of items) {
    const { menuItem: menuItemId, quantity } = rawItem || {};
    if (!menuItemId || !mongoose.Types.ObjectId.isValid(menuItemId)) {
      throw createHttpError(400, "Each item must reference a valid menu item id!");
    }
    if (typeof quantity !== "number" || quantity < 1 || !Number.isInteger(quantity)) {
      throw createHttpError(400, "Each item must have a valid whole-number quantity (at least 1)!");
    }
  }

  // ...then fetch all menu items in ONE query instead of one query per line.
  const uniqueIds = [...new Set(items.map((i) => String(i.menuItem)))];
  const menuItems = await MenuItem.find({ _id: { $in: uniqueIds } }).lean();
  const menuById = new Map(menuItems.map((m) => [String(m._id), m]));

  const resolvedItems = [];
  let subtotal = 0;

  for (const { menuItem: menuItemId, quantity } of items) {
    const menuItem = menuById.get(String(menuItemId));
    if (!menuItem) throw createHttpError(404, `Menu item not found (id: ${menuItemId}).`);
    if (!menuItem.isAvailable) {
      throw createHttpError(400, `"${menuItem.name}" is currently unavailable and cannot be ordered.`);
    }
    const price = Math.round(menuItem.price * quantity * 100) / 100;
    subtotal += price;
    resolvedItems.push({ menuItem: menuItem._id, name: menuItem.name, pricePerQuantity: menuItem.price, quantity, price });
  }

  return { items: resolvedItems, bills: buildBills(subtotal, discountPercent) };
};

// Forward-only order status state machine.
const STATUS_ORDER = ["pending", "in process", "completed"];

const addOrder = async (req, res, next) => {
  const { table: tableId, customerDetails, items, discountPercent = 0, extraTables = [] } = req.body;

  // Validate everything BEFORE opening a DB session/transaction.
  if (!mongoose.Types.ObjectId.isValid(tableId)) {
    return next(createHttpError(400, "Invalid table id!"));
  }

  // Name and phone are optional for dine-in; guests defaults to 1 on the server.
  const details = customerDetails || {};
  const name = String(details.name || "").trim() || "Guest";
  const phone = String(details.phone || "").trim();
  const guests = Number(details.guests ?? 1);
  if (phone && !PHONE_REGEX.test(phone)) {
    return next(createHttpError(400, "Phone number must be a valid 11-digit Bangladeshi mobile number (e.g. 01712345678)!"));
  }
  if (!Number.isInteger(guests) || guests < 1) {
    return next(createHttpError(400, "Order must have at least 1 guest!"));
  }

  // Extra tables for a large party are claimed in the SAME transaction as the
  // order, so any cashier can seat a big group (the separate merge route is
  // admin-only) and a half-seated party can never be left behind.
  const extraIds = [...new Set((Array.isArray(extraTables) ? extraTables : []).map(String))]
    .filter((id) => id !== String(tableId));
  if (extraIds.length > 10 || extraIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    return next(createHttpError(400, "Invalid extra table(s)!"));
  }

  const discount = Number(discountPercent);
  // Roles are stored with mixed case ("Admin"/"admin") — normalise like requireRole does.
  const isAdmin = String(req.user.role || "").toLowerCase() === "admin";
  if (!isAdmin && discount > MAX_CASHIER_DISCOUNT_PERCENT) {
    return next(createHttpError(403, `Cashiers can give up to ${MAX_CASHIER_DISCOUNT_PERCENT}% off. Ask an admin for a bigger discount.`));
  }

  let resolved;
  try {
    resolved = await validateAndComputeBills(items, discount);
  } catch (validationError) {
    return next(validationError);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Atomic: only proceed if table is still available.
    // mergedInto is cleared so a table that was once merged can never be
    // left hidden from the floor plan while it has a live order.
    const table = await Table.findOneAndUpdate(
      { _id: tableId, status: "available" },
      { status: "booked", mergedInto: null },
      { new: true, session }
    );

    if (!table) {
      await abortSafely(session);
      return next(createHttpError(409, "Table is already booked or does not exist!"));
    }

    if (extraIds.length > 0) {
      const claimed = await Table.updateMany(
        { _id: { $in: extraIds }, status: "available" },
        { status: "booked", mergedInto: table._id },
        { session }
      );
      if (claimed.modifiedCount !== extraIds.length) {
        await abortSafely(session);
        return next(createHttpError(409, "One of the extra tables was just taken. Pick another table and try again."));
      }
    }

    const [order] = await Order.create(
      [{
        customerDetails: { name, ...(phone && { phone }), guests },
        orderStatus: "pending",
        bills: resolved.bills,
        items: resolved.items,
        table: tableId,
        mergedTables: extraIds,
        createdBy: req.user._id,
      }],
      { session }
    );

    table.currentOrder = order._id;
    await table.save({ session });
    if (extraIds.length > 0) {
      await Table.updateMany({ _id: { $in: extraIds } }, { currentOrder: order._id }, { session });
    }

    await session.commitTransaction();

    const populated = await Order.findById(order._id).populate("table").populate("createdBy", "name role");
    res.status(201).json({ success: true, message: "Order created!", data: populated });
  } catch (error) {
    await abortSafely(session);
    next(error);
  } finally {
    session.endSession();
  }
};

/**
 * PATCH /api/order/:id/items — "second round": add dishes to a table's open
 * order. The order keeps its existing discount; totals are recomputed here.
 */
const addItemsToOrder = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return next(createHttpError(400, "Invalid order id!"));

  let resolved;
  try {
    resolved = await validateAndComputeBills(req.body.items, 0);
  } catch (validationError) {
    return next(validationError);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await Order.findById(id).session(session);
    if (!order) {
      await abortSafely(session);
      return next(createHttpError(404, "Order not found!"));
    }
    if (!["pending", "in process"].includes(order.orderStatus) || order.payment?.isPaid) {
      await abortSafely(session);
      return next(createHttpError(400, "Only open, unpaid orders can have items added."));
    }

    const lines = order.items.map((i) => ({
      menuItem: i.menuItem, name: i.name, pricePerQuantity: i.pricePerQuantity, quantity: i.quantity, price: i.price,
    }));
    for (const line of resolved.items) {
      // Same dish at the same price → bump the quantity instead of a duplicate row.
      const same = lines.find((l) => String(l.menuItem) === String(line.menuItem) && l.pricePerQuantity === line.pricePerQuantity);
      if (same) {
        same.quantity += line.quantity;
        same.price = r2(same.pricePerQuantity * same.quantity);
      } else {
        lines.push(line);
      }
    }

    order.items = lines;
    order.bills = buildBills(lines.reduce((sum, l) => sum + l.price, 0), order.bills.discountPercent || 0);
    // New dishes need the kitchen's attention again.
    order.orderStatus = "pending";
    await order.save({ session });
    await session.commitTransaction();

    const populated = await Order.findById(order._id)
      .populate("table", "tableNo seats status")
      .populate("mergedTables", "tableNo")
      .populate("createdBy", "name role");
    res.status(200).json({ success: true, message: "Items added to the order!", data: populated });
  } catch (error) {
    await abortSafely(session);
    next(error);
  } finally {
    session.endSession();
  }
};

/**
 * POST /api/order/:id/cancel — void an unpaid order (with a reason), freeing
 * its table(s). Paid orders can't be voided here: that would be a refund.
 */
const cancelOrder = async (req, res, next) => {
  const { id } = req.params;
  const reason = String(req.body.reason || "").trim();
  if (!mongoose.Types.ObjectId.isValid(id)) return next(createHttpError(400, "Invalid order id!"));
  if (reason.length < 3 || reason.length > 200) {
    return next(createHttpError(400, "Please give a short reason (3–200 characters)."));
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await Order.findById(id).session(session);
    if (!order) {
      await abortSafely(session);
      return next(createHttpError(404, "Order not found!"));
    }
    if (order.orderStatus === "cancelled") {
      await abortSafely(session);
      return next(createHttpError(400, "This order is already cancelled."));
    }
    if (order.orderStatus === "merged") {
      await abortSafely(session);
      return next(createHttpError(400, "This order was merged into another table's order — cancel that one instead."));
    }
    if (order.payment?.isPaid) {
      await abortSafely(session);
      return next(createHttpError(400, "Paid orders can't be cancelled."));
    }

    order.orderStatus = "cancelled";
    order.cancelReason = reason;
    order.cancelledAt = new Date();
    order.cancelledBy = req.user._id;
    await order.save({ session });
    await releaseTablesForOrder(order, session);
    await session.commitTransaction();

    const populated = await Order.findById(order._id)
      .populate("table", "tableNo seats status")
      .populate("createdBy", "name role");
    res.status(200).json({ success: true, message: "Order cancelled.", data: populated });
  } catch (error) {
    await abortSafely(session);
    next(error);
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/order
 *   (no query)   → every order (used by the admin dashboard / payment tab)
 *   ?from=<ISO>  → only orders that matter for a recent window: created or
 *                  paid since `from`, PLUS anything still open (pending / in
 *                  process) however old. This keeps the live screens fast as
 *                  the order history grows, without ever hiding an unfinished
 *                  order that is still holding a table.
 */
const getOrders = async (req, res, next) => {
  try {
    const filter = {};
    const { from } = req.query;

    if (from) {
      const fromDate = new Date(from);
      if (Number.isNaN(fromDate.getTime())) {
        return next(createHttpError(400, "Invalid 'from' date!"));
      }
      filter.$or = [
        { createdAt: { $gte: fromDate } },
        { "payment.paidAt": { $gte: fromDate } },
        { orderStatus: { $in: ["pending", "in process"] } },
      ];
    }

    const orders = await Order.find(filter)
      .populate("table", "tableNo seats status")
      .populate("mergedTables", "tableNo")
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/order/popular?limit=10
 * Most-ordered dishes, computed in the database. Replaces downloading every
 * order to the browser just to count dish names.
 */
const getPopularItems = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    // Merged orders were folded into another order (counting them would count
    // the same dishes twice) and cancelled orders never happened.
    const match = { orderStatus: { $nin: ["merged", "cancelled"] } };

    const [data, totalOrders] = await Promise.all([
      Order.aggregate([
        { $match: match },
        { $unwind: "$items" },
        { $group: { _id: "$items.name", count: { $sum: "$items.quantity" } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: limit },
        { $project: { _id: 0, name: "$_id", count: 1 } },
      ]),
      Order.countDocuments(match),
    ]);

    res.status(200).json({ success: true, data, totalOrders });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return next(createHttpError(400, "Invalid order id!"));
    const order = await Order.findById(id).populate("table").populate("mergedTables", "tableNo").populate("createdBy", "name role");
    if (!order) return next(createHttpError(404, "Order not found!"));
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  const { id } = req.params;
  const { orderStatus } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(createHttpError(400, "Invalid order id!"));
  }
  if (!STATUS_ORDER.includes(orderStatus)) {
    return next(createHttpError(400, `Invalid status. Must be one of: ${STATUS_ORDER.join(", ")}`));
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const existingOrder = await Order.findById(id).session(session);
    if (!existingOrder) {
      await abortSafely(session);
      return next(createHttpError(404, "Order not found!"));
    }
    if (existingOrder.orderStatus === "merged") {
      await abortSafely(session);
      return next(createHttpError(400, "This order was merged into another table's order and can no longer be updated directly."));
    }
    if (existingOrder.orderStatus === "cancelled") {
      await abortSafely(session);
      return next(createHttpError(400, "This order was cancelled and can no longer be updated."));
    }

    // Enforce forward-only transitions (e.g. block completed -> pending).
    const currentStage = STATUS_ORDER.indexOf(existingOrder.orderStatus);
    const nextStage = STATUS_ORDER.indexOf(orderStatus);
    if (nextStage < currentStage) {
      await abortSafely(session);
      return next(createHttpError(400, `Cannot move order status backwards from "${existingOrder.orderStatus}" to "${orderStatus}".`));
    }

    // An order is finished by PAYING for it (see settleOrderPayment) — never
    // by flipping the status — so a table can't be freed with money uncollected.
    if (orderStatus === "completed" && !existingOrder.payment?.isPaid) {
      await abortSafely(session);
      return next(createHttpError(400, "Collect payment first — paying closes the order and frees the table."));
    }

    existingOrder.orderStatus = orderStatus;
    await existingOrder.save({ session });

    // Free table(s) atomically when the order is completed.
    if (orderStatus === "completed") await releaseTablesForOrder(existingOrder, session);

    await session.commitTransaction();

    const populated = await Order.findById(existingOrder._id)
      .populate("table", "tableNo seats status")
      .populate("createdBy", "name role");
    res.status(200).json({ success: true, message: "Order updated!", data: populated });
  } catch (error) {
    await abortSafely(session);
    next(error);
  } finally {
    session.endSession();
  }
};

module.exports = { addOrder, addItemsToOrder, cancelOrder, getOrders, getPopularItems, getOrderById, updateOrder };
