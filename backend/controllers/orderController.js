const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Table = require("../models/tableModel");
const MenuItem = require("../models/menuItemModel");
const mongoose = require("mongoose");

const TAX_RATE_PERCENT = 5.25;

const validateAndComputeBills = async (items, discountPercent = 0) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw createHttpError(400, "Order must contain at least one item!");
  }
  if (typeof discountPercent !== "number" || discountPercent < 0 || discountPercent > 100) {
    throw createHttpError(400, "Discount must be a number between 0 and 100!");
  }

  const resolvedItems = [];
  let subtotal = 0;

  for (const rawItem of items) {
    const { menuItem: menuItemId, quantity } = rawItem || {};
    if (!menuItemId || !mongoose.Types.ObjectId.isValid(menuItemId)) {
      throw createHttpError(400, "Each item must reference a valid menu item id!");
    }
    if (typeof quantity !== "number" || quantity < 1 || !Number.isInteger(quantity)) {
      throw createHttpError(400, "Each item must have a valid whole-number quantity (at least 1)!");
    }
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) throw createHttpError(404, `Menu item not found (id: ${menuItemId}).`);
    if (!menuItem.isAvailable) {
      throw createHttpError(400, `"${menuItem.name}" is currently unavailable and cannot be ordered.`);
    }
    const price = Math.round(menuItem.price * quantity * 100) / 100;
    subtotal += price;
    resolvedItems.push({ menuItem: menuItem._id, name: menuItem.name, pricePerQuantity: menuItem.price, quantity, price });
  }

  subtotal   = Math.round(subtotal * 100) / 100;
  const discountAmt = Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
  const afterDiscount = Math.round((subtotal - discountAmt) * 100) / 100;
  const tax  = Math.round(((afterDiscount * TAX_RATE_PERCENT) / 100) * 100) / 100;
  const totalWithTax = Math.round((afterDiscount + tax) * 100) / 100;

  return {
    items: resolvedItems,
    bills: { total: afterDiscount, tax, totalWithTax, subtotal, discountPercent, discountAmount: discountAmt },
  };
};

// Forward-only order status state machine.
const STATUS_ORDER = ["pending", "in process", "completed"];

const addOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { table: tableId, customerDetails, items, discountPercent = 0 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      await session.abortTransaction(); session.endSession();
      return next(createHttpError(400, "Invalid table id!"));
    }

    let resolved;
    try {
      resolved = await validateAndComputeBills(items, Number(discountPercent));
    } catch (validationError) {
      await session.abortTransaction(); session.endSession();
      return next(validationError);
    }

    // Atomic: only proceed if table is still available
    const table = await Table.findOneAndUpdate(
      { _id: tableId, status: "available" },
      { status: "booked" },
      { new: true, session }
    );

    if (!table) {
      await session.abortTransaction(); session.endSession();
      return next(createHttpError(409, "Table is already booked or does not exist!"));
    }

    const [order] = await Order.create(
      [{
        customerDetails,
        orderStatus: "pending",
        bills: resolved.bills,
        items: resolved.items,
        table: tableId,
        createdBy: req.user._id,
      }],
      { session }
    );

    table.currentOrder = order._id;
    await table.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populated = await Order.findById(order._id).populate("table").populate("createdBy", "name role");
    res.status(201).json({ success: true, message: "Order created!", data: populated });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("table", "tableNo seats status")
      .populate("mergedTables", "tableNo")
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction(); session.endSession();
      return next(createHttpError(400, "Invalid order id!"));
    }

    if (!STATUS_ORDER.includes(orderStatus)) {
      await session.abortTransaction(); session.endSession();
      return next(createHttpError(400, `Invalid status. Must be one of: ${STATUS_ORDER.join(", ")}`));
    }

    const existingOrder = await Order.findById(id).session(session);
    if (!existingOrder) {
      await session.abortTransaction(); session.endSession();
      return next(createHttpError(404, "Order not found!"));
    }
    if (existingOrder.orderStatus === "merged") {
      await session.abortTransaction(); session.endSession();
      return next(createHttpError(400, "This order was merged into another table's order and can no longer be updated directly."));
    }

    // Enforce forward-only transitions (e.g. block completed -> pending).
    const currentStage = STATUS_ORDER.indexOf(existingOrder.orderStatus);
    const nextStage = STATUS_ORDER.indexOf(orderStatus);
    if (nextStage < currentStage) {
      await session.abortTransaction(); session.endSession();
      return next(createHttpError(400, `Cannot move order status backwards from "${existingOrder.orderStatus}" to "${orderStatus}".`));
    }

    // NOTE: the frontend has no payment-gating UI yet (orders are marked
    // "completed" directly from a status dropdown), so we deliberately do
    // NOT block completion on `payment.isPaid` here.

    existingOrder.orderStatus = orderStatus;
    await existingOrder.save({ session });

    // Free table atomically when order is completed
    if (orderStatus === "completed" && existingOrder.table) {
      await Table.findByIdAndUpdate(
        existingOrder.table,
        { status: "available", currentOrder: null },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    const populated = await Order.findById(existingOrder._id)
      .populate("table", "tableNo seats status")
      .populate("createdBy", "name role");
    res.status(200).json({ success: true, message: "Order updated!", data: populated });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

module.exports = { addOrder, getOrders, getOrderById, updateOrder };
