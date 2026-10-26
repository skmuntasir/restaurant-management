const AVATAR_COLORS = [
  "#b73e3e",
  "#5b45b0",
  "#7f167f",
  "#735f32",
  "#1d2569",
  "#285430",
  "#f6b100",
  "#025cca",
  "#be3e3f",
  "#02ca3a"
];

/**
 * Avatar background colour.
 * Pass a `seed` (e.g. the person's name) to get a STABLE colour for that
 * person. Without a seed it stays random, as before — but random colours
 * re-roll on every re-render, which made avatars flicker each time the
 * order list refreshed, so callers should always pass a seed.
 */
export const getBgColor = (seed) => {
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  }
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
};

export const getAvatarName = (name) => {
  if (!name) return "";
  // First letters of the first two words ("Rian Ahmed Khan" → "RA"), ignoring extra spaces.
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

export const formatDate = (date) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
};

export const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const getDateDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

// Percent change from `previous` to `current`. Returns null when there's
// no previous-day baseline to compare against (avoids a misleading 0%/∞%).
export const percentChange = (current, previous) => {
  if (!previous) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
};

/**
 * Returns the Unix timestamp of midnight (00:00:00.000) for today in the
 * local timezone. Used to filter orders to "today only" — list resets at
 * midnight every night.
 */
export const getMidnightToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/**
 * Returns true if the order was created today (after midnight).
 * Orders from previous days are hidden from the live list.
 */
export const isCreatedToday = (createdAt) => {
  if (!createdAt) return false;
  return new Date(createdAt).getTime() >= getMidnightToday();
};

/** Midnight (local time) N days ago, as an ISO string — used for the `from` filter on /api/order. */
export const startOfDaysAgoISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export const TAX_RATE_PERCENT = 5.25;

/**
 * Bill maths in ONE place (the cart panel, the bill box and the printed
 * receipt used to each repeat it). Mirrors the server's rounding exactly so
 * the total on screen is the total that gets charged.
 */
export const computeBill = (subtotal, discountPercent = 0) => {
  const r2 = (n) => Math.round(n * 100) / 100;
  const sub = r2(subtotal);
  const discount = r2((sub * discountPercent) / 100);
  const afterDiscount = r2(sub - discount);
  const tax = r2((afterDiscount * TAX_RATE_PERCENT) / 100);
  const total = r2(afterDiscount + tax);
  return { subtotal: sub, discount, afterDiscount, tax, total };
};

/**
 * Bill maths for a discount chosen at payment time — either a percentage or a
 * flat ৳ amount. Mirrors applyPaymentDiscount() on the server.
 */
export const computeBillWithDiscount = (subtotal, { type = "percent", value = 0 } = {}) => {
  const r2 = (n) => Math.round(n * 100) / 100;
  const sub = r2(subtotal);
  const v = Math.max(0, Number(value) || 0);
  const discount = type === "amount" ? Math.min(r2(v), sub) : r2((sub * Math.min(v, 100)) / 100);
  const afterDiscount = r2(sub - discount);
  const tax = r2((afterDiscount * TAX_RATE_PERCENT) / 100);
  return { subtotal: sub, discount, afterDiscount, tax, total: r2(afterDiscount + tax) };
};

export const formatMoney = (n) => `৳${(Number(n) || 0).toFixed(2)}`;

/** Order is still open (holding a table) — never hide these, whatever their age. */
export const isOpenOrder = (order) => order?.orderStatus === "pending" || order?.orderStatus === "in process";

/** Cashiers can give up to this much off; admins can go higher (the server enforces it too). */
export const MAX_CASHIER_DISCOUNT_PERCENT = 20;
export const maxDiscountForRole = (role) =>
  String(role || "").toLowerCase() === "admin" ? 100 : MAX_CASHIER_DISCOUNT_PERCENT;

/** Last 5 characters of an order id — what staff see and say out loud ("order 3f9a1"). */
export const shortOrderId = (id) => (id ? String(id).slice(-5) : "");
