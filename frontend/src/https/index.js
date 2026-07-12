import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Auth
export const login = (data) => api.post("/api/user/login", data);
export const register = (data) => api.post("/api/user/register", data);
export const getUserData = () => api.get("/api/user/");
export const logout = () => api.post("/api/user/logout");

// Tables
export const addTable = (data) => api.post("/api/table/", data);
export const getTables = () => api.get("/api/table/");
export const updateTable = (id, data) => api.put(`/api/table/${id}`, data);
export const mergeTables = (data) => api.post("/api/table/merge", data);
export const releaseMergedTable = (id) => api.post(`/api/table/${id}/release-merge`);

// Orders
export const addOrder = (data) => api.post("/api/order/", data);
export const getOrders = () => api.get("/api/order/");
export const getOrderById = (id) => api.get(`/api/order/${id}`);
export const updateOrder = (id, data) => api.put(`/api/order/${id}`, data);

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
