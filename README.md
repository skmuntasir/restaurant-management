# Restaurant POS System

A full-stack Point of Sale (POS) system for restaurant management, built with React 19 and Node.js.

## Features

- 🔐 User authentication with JWT (role-based: admin / cashier)
- ✅ Admin-approved sign-ups — new staff accounts wait as pending until an admin approves or rejects them (Dashboard → Team)
- 🍽️ Menu management — categories and items with a default Bengali menu auto-seeded
- 🪑 Table management — visual table status tracking (available / occupied)
- 📋 Order management — create, update, and track orders in real time
- 💳 Payment processing — cash and (demo) card; paying closes the order and frees the table
- 📊 Dashboard with order and revenue overview

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Redux Toolkit, React Query, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express 5, MongoDB, Mongoose |
| Auth | JWT + HTTP-only cookies |

## Project Structure

```
restaurant-pos/
├── frontend/     # React + Vite app
└── backend/      # Express API server
```

## The one order flow

Everything starts at **Tables** — there is a single path for every order:

1. **Tap a free table** → a small sheet asks only for the number of guests (name and phone are optional).
2. **Menu** opens with the table already locked. Add dishes and press **Place order**.
3. You land back on **Tables**, where the occupied table shows its running total.
4. **Tap the occupied table** → see the bill, **Add dishes** (a second round), **Pay & close** (Cash or Card) or **Cancel** the order.

Paying closes the order and frees the table in one step. If you leave an order half-built, a **Resume order** chip stays above the bottom nav, and the order survives a page refresh.

## What's new in this version

- **One table-first order flow** (see above): no more popup + separate pages, optional name/phone, large parties are seated atomically (any cashier can do it), Pay closes the table, add-dishes-to-an-order, cancel with a reason, a Cash payment option with change calculator, and a phone-friendly Menu (category chips, Popular chip, bottom-sheet cart). Cashiers can give up to 20% off; admins can go higher. Details in `CHANGELOG.md`.
- **New login / sign-up screen** — "kitchen ticket" design with a live floor-plan hero, inline validation, password strength meter, caps-lock warning and a server-status indicator.
- **Much faster** — images cut from ~8.7 MB to <1 MB, the app is code-split per page, the login screen no longer waits on the server before showing, the API compresses responses and no longer downloads every order ever placed on the live screens.
- **More interactive** — animated page transitions, skeleton loaders, count-up stats, animated chart, menu search, quantity steppers in the cart, order search + status counts, sign-out confirmation, Esc-to-close dialogs.
- **Bug fixes** — see `CHANGELOG.md`.

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works). A local MongoDB must run as a **replica set** — orders use transactions, which a standalone `mongod` doesn't support.

### 1. Backend setup

```bash
cd backend
npm install

# Copy the example env and fill in your values
cp .env.example .env
```

Edit `backend/.env`:
```
PORT=8000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/restaurant_db?retryWrites=true&w=majority
JWT_SECRET=<generate a long random string>
CORS_ORIGIN=               # leave blank for local dev
```

```bash
npm run dev      # starts on http://localhost:8000
```

### 2. Frontend setup

```bash
cd frontend
npm install

cp .env.example .env
# .env already set to http://localhost:8000 for local dev
```

```bash
npm run dev      # starts on http://localhost:5173
```

## Deployment

### Backend → Render (free)
1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo, set root directory to `backend/`
3. Build command: `npm install` · Start command: `node app.js`
4. Add environment variables in Render's dashboard (copy from `.env.example`)
5. Set `CORS_ORIGIN` to your Vercel frontend URL

### Frontend → Vercel (free)
1. Import the repo on [vercel.com](https://vercel.com)
2. Set root directory to `frontend/`
3. Add environment variable: `VITE_BACKEND_URL=https://your-backend.onrender.com`

## Screenshots

> Add screenshots here after deploying — they make a huge difference on GitHub and your CV.

## License

MIT
