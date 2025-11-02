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
