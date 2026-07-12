import { createSlice } from "@reduxjs/toolkit";

const SEATS_PER_TABLE = 4;

const initialState = {
  orderId: "",
  customerName: "",
  customerPhone: "",
  guests: 0,
  tableNo: "",
  tableId: "",
  tablesNeeded: 1,          // calculated from guests / SEATS_PER_TABLE
  additionalTableIds: [],   // extra tables selected for large parties
};

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    setCustomer: (state, action) => {
      const { name, phone, guests } = action.payload;
      state.orderId = `${Date.now()}`;
      state.customerName = name;
      state.customerPhone = phone;
      state.guests = guests;
      state.tablesNeeded = Math.ceil(guests / SEATS_PER_TABLE) || 1;
      state.additionalTableIds = [];
    },
    removeCustomer: () => initialState,
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

export const SEATS_PER_TABLE_CONST = SEATS_PER_TABLE;
export const {
  setCustomer, removeCustomer, updateTable,
  addAdditionalTable, removeAdditionalTable,
} = customerSlice.actions;
export default customerSlice.reducer;
