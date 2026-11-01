import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '14X_ovUGckP1TJgoGaeIKe3AB-wiEq00HCqNOZ-Q_fGI';
const KEY_FILE = path.resolve(__dirname, "..", process.env.GOOGLE_KEY_FILE || "credentials.json");
const RAW_SHEET = "Raw Entries";
const MORTGAGE_SHEET = "MP";
const PROPERTY_TAX_SHEET = "PP";
const UTILITIES_SHEET = "UP";
const HOME_EXPENSES_SHEET = "HP";
const GROCERIES_SHEET = "GP";
const RENO_SHEET = "R+IP";
const OTHER_SHEET = "OP";

const CATEGORY_SHEETS = {
  Mortgage: MORTGAGE_SHEET,
  "Property Tax": PROPERTY_TAX_SHEET,
  Utilities: UTILITIES_SHEET,
  "Home Expenses": HOME_EXPENSES_SHEET,
  Groceries: GROCERIES_SHEET,
  "Reno+Insu": RENO_SHEET,
};

function getAuth() {
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    return new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  return new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, "..", process.env.GOOGLE_KEY_FILE || "credentials.json"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export function canonicalizeCategory(category) {
  const value = String(category ?? "").trim();
  if (!value) return "";

  const normalized = value.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  const map = {
    "property tax": "Property Tax",
    "property-tax": "Property Tax",
    "home expenses": "Home Expenses",
    "home expense": "Home Expenses",
    "home_expenses": "Home Expenses",
    "home expense": "Home Expenses",
    "groceries": "Groceries",
    "reno insu": "Reno+Insu",
    "reno+insu": "Reno+Insu",
    "reno": "Reno+Insu",
    "utility": "Utilities",
    "utilities": "Utilities",
    "mortgage": "Mortgage",
  };

  return map[normalized.toLowerCase()] || normalized;
}

function buildRow(category, { type, person, amount, timestamp, monthKey, note }) {
  const numericAmount = parseFloat(amount).toFixed(2);
  if (category === "Utilities" || category === "Reno+Insu") {
    return [category, type || "", person, numericAmount, timestamp, monthKey, note || ""];
  }
  return [category, person, numericAmount, timestamp, monthKey, note || ""];
}

export async function appendContribution({ person, category, type, amount, note, timestamp, monthKey }) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const now = new Date();
  const ts = timestamp || now.toISOString();
  const mk = monthKey || ts.slice(0, 7);
  const normalizedCategory = canonicalizeCategory(category);
  const targetSheet = CATEGORY_SHEETS[normalizedCategory] || OTHER_SHEET;
  const range = normalizedCategory === "Utilities" || normalizedCategory === "Reno+Insu" ? "A:G" : "A:F";
  const row = buildRow(normalizedCategory, {
    type,
    person,
    amount,
    timestamp: ts,
    monthKey: mk,
    note,
  });

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${targetSheet}!${range}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });

  return response.data;
}

const PEOPLE = ["Chethana", "Saumya"];

// Categories that have a sub-type column (sheet layout: Category, Type, Person, Amount, ...)
export const CATEGORY_TYPES = {
  Utilities: ["Water", "Electricity", "Gas", "Internet", "Safety", "MISC"],
  "Reno+Insu": ["Insurance", "Renovations"],
};

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T/;

// Turns whatever Google Sheets hands back for a month cell into "YYYY-MM".
// "2026-10" typed with USER_ENTERED is stored by Sheets as the date 2026-10-01,
// so the cell may come back as a serial number, "10/1/2026" or "2026-10-01".
export function toMonthKey(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86400000);
    return d.toISOString().slice(0, 7);
  }
  const s = String(value).trim();
  let m = s.match(/^(\d{4})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}`;
  m = s.match(/^(\d{1,2})\/\d{1,2}\/(\d{4})/);
  if (m) return `${m[2]}-${m[1].padStart(2, "0")}`;
  return null;
}

// The month column and the entry-timestamp column sit side by side (and the sheet headers
// and the code have them in opposite orders), so look at both and ignore the ISO timestamp.
function rowMonth(row, columns) {
  for (const i of columns) {
    const v = row[i];
    if (typeof v === "string" && ISO_TIMESTAMP.test(v.trim())) continue;
    const key = toMonthKey(v);
    if (key) return key;
  }
  return null;
}

function toPeople(totals) {
  return PEOPLE.map((person) => ({
    person,
    paid: (totals[person] || 0) > 0,
    amount: Math.round((totals[person] || 0) * 100) / 100,
  }));
}

// Pure function: rows of one category sheet -> summary for one month.
export function summarizeRows(category, rows, monthKey) {
  const typed = !!CATEGORY_TYPES[category];
  const monthColumns = typed ? [4, 5] : [3, 4];
  const personCol = typed ? 2 : 1;
  const amountCol = typed ? 3 : 2;

  const totals = {};
  const byType = {};

  for (const row of rows) {
    if (!row || row.length === 0) continue;
    if (canonicalizeCategory(row[0]) !== category) continue; // skips header + blank rows
    if (rowMonth(row, monthColumns) !== monthKey) continue;

    const person = String(row[personCol] ?? "").trim();
    const amount = Number(String(row[amountCol] ?? "").replace(/[$,]/g, ""));
    if (!PEOPLE.includes(person) || Number.isNaN(amount)) continue;

    totals[person] = (totals[person] || 0) + amount;
    if (typed) {
      const type = String(row[1] ?? "").trim() || "Other";
      byType[type] = byType[type] || {};
      byType[type][person] = (byType[type][person] || 0) + amount;
    }
  }

  const result = { category, people: toPeople(totals) };

  if (typed) {
    const known = CATEGORY_TYPES[category];
    const extra = Object.keys(byType).filter((t) => !known.includes(t));
    result.items = [...known, ...extra].map((type) => ({
      type,
      people: toPeople(byType[type] || {}),
    }));
  }

  return result;
}

export async function getContributionSummary({ monthKey } = {}) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const month = monthKey || new Date().toISOString().slice(0, 7);

  const summary = await Promise.all(
    Object.entries(CATEGORY_SHEETS).map(async ([category, sheetName]) => {
      let rows = [];
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!A:G`,
          valueRenderOption: "UNFORMATTED_VALUE",
        });
        rows = response.data.values || [];
      } catch (err) {
        // A missing tab (e.g. no "HP" sheet yet) must not break the whole summary
        console.warn(`Summary: could not read sheet "${sheetName}": ${err.message}`);
      }
      return summarizeRows(category, rows, month);
    })
  );

  return { monthKey: month, summary };
}
