// config/db.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const URI = process.env.MONGODB_URI || process.env.MONGO_URI;

export default async function connectDB() {
  if (!URI) {
    console.error("❌ No Mongo URI found. Set MONGODB_URI (or MONGO_URI).");
    process.exit(1);
  }
  try {
    await mongoose.connect(URI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err?.message || err);
    process.exit(1);
  }
}
