import axios from "axios";
import store from "../redux/store";
import { removeUser } from "../redux/slices/userSlice";
import { removeAllItems } from "../redux/slices/cartSlice";
import { removeCustomer } from "../redux/slices/customerSlice";
import { clearSession } from "../utils/session";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  // Free-tier hosts can take ~30–50s to wake from sleep; don't hang forever.
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// If the session expires mid-shift the API answers 401. Instead of every
// screen failing with a cryptic toast, drop the local session so the router
// sends the user back to the login page.
const AUTH_ENDPOINTS = ["/api/user/login", "/api/user/register", "/api/user/logout", "/api/user/register-config"];
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    const isAuthEndpoint = AUTH_ENDPOINTS.some((e) => url.includes(e));
    if (status === 401 && !isAuthEndpoint && store.getState().user.isAuth) {
      clearSession();
      store.dispatch(removeAllItems());
      store.dispatch(removeCustomer());
      store.dispatch(removeUser());
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data) => api.post("/api/user/login", data);
export const register = (data) => api.post("/api/user/register", data);
export const getRegisterConfig = () => api.get("/api/user/register-config");
export const getUserData = () => api.get("/api/user/");
export const logout = () => api.post("/api/user/logout");

// Team (admin only)
export const getUsers = () => api.get("/api/user/all");
export const updateUserRole = (id, role) => api.patch(`/api/user/${id}/role`, { role });
export const deleteUser = (id) => api.delete(`/api/user/${id}`);
export const getPendingSignups = () => api.get("/api/user/pending");
export const approveSignup = (id) => api.patch(`/api/user/${id}/approve`);
export const rejectSignup = (id) => api.patch(`/api/user/${id}/reject`);

// Tables
export const addTable = (data) => api.post("/api/table/", data);
export const getTables = () => api.get("/api/table/");
export const updateTable = (id, data) => api.put(`/api/table/${id}`, data);
export const deleteTable = (id) => api.delete(`/api/table/${id}`);
export const mergeTables = (data) => api.post("/api/table/merge", data);
export const releaseMergedTable = (id) => api.post(`/api/table/${id}/release-merge`);

// Orders
export const addOrder = (data) => api.post("/api/order/", data);
// `params.from` (ISO date) limits the list to a recent window — see backend.
export const getOrders = (params) => api.get("/api/order/", { params });
export const getPopularItems = (limit = 10) => api.get("/api/order/popular", { params: { limit } });
export const getOrderById = (id) => api.get(`/api/order/${id}`);
export const updateOrder = (id, data) => api.put(`/api/order/${id}`, data);
// "Second round": add dishes to a table's open order.
export const addItemsToOrder = (id, data) => api.patch(`/api/order/${id}/items`, data);
// Void an unpaid order (a reason is required) — frees its table(s).
export const cancelOrder = (id, data) => api.post(`/api/order/${id}/cancel`, data);

// Payments
export const createPaymentOrder = (data) => api.post("/api/payment/create-order", data);
export const verifyPayment = (data) => api.post("/api/payment/verify", data);
export const recordCashPayment = (data) => api.post("/api/payment/cash", data);

// Categories (menu management)
export const addCategory = (data) => api.post("/api/category/", data);
export const getCategories = () => api.get("/api/category/");
export const updateCategory = (id, data) => api.put(`/api/category/${id}`, data);
export const deleteCategory = (id) => api.delete(`/api/category/${id}`);

// Menu Items (menu management)
export const addMenuItem = (data) => api.post("/api/menu-item/", data);
export const getMenuItems = (categoryId) => api.get("/api/menu-item/", { params: categoryId ? { category: categoryId } : {} });
export const updateMenuItem = (id, data) => api.put(`/api/menu-item/${id}`, data);
export const toggleMenuItemAvailability = (id) => api.patch(`/api/menu-item/${id}/toggle-availability`);
export const deleteMenuItem = (id) => api.delete(`/api/menu-item/${id}`);
