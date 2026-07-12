export const getBgColor = () => {
  const bgarr = [
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
  const randomBg = Math.floor(Math.random() * bgarr.length);
  const color = bgarr[randomBg];
  return color;
};

export const getAvatarName = (name) => {
  if(!name) return "";

  return name.split(" ").map(word => word[0]).join("").toUpperCase();

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