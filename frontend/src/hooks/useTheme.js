import { useCallback, useSyncExternalStore } from "react";

const KEY = "restro-theme";
const listeners = new Set();

const read = () => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

const apply = (theme) => {
  const root = document.documentElement;
  // Brief colour transition only while switching (not on every hover etc.)
  root.classList.add("theme-anim");
  root.setAttribute("data-theme", theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#fafaf9" : "#18191b");
  try { localStorage.setItem(KEY, theme); } catch { /* private mode — theme just won't persist */ }
  window.setTimeout(() => root.classList.remove("theme-anim"), 320);
  listeners.forEach((l) => l());
};

const subscribe = (cb) => { listeners.add(cb); return () => listeners.delete(cb); };

/** Current theme ("light" | "dark"), a setter and a toggle. Persisted in localStorage. */
export default function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => "light");
  const setTheme = useCallback((t) => apply(t === "dark" ? "dark" : "light"), []);
  const toggle = useCallback(() => apply(read() === "light" ? "dark" : "light"), []);
  return { theme, setTheme, toggle, isLight: theme === "light" };
}
