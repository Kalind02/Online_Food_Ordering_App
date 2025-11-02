// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

dotenv.config();

const app = express();

// --- CORS ---
import cors from "cors";

const MAIN_ORIGIN = process.env.FRONTEND_ORIGIN?.replace(/\/+$/, ""); // no trailing slash
const allowedFixed = [MAIN_ORIGIN, "http://localhost:3000"].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // curl/Postman/server-to-server
  if (allowedFixed.includes(origin)) return true;

  // ✅ Allow any Vercel preview (optional; tighten if you have a custom domain)
  try {
    const u = new URL(origin);
    if (u.protocol === "https:" && u.hostname.endsWith(".vercel.app")) return true;
  } catch {}
  return false;
};

const corsOptions = {
  origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
  credentials: false, // set to true ONLY if you actually use cookies/sessions
  optionsSuccessStatus: 204, // safe for legacy browsers
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));


// --- Parsers ---
app.use(express.json());

// --- Health + root ---
app.get("/", (_req, res) => res.send("🍔 Online Food Ordering System API is running."));
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, time: new Date().toISOString() });
});

// --- Connect DB before routes ---
await connectDB();

// --- Routes (note the /api prefix) ---
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/contact", contactRoutes);

// --- Start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
