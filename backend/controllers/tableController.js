const Table = require("../models/tableModel");
const Order = require("../models/orderModel");
const createHttpError = require("http-errors");
const mongoose = require("mongoose");

const SEATS_MAP = [4, 2, 6, 4, 3, 4, 5, 5, 6, 6, 4, 6, 2, 6, 3];

const seedTables = async () => {
  try {
    const count = await Table.countDocuments();
    if (count >= 15) {
      console.log("✅ Tables already seeded in DB");
      return;
    }
    const ops = SEATS_MAP.map((seats, i) => ({
      updateOne: {
        filter: { tableNo: i + 1 },
        update: {
          $setOnInsert: {
            tableNo: i + 1,
            seats,
            status: "available",
            currentOrder: null,
          },
        },
        upsert: true,
      },
    }));
    await Table.bulkWrite(ops);
    console.log("✅ 15 tables seeded into MongoDB");
  } catch (err) {
    console.error("❌ Table seeding failed:", err.message);
  }
};

const addTable = async (req, res, next) => {
  try {
    const { tableNo, seats } = req.body;
    if (!tableNo || !seats)
      return next(createHttpError(400, "Please provide tableNo and seats!"));
    const existing = await Table.findOne({ tableNo });
    if (existing) return next(createHttpError(400, "Table already exists!"));
    const newTable = new Table({ tableNo, seats });
    await newTable.save();
    res.status(201).json({ success: true, message: "Table added!", data: newTable });
  } catch (error) {
    next(error);
  }
};

const getTables = async (req, res, next) => {
  try {
    const tables = await Table.find()
      .sort({ tableNo: 1 })
      .populate({ path: "currentOrder", select: "customerDetails orderStatus" });
    res.status(200).json({ success: true, data: tables });
  } catch (error) {
    next(error);
  }
};

const updateTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, currentOrder } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return next(createHttpError(400, "Invalid table id!"));
    const update = {};
    if (status !== undefined) update.status = status;
    if (currentOrder !== undefined) update.currentOrder = currentOrder || null;
    const table = await Table.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!table) return next(createHttpError(404, "Table not found!"));
    res.status(200).json({ success: true, message: "Table updated!", data: table });
  } catch (error) {
    next(error);
  }
};

const TAX_RATE_PERCENT = 5.25; // keep in sync with orderController.js

/**
 * Merge a source table's active order into a target table's active order —
 * e.g. a walk-in party needs Table 4 and Table 7 combined. The source
 * table's items/bill get folded into the target order, the source table
 * is freed up for reuse, and its order is marked "merged" for audit
 * history rather than deleted.
 *
 * Limitation: this is a one-way merge. There is no automatic bill-splitting
 * back to individual tables — releasing a merged table later (see
 * releaseMergedTable) frees the table but does NOT move its items back out
 * of the combined bill. For a full split-by-item flow you'd need to track
 * which table each item came from, which is a larger schema change.
 */
const mergeTables = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { sourceTableId, targetTableId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(sourceTableId) || !mongoose.Types.ObjectId.isValid(targetTableId)) {
      await session.abortTransaction(); session.endSession();
      return next(createHttpError(400, "Invalid table id(s)!"));
    }
    if (sourceTableId === targetTableId) {
      await session.abortTransaction(); session.endSession();
      return next(createHttpError(400, "Cannot merge a table into itself!"));
    }

    const sourceTable = await Table.findById(sourceTableId).session(session);
    const targetTable = await Table.findById(targetTableId).session(session);

    if (!sourceTable || !targetTable) {
      await session.abortTransaction(); session.endSession();
      return next(createHttpError(404, "Table(s) not found!"));
    }
    // Target must always have an active order
    if (targetTable.status !== "booked" || !targetTable.currentOrder) {
      await session.abortTransaction(); session.endSession();
      return next(createHttpError(400, "Target table must have an active order to merge into!"));
    }

    const targetOrder = await Order.findById(targetTable.currentOrder).session(session);
    if (!targetOrder) {
      await session.abortTransaction(); session.endSession();
      return next(createHttpError(404, "Target order not found!"));
    }

    // ── CASE 1: source is an EMPTY table (no active order) ──────────────
    // Used when a large party needs an extra table annexed to their existing
    // order, or when auto-merging pre-selected tables at order creation time.
    if (sourceTable.status === "available" && !sourceTable.currentOrder) {
      targetOrder.mergedTables = [
        ...new Set([...targetOrder.mergedTables.map(String), String(sourceTable._id)]),
      ];
      await targetOrder.save({ session });

      sourceTable.status = "booked";
      sourceTable.currentOrder = targetTable.currentOrder;
      sourceTable.mergedInto = targetTable._id;
      await sourceTable.save({ session });

      await session.commitTransaction();
      session.endSession();

      const populated = await Order.findById(targetOrder._id).populate("table mergedTables");
      return res.status(200).json({
        success: true,
        message: `Table ${sourceTable.tableNo} added to Table ${targetTable.tableNo}'s order!`,
        data: populated,
      });
    }

    // ── CASE 2: source has its own active order — combine items ──────────
    if (sourceTable.status !== "booked" || !sourceTable.currentOrder) {
      await session.abortTransaction(); session.endSession();
      return next(createHttpError(400, "Source table must be available or have an active order!"));
    }

    const sourceOrder = await Order.findById(sourceTable.currentOrder).session(session);
    if (!sourceOrder) {
      await session.abortTransaction(); session.endSession();
      return next(createHttpError(404, "Source order not found!"));
    }

    // Combine items and recompute totals server-side
    const combinedItems = [...targetOrder.items, ...sourceOrder.items];

    // Recompute bills using the full schema shape (subtotal + discount fields are required)
    const subtotal     = Math.round(combinedItems.reduce((sum, i) => sum + i.price, 0) * 100) / 100;
    // Merged orders reset the discount to 0 — each original order had its own discount
    // already applied to its item prices, so we don't double-apply here.
    const discountPercent = 0;
    const discountAmount  = 0;
    const afterDiscount   = subtotal;
    const tax          = Math.round(((afterDiscount * TAX_RATE_PERCENT) / 100) * 100) / 100;
    const totalWithTax = Math.round((afterDiscount + tax) * 100) / 100;

    targetOrder.items = combinedItems;
    targetOrder.bills = { subtotal, discountPercent, discountAmount, total: afterDiscount, tax, totalWithTax };
    // Carry over any tables already merged into the source, plus the source itself
    targetOrder.mergedTables = [
      ...new Set([
        ...targetOrder.mergedTables.map(String),
        ...sourceOrder.mergedTables.map(String),
        String(sourceTable._id),
      ]),
    ];
    await targetOrder.save({ session });

    sourceOrder.orderStatus = "merged";
    await sourceOrder.save({ session });

    sourceTable.status = "available";
    sourceTable.currentOrder = null;
    sourceTable.mergedInto = targetTable._id;
    await sourceTable.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populatedTarget = await Order.findById(targetOrder._id).populate("table mergedTables");
    res.status(200).json({
      success: true,
      message: `Table ${sourceTable.tableNo} merged into Table ${targetTable.tableNo}!`,
      data: populatedTarget,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * Releases a previously-merged table back to the floor plan (status
 * "available", mergedInto cleared). Does NOT split the combined bill back
 * apart — see the limitation note on mergeTables above.
 */
const releaseMergedTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(createHttpError(400, "Invalid table id!"));

    const table = await Table.findById(id);
    if (!table) return next(createHttpError(404, "Table not found!"));
    if (!table.mergedInto) return next(createHttpError(400, "This table is not currently merged into another table!"));

    const targetTableId = table.mergedInto;

    table.mergedInto = null;
    table.status = "available";
    table.currentOrder = null;
    await table.save();

    // Best-effort: also drop it from the target order's mergedTables list display
    const targetTable = await Table.findById(targetTableId);
    if (targetTable?.currentOrder) {
      await Order.findByIdAndUpdate(targetTable.currentOrder, {
        $pull: { mergedTables: table._id },
      });
    }

    res.status(200).json({ success: true, message: `Table ${table.tableNo} released back to the floor plan!`, data: table });
  } catch (error) {
    next(error);
  }
};

module.exports = { seedTables, addTable, getTables, updateTable, mergeTables, releaseMergedTable };
