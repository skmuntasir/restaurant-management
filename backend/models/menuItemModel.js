const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    type: { type: String, enum: ["Vegetarian", "Non-Vegetarian", "Hot", "Cold", "Mocktail"], default: "Vegetarian" },

    // Real-world "86'd item" flag — admin/cashier can mark an item unavailable
    // (out of stock / kitchen 86'd it) without deleting it from the menu.
    isAvailable: { type: Boolean, default: true },

    // Optional stock count. null/undefined = unlimited (most restaurant items
    // don't track exact stock; this is here for items that do, e.g. limited
    // daily specials).
    stock: { type: Number, default: null, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MenuItem", menuItemSchema);
