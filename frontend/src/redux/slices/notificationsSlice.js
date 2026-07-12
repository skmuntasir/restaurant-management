import { createSlice } from "@reduxjs/toolkit";

/**
 * Lightweight in-app notification store.
 * Notifications are generated client-side when key events happen
 * (order placed, status changed, item marked unavailable). They live
 * in Redux — no backend needed for a single-device POS terminal.
 *
 * Each notification:
 *  { id, type, title, message, timestamp, isRead }
 */

const MAX_NOTIFICATIONS = 50; // keep last 50 to avoid memory bloat

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
  },
  reducers: {
    addNotification: (state, action) => {
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        isRead: false,
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      // Newest first
      state.items.unshift(notification);
      // Trim to max
      if (state.items.length > MAX_NOTIFICATIONS) {
        state.items = state.items.slice(0, MAX_NOTIFICATIONS);
      }
    },
    markAllRead: (state) => {
      state.items.forEach((n) => { n.isRead = true; });
    },
    markRead: (state, action) => {
      const notif = state.items.find((n) => n.id === action.payload);
      if (notif) notif.isRead = true;
    },
    clearAll: (state) => {
      state.items = [];
    },
  },
});

export const unreadCount = (state) =>
  state.notifications.items.filter((n) => !n.isRead).length;

export const { addNotification, markAllRead, markRead, clearAll } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;
