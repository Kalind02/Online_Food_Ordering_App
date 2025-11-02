// routes/orderRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import Order from "../models/Order.js";

const router = express.Router();

const verifyUser = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Create order (idempotent)
router.post("/", verifyUser, async (req, res) => {
  try {
    const { items, total } = req.body;
    const clientKey = req.get("Idempotency-Key") || req.body.clientKey;

    if (!clientKey) {
      return res.status(400).json({ message: "Idempotency key is required." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }
    if (typeof total !== "number" || total < 0) {
      return res.status(400).json({ message: "Total must be a number >= 0" });
    }

    // If an order with this key already exists, return it
    const existing = await Order.findOne({ clientKey, user: req.user.id });
    if (existing) return res.status(200).json(existing);

    // Normalize incoming items
    const normalized = items.map((it) => ({
      foodItem: it.foodItem || undefined,
      name: it.name || undefined,
      price: typeof it.price === "number" ? it.price : undefined,
      quantity: it.quantity ?? it.qty ?? 1,
    }));

    const created = await Order.create({
      user: req.user.id,
      items: normalized,
      total,
      status: "Pending",
      clientKey,
    });

    return res.status(201).json(created);
  } catch (err) {
    // Handle race condition: if two requests with same key hit at once
    if (err?.code === 11000 && err?.keyPattern?.clientKey) {
      const existing = await Order.findOne({
        clientKey: req.get("Idempotency-Key") || req.body.clientKey,
        user: req.user.id,
      });
      if (existing) return res.status(200).json(existing);
    }
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// List orders for the logged-in user
router.get("/", verifyUser, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("items.foodItem", "name price image");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
