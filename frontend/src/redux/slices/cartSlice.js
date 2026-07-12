import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  discountPercent: 0,   // 0–100, set manually by admin / cashier
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItems: (state, action) => {
      state.items.push(action.payload);
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
export const getDiscountPct  = (state) => state.cart.discountPercent;
export const getTotalPrice   = (state) =>
  state.cart.items.reduce((total, item) => total + item.price, 0);

export const { addItems, removeItem, removeAllItems, setDiscount } = cartSlice.actions;
export default cartSlice.reducer;
