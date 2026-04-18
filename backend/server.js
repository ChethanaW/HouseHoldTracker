import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import contributionsRouter from "./routes/contributions.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, "http://localhost:5173", "http://localhost:4173"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

// Routes
app.use("/api/contributions", contributionsRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    spreadsheetId: process.env.SPREADSHEET_ID ? "configured" : "MISSING — check .env",
  });
});

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`\n🏠 Household Tracker API`);
  console.log(`   Server: http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Sheet:  ${process.env.SPREADSHEET_ID || "⚠️  SPREADSHEET_ID not set in .env"}\n`);
});
