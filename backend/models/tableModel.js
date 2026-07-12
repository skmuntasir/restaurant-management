const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNo: { type: Number, required: true, unique: true },
    status: {
      type: String,
      enum: ["available", "booked"],
      default: "available",
    },
    seats: { type: Number, required: true },
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    // When this table has been merged into another table's order, this
    // points at that table — lets the UI show "merged into Table X" and
    // lets the split action find its way back.
    mergedInto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", tableSchema);
