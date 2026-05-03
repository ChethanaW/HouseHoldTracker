import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '14X_ovUGckP1TJgoGaeIKe3AB-wiEq00HCqNOZ-Q_fGI';
const KEY_FILE = path.resolve(__dirname, "..", process.env.GOOGLE_KEY_FILE || "credentials.json");
var RAW_SHEET = "Raw Entries";
const MORTGAGE_SHEET = "MP";
const PROPERTY_TAX_SHEET = "PP";
const UTILITIES_SHEET = "UP";  
const OTHER_SHEET = "OP";

function getAuth() {
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    return new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  return new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, "..", process.env.GOOGLE_KEY_FILE),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function appendContribution({ person, category, amount, note, timestamp, monthKey }) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const now = new Date();
  const ts = timestamp || now.toISOString();
  const mk = monthKey || ts.slice(0, 7); // "2026-04"

  const row = [
    category,
    person,
    parseFloat(amount).toFixed(2),
    ts,
    mk,
    note || "",
  ];

  if (category === "Mortgage") {
    RAW_SHEET = MORTGAGE_SHEET;
  } else if (category === "Property Tax") {
    RAW_SHEET = PROPERTY_TAX_SHEET;
  } else if (category === "Utilities") {
    RAW_SHEET = UTILITIES_SHEET;
  } else {
    RAW_SHEET = OTHER_SHEET;
  }

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${RAW_SHEET}!A:F`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });

  return response.data;
}
