import { createSlice } from "@reduxjs/toolkit";

const SEATS_PER_TABLE = 4; // used for the 2nd, 3rd… table of a large party

export const initialCustomerState = {
  active: false,            // an order is being built (name/phone are optional, so this is the real signal)
  orderId: "",              // short id shown while building the order
  customerName: "",
  customerPhone: "",
  guests: 0,
  tableNo: "",
  tableId: "",
  tablesNeeded: 1,          // 1 table, or more for a large party
  additionalTableIds: [],   // extra tables selected for large parties
  // "Add items" mode: the cart is appended to this existing open order
  // instead of creating a new one.
  appendOrderId: "",
  appendDiscountPercent: 0, // the existing order's discount (read-only while appending)
};

const customerSlice = createSlice({
  name: "customer",
  initialState: initialCustomerState,
  reducers: {
    // Start a fresh order for a party. The table is chosen right after (updateTable).
    setCustomer: (state, action) => {
      const { name = "", phone = "", guests, tablesNeeded } = action.payload;
      Object.assign(state, initialCustomerState);
      state.additionalTableIds = [];
      state.active = true;
      state.orderId = `${Date.now()}`.slice(-5);
      state.customerName = name;
      state.customerPhone = phone;
      state.guests = guests;
      state.tablesNeeded = tablesNeeded || Math.ceil(guests / SEATS_PER_TABLE) || 1;
    },
    // Start adding dishes to a table's existing open order.
    startAppend: (_state, action) => {
      const { orderId, shortId, tableId, tableNo, name, guests, discountPercent } = action.payload;
      return {
        ...initialCustomerState,
        additionalTableIds: [],
        active: true,
        orderId: shortId || "",
        customerName: name || "",
        guests: guests || 0,
        tableNo,
        tableId,
        appendOrderId: orderId,
        appendDiscountPercent: discountPercent || 0,
      };
    },
    removeCustomer: () => initialCustomerState,
    updateTable: (state, action) => {
      const { table } = action.payload;
      state.tableNo = table.tableNo;
      state.tableId = table.tableId;
    },
    addAdditionalTable: (state, action) => {
      const { tableId } = action.payload;
      if (!state.additionalTableIds.includes(tableId)) {
        state.additionalTableIds.push(tableId);
      }
    },
    removeAdditionalTable: (state, action) => {
      state.additionalTableIds = state.additionalTableIds.filter(
        (id) => id !== action.payload
      );
    },
  },
});

/** How many tables a party needs when seated at `table` (its own seats count first). */
export const tablesNeededFor = (guests, seatsAtFirstTable) =>
  guests <= (seatsAtFirstTable || SEATS_PER_TABLE)
    ? 1
    : 1 + Math.ceil((guests - seatsAtFirstTable) / SEATS_PER_TABLE);

// Selectors
export const selectDraftActive = (state) => state.customer.active;
/** The order is ready for the menu: a table is chosen (and all extra tables for a big party), or we're appending. */
export const selectDraftReady = (state) => {
  const c = state.customer;
  if (!c.active || !c.tableId) return false;
  if (c.appendOrderId) return true;
  return 1 + (c.additionalTableIds || []).length >= (c.tablesNeeded || 1);
};

export const SEATS_PER_TABLE_CONST = SEATS_PER_TABLE;
export const {
  setCustomer, startAppend, removeCustomer, updateTable,
  addAdditionalTable, removeAdditionalTable,
} = customerSlice.actions;
export default customerSlice.reducer;
