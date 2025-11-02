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
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN?.replace(/\/+$/, ""), // strip trailing slash if someone added it
  "http://localhost:3000",                          // optional: for local dev
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // allow server-to-server/no-origin and known frontends; never throw
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // disallow silently (no CORS headers) instead of throwing 500
    return cb(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
  credentials: false, // set true ONLY if you actually use cookies/sessions
};

app.use(cors(corsOptions));
// Ensure preflight never 404s AND returns identical CORS headers
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
