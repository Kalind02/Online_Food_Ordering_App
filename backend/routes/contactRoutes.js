// routes/contactRoutes.js
import express from "express";
import Contact from "../models/Contact.js";

const router = express.Router();

/**
 * POST /api/contact
 * Save a contact message
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const doc = await Contact.create({ name, email, message });
    return res
      .status(201)
      .json({ message: "Message received. We'll get back to you soon!", contactId: doc._id });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
