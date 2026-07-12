# Restaurant POS System

A full-stack Point of Sale (POS) system for restaurant management, built with React 19 and Node.js.

## Features

- 🔐 User authentication with JWT (role-based: admin / waiter)
- 🍽️ Menu management — categories and items with a default Bengali menu auto-seeded
- 🪑 Table management — visual table status tracking (available / occupied)
- 📋 Order management — create, update, and track orders in real time
- 💳 Payment processing — built-in demo payment flow
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

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)

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
