const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true, trim: true }, // snapshot at order time (name could change later)
    pricePerQuantity: { type: Number, required: true, min: 0 }, // snapshot of price at order time
    quantity: {
      type: Number, required: true, min: 1,
      validate: { validator: Number.isInteger, message: "Quantity must be a whole number!" }
    },
    price: { type: Number, required: true, min: 0 }, // pricePerQuantity * quantity
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerDetails: {
      // Name and phone are optional for dine-in — a walk-in party is just "Guest".
      name: { type: String, trim: true, default: "Guest" },
      phone: {
        type: String,
        trim: true,
        validate: {
          validator: (v) => !v || /^01\d{9}$/.test(v),
          message: "Phone number must be a valid 11-digit Bangladeshi mobile number (e.g. 01712345678)!"
        }
      },
      guests: { type: Number, required: true, min: [1, "Order must have at least 1 guest!"] },
    },
    orderStatus: {
      type: String,
      // "merged" marks an order whose table/items were folded into another
      // order via the table-merge feature — kept for audit history rather
      // than deleted outright. "cancelled" is a voided order (reason recorded
      // below) — it never counts toward sales and frees its table(s).
      enum: ["pending", "in process", "completed", "merged", "cancelled"],
      default: "pending",
      required: true,
    },
    bills: {
      subtotal: { type: Number, required: true, min: 0 },       // before discount
      discountPercent: { type: Number, default: 0, min: 0, max: 100 },
      discountAmount: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },           // after discount, before tax
      tax: { type: Number, required: true, min: 0 },
      totalWithTax: { type: Number, required: true, min: 0 },    // final amount
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Order must contain at least one item!"
      }
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    // Other table numbers that were merged into this order's table, kept so
    // the receipt/admin view can show "Table 4 (merged with Table 7)".
    mergedTables: [{ type: mongoose.Schema.Types.ObjectId, ref: "Table" }],

    // Which staff member took this order — enables per-staff stats and
    // accountability (who placed/served a given order).
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Set when an order is voided.
    cancelReason: { type: String, trim: true, maxlength: 200 },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    payment: {
      isPaid: { type: Boolean, default: false },
      method: { type: String, enum: ["card", "cash", null], default: null },
      razorpayOrderId: { type: String, default: null }, // demo payment session id
      razorpayPaymentId: { type: String, default: null }, // demo payment id
      paidAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Indexes for the queries the app actually runs (newest-first lists, date
// windows, per-table lookups, "still open" filters).
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ "payment.paidAt": 1 });
orderSchema.index({ table: 1 });

module.exports = mongoose.model("Order", orderSchema);
