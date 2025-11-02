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
// Set this on Render: FRONTEND_ORIGIN=https://<your-vercel-app>.vercel.app
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN, // single frontend origin
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false, // set to true ONLY if you actually use cookies
}));
// Ensure preflight never 404s
app.options("*", cors());

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
