const express = require("express");
const connectDB = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { seedTables } = require("./controllers/tableController");
const { seedMenu } = require("./controllers/categoryController");

const app = express();
const PORT = config.port;

// Connect to DB then auto-seed tables + the default Bengali menu
connectDB().then(() => {
  seedTables();
  seedMenu();
});

// Allow origins from env (comma-separated) + local dev origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  ...(process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : []),
];

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "Hello from POS Server!", status: "ok" });
});

app.use("/api/user", require("./routes/userRoute"));
app.use("/api/order", require("./routes/orderRoute"));
app.use("/api/table", require("./routes/tableRoute"));
app.use("/api/payment", require("./routes/paymentRoute"));
app.use("/api/category", require("./routes/categoryRoute"));
app.use("/api/menu-item", require("./routes/menuItemRoute"));

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`☑️  POS Server is listening on port ${PORT}`);
});
