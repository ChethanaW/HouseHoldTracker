import { Router } from "express";
import { appendContribution } from "../services/PTSheets.js";

const router = Router();

// POST /api/contributions
router.post("/", async (req, res) => {
  const { person, category, amount, note, timestamp, monthKey, utilityType } = req.body;

  // Validate required fields
  if (!person || !category || amount === undefined || amount === null || amount === "") {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["person", "category", "amount"],
    });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  const validPeople = ["Chethana", "Saumya"];
  if (!validPeople.includes(person)) {
    return res.status(400).json({ error: `person must be one of: ${validPeople.join(", ")}` });
  }

  const validCategories = ["Mortgage", "Property Tax", "Utilities"];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${validCategories.join(", ")}` });
  }

  if (category === "Utilities") {
    const validUtilityTypes = ["Water", "Electricity", "Gas"];
    if (!utilityType || !validUtilityTypes.includes(utilityType)) {
      return res.status(400).json({ error: `utilityType must be one of: ${validUtilityTypes.join(", ")}` });
    }
  }

  try {
    const result = await appendContribution({ person, category, utilityType, amount: parsedAmount, note, timestamp, monthKey });
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

export default router;
