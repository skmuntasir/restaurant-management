/**
 * SESSION_KEY lives in sessionStorage, which is:
 *   - Persisted across page REFRESHES within the same tab
 *   - Cleared when the TAB or BROWSER WINDOW is closed
 *   - NOT shared between tabs
 *
 * Flow:
 *   Login → set SESSION_KEY → app works as normal
 *   Close tab / browser → SESSION_KEY gone
 *   Re-open app → SESSION_KEY missing → backend cookie cleared → login screen
 *
 * It lives in its own tiny module (not in useLoadData) so the API layer can
 * import it without creating a circular dependency.
 */
export const SESSION_KEY = "restro_session_active";

export const hasActiveSession = () => {
  try { return Boolean(sessionStorage.getItem(SESSION_KEY)); } catch { return false; }
};
export const markSessionActive = () => {
  try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* storage unavailable */ }
};
/**
 * Bearer token (same JWT as the cookie). Phone browsers block the cross-site
 * cookie your Render API sets for the Vercel site, so the app also sends the
 * token in an Authorization header. It lives in sessionStorage — exactly like
 * the session flag — so closing the tab/browser still signs the user out.
 */
const TOKEN_KEY = "restro_auth_token";
let memoryToken = null; // fallback if sessionStorage is unavailable (private mode)

export const setAuthToken = (token) => {
  memoryToken = token || null;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable */ }
};
export const getAuthToken = () => {
  try { return sessionStorage.getItem(TOKEN_KEY) || memoryToken; } catch { return memoryToken; }
};

export const clearSession = () => {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* storage unavailable */ }
  setAuthToken(null);
};

/**
 * On a fresh visit the app clears any stale cookie with a background logout
 * call (so the first screen paints instantly instead of waiting on the
 * server). Login must not race that call — a late "clear cookie" response
 * arriving AFTER a successful login would silently log the user out again —
 * so login awaits this promise first.
 */
let bootLogout = Promise.resolve();
export const setBootLogout = (promise) => { bootLogout = Promise.resolve(promise).catch(() => {}); };
export const waitForBootLogout = () => bootLogout;

/**
 * ── Auto logout when the browser is closed ──────────────────────────────────
 * sessionStorage alone isn't enough: Chrome/Edge ("Continue where you left
 * off"), Safari and mobile browsers can RESTORE a closed window together with
 * its sessionStorage and session cookie, silently keeping the user logged in.
 *
 * So every open tab also writes a "last alive" timestamp to localStorage every
 * few seconds. On start-up, if that timestamp is missing or older than
 * ALIVE_GRACE_MS, no tab of this app was open → the browser was closed, so the
 * local session is dropped (and useLoadData clears the server cookie).
 * Refreshes / navigations / extra tabs reopen within milliseconds, so they stay
 * signed in.
 */
const ALIVE_KEY = "restro_last_alive";
const HEARTBEAT_MS = 2000;

// Desktop: a closed browser is detected after 15 s without a heartbeat.
// Phones: switching to another app freezes this page's timers and the OS may
// unload it, so a short grace would sign people out just for checking a
// message. Touch devices therefore get 30 minutes.
const DESKTOP_GRACE_MS = 15000;
const MOBILE_GRACE_MS = 30 * 60 * 1000;
const isTouchDevice = () => {
  try {
    return window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches;
  } catch {
    return false;
  }
};
const ALIVE_GRACE_MS = typeof window !== "undefined" && isTouchDevice() ? MOBILE_GRACE_MS : DESKTOP_GRACE_MS;

const writeAlive = () => {
  try { localStorage.setItem(ALIVE_KEY, String(Date.now())); } catch { /* storage unavailable */ }
};

const browserWasClosed = () => {
  try {
    const last = Number(localStorage.getItem(ALIVE_KEY));
    return !last || Date.now() - last > ALIVE_GRACE_MS;
  } catch {
    return false; // can't tell — fall back to the sessionStorage behaviour
  }
};

// Runs once when the app first loads in a tab (before anything reads the session).
if (typeof window !== "undefined") {
  if (browserWasClosed()) clearSession();
  writeAlive();
  setInterval(writeAlive, HEARTBEAT_MS);
  // Also stamp the moment the page is hidden/unloaded (app switch, tab discard),
  // so the grace period counts from when the user actually left.
  document.addEventListener("visibilitychange", () => writeAlive());
  window.addEventListener("pagehide", writeAlive);
}
