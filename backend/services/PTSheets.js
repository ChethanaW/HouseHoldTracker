import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '14X_ovUGckP1TJgoGaeIKe3AB-wiEq00HCqNOZ-Q_fGI';
const KEY_FILE = path.resolve(__dirname, "..", process.env.GOOGLE_KEY_FILE || "credentials.json");
var RAW_SHEET = "Raw Entries";
const HHG_SHEET = "HHG";
const PG = "PG";
const UTILITIES_SHEET = "UP";
const RENO_SHEET = "R";
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

function resolveTargetSheet(category) {
  if (category === "HH Groceries") return HHG_SHEET;
  if (category === "P Groceries") return PG;
  if (category === "Utilities") return UTILITIES_SHEET;
  if (category === "Renovations") return RENO_SHEET;
  return OTHER_SHEET;
}

export async function appendContribution({ person, category, type, amount, note, timestamp, monthKey }) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const now = new Date();
  const ts = timestamp || now.toISOString();
  const mk = monthKey || ts.slice(0, 7); // "2026-04"
  let row;
  const targetSheet = resolveTargetSheet(category);
  let range = "A:F";

  if (category === "Utilities") {
    row = [category, type || "", person, parseFloat(amount).toFixed(2), ts, mk, note || ""];
    range = "A:G";
  } else if (category === "Renovations") {
    row = [category, type || "", person, parseFloat(amount).toFixed(2), ts, mk, note || ""];
    range = "A:G";
  } else if (category === "HH Groceries" || category === "P Groceries") {
    row = [category, person, parseFloat(amount).toFixed(2), ts, mk, note || ""];
  } else {
    row = [category, person, parseFloat(amount).toFixed(2), ts, mk, note || ""];
  }

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${targetSheet}!${range}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });

  return response.data;
}
