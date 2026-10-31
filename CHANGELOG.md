# Changelog

## Auto-logout grace on phones: 30 minutes
- The "browser was closed" check in `frontend/src/utils/session.js` now waits 30 minutes on touch devices (it stays 15 seconds on desktop), so switching to another app and coming back no longer signs you out.
- The last-alive time is also stamped when the page is hidden or unloaded, so the 30 minutes counts from when you left.
- Frontend only.

## Fix: login bounced back to the login page on phones
- **Cause:** the session cookie is set by the Render API but the site is served from Vercel (a different domain). Phone browsers (iOS Safari, Chrome/Brave on Android) block that cross-site cookie, so the login succeeded but the very next request had no session and the app returned to the login screen. Desktop browsers still allowed it, which is why it only showed on phones.
- **Fix:** the login response now also returns the token; the app keeps it in `sessionStorage` (cleared when the tab/browser closes, same as before) and sends it as `Authorization: Bearer <token>` on every API call. The API accepts the cookie *or* the header. Cookie behaviour is unchanged, so desktop and existing sessions keep working.
- Files: `backend/controllers/userController.js`, `backend/middlewares/tokenVerification.js`, `frontend/src/utils/session.js`, `frontend/src/https/index.js`, `frontend/src/components/auth/Login.jsx`.
- No UI, layout or other behaviour changes. **Redeploy both Render (backend) and Vercel (frontend).**

## Staff tracking on the Dashboard (all time)
- Dashboard → Orders has a new **Taken by** column (with an **Admin** badge when an admin took the order).
- New **Orders taken by** bar: how many orders each staff member, admins included, has taken across the whole order history. Tap a person to filter the table to their orders.
- Search on that table also matches the staff member's name. Orders by deleted accounts are grouped as "Former staff".
- Frontend only.

## New Red Wood emblem
- Browser-tab icon (`public/favicon.png`), header logo and loading-screen logo now use the new circular Red Wood Restro emblem (transparent background, works on light and dark themes).
- Header no longer applies the light-mode colour inversion that the old white logo needed.
- Favicon link has `?v=2` so browsers pick up the new icon instead of the cached old one.

## Popular dishes: no photos
- Removed the dish photos from Popular dishes. They were picked by rank from a few placeholder pictures, so they didn't match the dish. Rank, name, bar and count remain.

## Staff tracking on the Orders page (admin only)
- Every order card shows **Taken by <name>**, with an **Admin** badge when an admin took the order.
- New **Taken by** bar above the orders: how many orders each staff member (admins included) took on the current board. Tap a person to see only their orders; the status counts follow the selection.
- Orders whose staff account was later deleted are grouped as "Former staff".
- Frontend only; the API already returned who created each order.

## Popular dishes follow the current menu
- `GET /api/order/popular` now only ranks dishes that still exist on the menu and shows their current menu name. Dishes deleted from the menu no longer stay in the ranking.
- Order history and revenue are unchanged. Old orders keep their saved dish names.

## Mobile-friendly pass
- Menu: the order panel is now a real bottom sheet on phones (it used to sit beside the menu and squash it).
- Notification dropdown no longer runs off the left edge on narrow screens.
- Tables: status filter pills no longer force sideways scrolling; table cards wrap their status pill instead of clipping it.
- Pages use dynamic viewport height (`dvh`), so nothing is cut off by the mobile browser's address/tool bars; Orders layout no longer relies on a hardcoded header height.
- Safe-area support: bottom nav and floating buttons clear the iPhone home bar / gesture bar.
- Form fields are 16px on touch screens (stops iOS zooming in on focus); hover effects only apply on devices that can hover.
- Bigger touch targets: quantity steppers, order-card actions, modal close buttons, chips.
- Modals scroll and stay inside the screen on short phones; dashboard tables scroll sideways inside their card.
- Header, sign-in ticket and Menu header fit 320px screens; tapping a bar in the weekly revenue chart shows its amount.
- Frontend only. No backend or API changes.

## Rebrand: Restro → Red Wood
- The app is now called **Red Wood**: header, sign-in/sign-up screens, page titles, loading screen, printed receipts and the HTML title/description.
- Internal storage keys (theme, order draft, session) keep their old names so existing devices don't lose their settings.

## Sign-up approval
- New sign-ups (everyone except the very first admin) now wait as **pending** until an admin approves them; they can't sign in or use the API meanwhile.
- Sign-up shows a "Request sent to the admin" confirmation; signing in early shows an amber "waiting for approval" notice.
- Dashboard → Team has a **Sign-up requests** queue with Approve / Reject. Approved users start as Cashier; declined requests can be approved later, removed, or re-submitted by the user.
- Admins see a count badge on the dashboard icon and Team tab, plus a bell notification when a new request arrives (checked every 30s).
- Backend: `status` field on users (existing accounts count as approved), `GET /api/user/pending`, `PATCH /api/user/:id/approve|reject` (admin only).

## Owner model & Team management
- Sign-up never accepts a role. The first account created becomes the main Admin; every later account is a Cashier (decided on the server).
- `ADMIN_SIGNUP_CODE` is removed and no longer needed. Existing admins stay admins.
- New Dashboard → Team tab (admins only): list users, change role (with in-app confirmation), remove users.
- Server safeguards: the last admin can't be demoted or deleted; only admins can list users, change roles or delete users.

## Simpler, calmer UI (light by default)

- Light theme is now the default (a saved choice is still respected; the toggle stays).
- Flat surfaces: no gradients, glow shadows, glass blur, ambient haze, sheen, floating/pulsing/zoom animations. Cards are solid with one thin border.
- One typeface (Inter) everywhere — Playfair Display removed.
- Gold is reserved for primary actions / selected states; everything else is neutral. Softer dark palette with off-white text.
- Tables show a quiet "Free / In use" badge; order cards lost their coloured top bar; top-3 dishes use flat badges.
- Dashboard header: the six pill buttons became one "Manage menu & tables" menu (Add / Edit per tables, categories, dishes).

## Unreleased — manage menu/tables + reliable auto-logout

- Auto logout when the browser is closed: open tabs write a heartbeat to localStorage; if no tab was alive on start-up (browser closed, even if the browser restores the old session), the user is signed out.
- Dashboard: new "Manage Tables / Categories / Dishes" dialogs so admins can edit and delete, not just add.
- Backend: `PUT /api/table/:id` accepts `tableNo` / `seats`; new admin-only `DELETE /api/table/:id` (refused while a table is in use or merged).
- Table seeding now only runs on an empty database so deleted tables don't reappear after a restart.


## Receipt printing & discount at payment

- **Print** now produces a proper 80 mm receipt (brand header, order/table/date/guest/staff, itemised lines with qty × price, subtotal, discount, tax, bold total, payment method / cash received / change, "PAID" stamp, thank-you footer). It is rendered straight into `<body>` by `components/shared/printReceipt.jsx`, which fixes the blank print preview (the old hidden receipt was clipped by the page layout).
- Print buttons: cart (bill estimate), every order card (bill / receipt), and after payment ("Print receipt").
- **Discount at checkout:** the Collect-payment dialog has an "Add discount" section — percentage or flat ৳ amount, with live totals. Cashiers are capped at 20 % of the subtotal, admins up to 100 % (enforced on the server in `applyPaymentDiscount`, `services/orderService.js`). The order's bill is recomputed and saved together with the payment. API: `POST /api/payment/cash` and `/api/payment/create-order` accept an optional `discount: { type: "percent" | "amount", value }`.

## Smooth navigation, scrolling & simpler numbers

- Page changes are a short cross-fade only (no sliding); the loading spinner no longer flashes between pages and all main pages are prefetched after sign-in.
- The bottom nav now lives once in `App.jsx` instead of inside every page, so it no longer disappears/reappears on navigation.
- Scroll areas reserve their scrollbar lane (`scrollbar-gutter: stable`) so content never jumps sideways; smooth scrolling enabled.
- Header / bottom nav no longer use heavy backdrop blur; the slow Ken Burns zoom on the Home hero was removed.
- Numbers (prices, totals, clock, counts, table numbers) use the new `font-num` class: Inter, lining + tabular figures.

## Light mode, menu refinement & "view menu"

**Theme**
- New sun/moon toggle in the header switches between dark and light mode. The choice is saved (`localStorage`) and applied before first paint, so there is no flash on reload.
- Colours are now theme tokens (`ink`, `page`, `surface`, `tint`, `accent` … in `tailwind.config.js`, values in `index.css`). Use these instead of hard-coded hex values in new code.
- The photo hero on Home and the login screen are pinned to the dark palette (`data-theme="dark"`).

**Menu**
- `/menu` is now two modes: the order builder (a table is chosen) or a read-only **Our menu** (no cart) when nobody is ordering. It no longer redirects to Tables.
- New **Menu** tab in the bottom nav (plus a Profile tab), and a "View menu" shortcut on Home.
- Refined dish browser: "All dishes" grouped by category, search by dish or category, Veg / Non-veg / Drinks filter, sort (name, price), "Available only", result count and reset, category colour edge on cards, "Only N left" / "Out of stock" from the stock field (quantity is capped at stock).

**Fixes carried in this checkpoint**
- Modals render in a portal (no more flicker / duplicate payment popup); Tables button in the bottom nav no longer drifts.

## One consistent order flow (table-first)

**Flow**
- Tables is now the single starting point: tap a free table → "Seat guests" sheet (guests only; default 2, type or tap) → Menu with the table locked → Place order → back to Tables.
- The floating bottom-nav button is now a plain shortcut to Tables. The old "Create New Order" popup, the duplicate **More** menu (Profile stays in the header) and the separate **Suggested** page are gone; `/suggested` redirects Home.
- Name and phone are optional for dine-in (server stores "Guest"); a phone number is only validated if entered.
- A big party needs `1 + ceil((guests − seats of the tapped table) / 4)` tables — a 5-guest party no longer demands two tables when it fits a 6-seater.
- **Paying closes the order**: card and cash payments mark the order paid, complete it and free its table(s) in one transaction. "Completed" can no longer be set from a dropdown without payment (the server refuses).
- Orders page / dashboard: status dropdown is forward-only (pending → in process); the Pay button is now "Pay & close".

**Quick wins**
- `/menu` is guarded: with no order in progress it redirects to Tables (instead of showing "Customer Name / Table N/A").
- The order being built (cart, customer, table, discount) is kept in `sessionStorage`, so a refresh no longer loses it. Logout / session expiry clears it.
- No more silent cart wipes: a **Resume order** chip appears above the bottom nav whenever an order is in progress, with a discard button.
- **Cash payment** is now available (with optional "cash received → change" helper) next to the demo card flow; the dashboard's "Record cash" also frees the table.
- Wording: "Tap to book / Start from + order" → "Tap to seat guests".
- Discounts: cashiers are capped at 20% (UI + server); admins can give up to 100%.

**Medium effort**
- **Add dishes to an existing order** (`PATCH /api/order/:id/items`): same dish at the same price merges into one line, the order keeps its discount, totals are recomputed on the server, and the order goes back to "pending" so the kitchen sees the new dishes.
- **Cancel / void an order** (`POST /api/order/:id/cancel`, reason required, unpaid only, admin/cashier). New `cancelled` status; cancelled orders are excluded from sales, counts and popular dishes, and free their tables.
- **Occupied tables are tappable**: a panel shows the dishes, running bill and status, with Add dishes / Pay & close / Cancel. Each table card shows its running total.
- Large parties: extra tables are now claimed in the same transaction as the order (`extraTables` in `POST /api/order`), so any cashier can seat a big group — previously the client called the admin-only merge route and failed with 403 for cashiers.
- **Phone-friendly Menu**: a sticky "View order · 3 items · ৳540" bar opens the cart as a bottom sheet; categories are one scrollable row of chips (they used to take up to 196px of height); a 🔥 **Popular** chip replaces the Suggested page.

**Under the hood**
- New `backend/services/orderService.js` (bill maths, table release, `settleOrderPayment`) shared by the order and payment controllers.
- `GET /api/table` now returns the current order's items, bills and payment so the table panel needs no extra request.
- Models: `customerDetails.phone` optional, `orderStatus` gains `cancelled`, new `cancelReason / cancelledAt / cancelledBy`.

## Premium redesign — Checkpoint 4: Menu page
- Header with "Order builder" label, serif title and customer/table pill.
- Category tiles with gradient sheen and gold selection ring; pill search; gold divider.
- Dish cards: glass surface, serif gold price, pill quantity stepper, round add-to-cart with success tick.
- Order panel: "Current order" header, rounded cart lines, nicer empty state, serif gold total, gold Place Order button.
- Cart, discount, tax, printing and availability-toggle logic unchanged.

## Premium redesign — Checkpoint 3: Tables page
- New header with "Floor plan" label, animated filter tabs (All / Available / Booked) with live counts, pill-style Merge button.
- Occupancy panel: percentage in gold, animated progress bar, available/booked counts.
- Table cards rebuilt: glass surface, status glow, seat count, pulsing booked indicator, guest chip, hover lift in ordering/merge modes.
- Ordering-flow and merge banners restyled; selected tables get a gold outline with Primary/Added tag.
- Merged-tables strip and empty/loading states restyled. Table selection, merge and release logic unchanged.

## Premium redesign — Checkpoint 2: Orders page
- New page header: serif title, live-board eyebrow, order-count pill, pill-shaped search (name, phone, table, #id).
- Status filter is now an animated segmented control with colour dots and live counts.
- Order cards rebuilt: status colour strip, avatar, table chip (incl. merged tables), status pill + selector, serif total, paid/unpaid badge and a gold Pay button.
- Responsive auto-fill card grid, richer empty state, matching skeletons.
- Back button restyled (shared). Status updates, payments and filtering logic unchanged.

## Premium redesign — Checkpoint 1: Home page
- New hero banner (photo, gradient, "service live" badge, live 12h clock, quick actions: Seat a table / View orders / Browse menu).
- 4 stat cards: Total earning, Today's orders, Open orders, Avg. bill (count-up, trend chips, accent glows).
- Glass-card surfaces, gold accents and Playfair Display headings; ambient background.
- Revenue chart with gradient bars, grid lines and a highlighted "today" bar.
- Today's orders: avatar tiles, table chip, status pills, friendly empty state.
- Popular dishes: medal ranks, dish photo, relative-popularity bar.
- Responsive grid (stacks on small screens) and staggered entrance animation.
- Data logic, API calls and other pages untouched.
- Next checkpoints: 2 Orders · 3 Tables · 4 Menu · 5 Dashboard · 6 Profile/Suggested/404 · 7 Header & bottom nav.

## UI / UX
- Redesigned **Login / Sign-up**: ticket-style card, animated hero with live floor plan, floating labels, show/hide password, caps-lock warning, password-strength meter, role cards, inline errors (no more toast-only feedback), server status chip.
- Header: stable avatar colours, sign-out confirmation, active state on the dashboard button.
- Bottom nav: animated active pill, labelled tabs, validated "New order" dialog (digits-only phone, inline errors, Enter to submit).
- Menu: dish search across all categories, per-dish quantity stepper with **one-tap add**, veg / non-veg markers, readable cart (was 8 px text), quantity +/- and "Clear" in the cart, repeated dishes merge into one line.
- Orders: search box and per-status counts; cards animate in.
- Tables: hover/tap animation; "Cancel order" button while picking tables.
- Home: count-up stat cards, animated revenue chart with week total, skeleton loaders everywhere.
- Styled 404 page; toasts moved top-right so they no longer cover the nav; Escape closes every dialog; focus rings and reduced-motion support.

## Performance
- Dish / hero images compressed (≈8.7 MB → <1 MB; one photo alone was 5.5 MB for a 50 px thumbnail).
- Route-level code splitting + long-lived vendor chunks; fonts loaded without blocking render.
- Login screen paints instantly instead of waiting for the server; the server is woken in the background while the user types.
- Live screens request only the last ~8 days of orders (+ anything still open); "popular dishes" are computed in MongoDB instead of in the browser.
- API: gzip compression, `.lean()` queries, batched menu lookup when placing an order, DB indexes, no redundant user query.
- React: memoised cards, per-dish state, no per-second re-renders outside the clock.

## Bugs fixed
**Frontend**
1. Selecting the first table in a multi-table (large party) order jumped straight to the menu — the click ran twice (card + parent).
2. Orders / Tables error toasts fired during render (repeated on every re-render).
3. Avatar colours re-rolled randomly on every refresh of the order list.
4. Open orders from a previous day vanished from Orders / Home, leaving their table stuck "booked" with no way to complete it.
5. Merged orders were double-counted in popular dishes, "unpaid orders", active orders and averages.
6. "Add table" never refreshed the tables list (old React Query v3/v4 `invalidateQueries([...])` syntax).
7. Admin check on the header was case-sensitive (`admin` ≠ `Admin`).
8. A new order could inherit the previous order's table / leftover cart; cart & cached data survived sign-out.
9. Session expiry mid-shift now returns the user to login instead of showing errors everywhere; `/dashboard` is blocked for non-admins.
10. Home "View all" did a full page reload; the Profile page showed restaurant-wide counts instead of the user's own.
11. Redux devtools were enabled in production (wrong env variable).

**Backend**
1. Login rate-limit used the proxy's IP, so on Render **all users shared one limit of 5 logins / 15 min**; successful logins also counted. Now `trust proxy` is on and only failed attempts count.
2. Auth cookie could not be cleared cross-site (logout ignored `SameSite=None; Secure`) and logout failed with an expired token. Cookie flags are now derived from the request.
3. CORS origins with a trailing slash never matched.
4. Completing an order left extra / merged tables booked or hidden until an admin released them by hand — they are now freed with the order.
5. Aborting a transaction after it committed threw and hid the real error (orders + table merge).
6. Mongoose validation errors returned 500 instead of 400; 5xx messages no longer leak in production.
7. Sign-up: password length, role and email validated; emails are case-insensitive.
8. Optional `ADMIN_SIGNUP_CODE` closes the open "anyone can register as Admin" hole.
9. Removed unused/deprecated dependencies (`crypto` shim, standalone `mongodb`, unused frontend `cors`, `@babel/preset-react`).

## Known limitations (unchanged by design)
- Orders can still be marked *completed* without being paid.
- Payment is a demo flow — plug in a real gateway before going live.
- Merging two orders is one-way (no bill splitting back).
