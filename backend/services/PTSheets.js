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
const RENO_SHEET = "R+IP";
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

export async function appendContribution({ person, category, type, amount, note, timestamp, monthKey }) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const now = new Date();
  const ts = timestamp || now.toISOString();
  const mk = monthKey || ts.slice(0, 7); // "2026-04"
  let row;
  let targetSheet = OTHER_SHEET;
  let range = "A:F";

  if (category === "Mortgage") {
    targetSheet = MORTGAGE_SHEET;
  } else if (category === "Property Tax") {
    targetSheet = PROPERTY_TAX_SHEET;
  } else if (category === "Utilities") {
    targetSheet = UTILITIES_SHEET;
    // UP sheet expects an extra column (Type) as 2nd column
    row = [category, type || "", person, parseFloat(amount).toFixed(2), ts, mk, note || ""];
    range = "A:G";
  } else if (category === "Reno+Insu") {
    targetSheet = RENO_SHEET;
    // R+IP sheet mirrors UP: extra Type column as 2nd column
    row = [category, type || "", person, parseFloat(amount).toFixed(2), ts, mk, note || ""];
    range = "A:G";
  } else {
    targetSheet = OTHER_SHEET;
  }

  // Non-utilities default row format (A-F)
  if (!row) {
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
