import { createSlice } from "@reduxjs/toolkit";

export const initialCartState = {
  items: [],
  discountPercent: 0,   // 0–100, set manually (cashiers are capped, admins aren't)
};
const initialState = initialCartState;

const MAX_LINE_QTY = 99;
const round2 = (n) => Math.round(n * 100) / 100;

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Adding a dish that's already in the cart bumps its quantity instead of
    // creating a duplicate line.
    addItems: (state, action) => {
      const incoming = action.payload;
      const existing = state.items.find((i) => i.menuItem === incoming.menuItem);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + incoming.quantity, MAX_LINE_QTY);
        existing.price = round2(existing.pricePerQuantity * existing.quantity);
      } else {
        state.items.push(incoming);
      }
    },
    setItemQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((i) => i.id === id);
      if (!item) return;
      if (quantity < 1) {
        state.items = state.items.filter((i) => i.id !== id);
        return;
      }
      item.quantity = Math.min(quantity, MAX_LINE_QTY);
      item.price = round2(item.pricePerQuantity * item.quantity);
    },
    removeItem: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    removeAllItems: (state) => {
      state.items = [];
      state.discountPercent = 0;
    },
    setDiscount: (state, action) => {
      const val = parseFloat(action.payload);
      state.discountPercent = isNaN(val) ? 0 : Math.min(Math.max(val, 0), 100);
    },
  },
});

// Selectors
export const getCartItems    = (state) => state.cart.items;
// While adding dishes to an existing order, that order's own discount applies
// (and can't be edited here); otherwise it's the discount typed into the cart.
export const getDiscountPct  = (state) =>
  state.customer.appendOrderId ? state.customer.appendDiscountPercent : state.cart.discountPercent;
export const getTotalPrice   = (state) =>
  state.cart.items.reduce((total, item) => total + item.price, 0);

export const { addItems, setItemQuantity, removeItem, removeAllItems, setDiscount } = cartSlice.actions;
export default cartSlice.reducer;
