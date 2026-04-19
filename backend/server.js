import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import contributionsRouter from "./routes/contributions.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// All allowed origins — add any URL that needs access
const ALLOWED_ORIGINS = [
  "https://chethanaW.github.io",
  "https://chethanaW.github.io/HouseHoldTracker",
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // Normalize: strip trailing slash before comparing
    const normalized = origin.replace(/\/$/, "");

    if (ALLOWED_ORIGINS.some(allowed => allowed.replace(/\/$/, "") === normalized)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked request from: ${origin}`);
    callback(new Error(`CORS policy blocked origin: ${origin}`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: false,
}));

// Explicitly handle preflight for all routes
app.options("*", cors());

app.use(express.json());

// Routes
app.use("/api/contributions", contributionsRouter);

// Health check — open this in browser to confirm backend is alive
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    spreadsheetId: process.env.SPREADSHEET_ID ? "configured" : "MISSING",
    allowedOrigins: ALLOWED_ORIGINS,
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`\n🏠 Household Tracker API`);
  console.log(`   Server:  http://localhost:${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   Origins: ${ALLOWED_ORIGINS.join(", ")}\n`);
});