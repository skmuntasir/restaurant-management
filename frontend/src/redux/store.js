import { configureStore } from "@reduxjs/toolkit";
import customerSlice, { initialCustomerState } from "./slices/customerSlice"
import cartSlice, { initialCartState } from "./slices/cartSlice";
import userSlice from "./slices/userSlice";
import notificationsSlice from "./slices/notificationsSlice";

// The order being built (cart + customer + table) survives a page refresh.
// sessionStorage keeps it per browser tab and drops it when the tab closes —
// logging out or an expired session clears it too (those dispatch
// removeAllItems / removeCustomer, which this subscriber persists).
const DRAFT_KEY = "restro.orderDraft.v1";

const isValidLine = (i) =>
  i && typeof i.id === "string" && typeof i.menuItem === "string" && typeof i.name === "string" &&
  Number.isFinite(i.quantity) && Number.isFinite(i.pricePerQuantity) && Number.isFinite(i.price);

const loadDraft = () => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return undefined;
    const saved = JSON.parse(raw);
    const preloaded = {};
    if (saved?.cart && Array.isArray(saved.cart.items)) {
      preloaded.cart = {
        ...initialCartState,
        items: saved.cart.items.filter(isValidLine),
        discountPercent: Number(saved.cart.discountPercent) || 0,
      };
    }
    if (saved?.customer && typeof saved.customer === "object") {
      preloaded.customer = { ...initialCustomerState, ...saved.customer };
    }
    return preloaded;
  } catch {
    return undefined; // corrupt or unavailable storage → start clean
  }
};

const store = configureStore({
    reducer: {
        customer: customerSlice,
        cart: cartSlice,
        user: userSlice,
        notifications: notificationsSlice,
    },
    preloadedState: loadDraft(),
    // (was `import.meta.env.NODE_ENV`, which doesn't exist in Vite — so
    // devtools were left on in production builds.)
    devTools: import.meta.env.DEV,
});

let lastCart = store.getState().cart;
let lastCustomer = store.getState().customer;
store.subscribe(() => {
  const { cart, customer } = store.getState();
  if (cart === lastCart && customer === lastCustomer) return;
  lastCart = cart;
  lastCustomer = customer;
  try {
    if (cart.items.length === 0 && !customer.active) sessionStorage.removeItem(DRAFT_KEY);
    else sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ cart, customer }));
  } catch {
    /* storage full or blocked — the order just won't survive a refresh */
  }
});

export default store;
