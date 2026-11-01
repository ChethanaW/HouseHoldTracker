import { Router } from "express";
import { appendContribution, getContributionSummary } from "../services/PTSheets.js";

const router = Router();

const VALID_CATEGORIES = ["Mortgage", "Property Tax", "Utilities", "Home Expenses", "Groceries", "Reno+Insu"];
const VALID_UTILITY_TYPES = ["Water", "Electricity", "Gas", "Internet", "Safety", "MISC"];
const VALID_RENO_TYPES = ["Insurance", "Renovations"];

// POST /api/contributions
router.post("/", async (req, res) => {
  const { person, category, amount, note, timestamp, monthKey, type } = req.body;

    // Validate required fields
  if (!person || !category || amount === undefined || amount === null || amount === "") {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["person", "category", "amount"],
    });
  }

  const parsedAmount = parseFloat(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  const validPeople = ["Chethana", "Saumya"];
  if (!validPeople.includes(person)) {
    return res.status(400).json({ error: `person must be one of: ${validPeople.join(", ")}` });
  }

  const normalizedCategory = String(category).trim();
  if (!VALID_CATEGORIES.includes(normalizedCategory)) {
    return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` });
  }

  if (normalizedCategory === "Utilities") {
    if (!type || !VALID_UTILITY_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${VALID_UTILITY_TYPES.join(", ")}` });
    }
  }

  if (normalizedCategory === "Reno+Insu") {
    if (!type || !VALID_RENO_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${VALID_RENO_TYPES.join(", ")}` });
    }
  }

  try {
    const result = await appendContribution({ person, category: normalizedCategory, type, amount: parsedAmount, note, timestamp, monthKey });
    return res.status(201).json({
      success: true,
      message: "Entry logged to Google Sheet",
      updatedRange: result.updates?.updatedRange,
    });
  } catch (err) {
    console.error("Sheets API error:", err.message);

        // Helpful error messages for common issues
    if (err.message.includes("invalid_grant") || err.message.includes("credentials")) {
      return res.status(500).json({ error: "Google credentials issue — check credentials.json and .env" });
    }
    if (err.message.includes("not found") || err.message.includes("spreadsheetId")) {
      return res.status(500).json({ error: "Spreadsheet not found — check SPREADSHEET_ID in .env" });
    }

    return res.status(500).json({ error: "Failed to write to Google Sheet" });
  }
});

router.get("/summary", async (req, res) => {
  const { monthKey } = req.query;

  if (monthKey && !/^\d{4}-(0[1-9]|1[0-2])$/.test(String(monthKey))) {
    return res.status(400).json({ error: "monthKey must look like 2026-10" });
  }

  try {
    const { summary, monthKey: resolvedMonth } = await getContributionSummary({ monthKey });
    return res.json({ monthKey: resolvedMonth, summary });
  } catch (err) {
    console.error("Summary fetch error:", err.message);
    return res.status(500).json({ error: "Failed to load summary" });
  }
});

export default router;
