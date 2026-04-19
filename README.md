# 🏠 Household Tracker MVP 1

A lightweight full-stack app to log shared household expenses (mortgage, property tax, utilities) directly into a Google Sheet.

## Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Storage**: Google Sheets (via Google Sheets API)

## Project Structure

```
household-tracker/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   └── ContributionForm.jsx
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/           # Express API
│   ├── server.js
│   ├── routes/
│   │   └── contributions.js
│   ├── services/
│   │   └── sheets.js
│   ├── .env.example
│   └── package.json
└── README.md
```

## Quick Start

### 1. Google Sheet Setup

1. Create a new Google Sheet
2. Rename **Sheet1** → **Raw Entries**
3. Add headers in row 1:

   | A | B | C | D | E | F |
   |---|---|---|---|---|---|
   | Timestamp | Person | Category | Amount | Note | MonthKey |

4. Add a second tab **Monthly Summary**, paste in cell A1:
   ```
   =QUERY('Raw Entries'!A:F,"SELECT F, B, SUM(D) WHERE F IS NOT NULL GROUP BY F, B ORDER BY F DESC LABEL F 'Month', B 'Person', SUM(D) 'Total'",1)
   ```

### 2. Google Cloud Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable **Google Sheets API**
3. **IAM & Admin → Service Accounts** → Create service account
4. Create a JSON key → download → save as `backend/credentials.json`
5. Copy the service account email
6. In your Google Sheet: **Share → paste email → Editor**

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — add your SPREADSHEET_ID
npm run dev
```

Test:
```bash
curl -X POST http://localhost:3001/api/contributions \
  -H "Content-Type: application/json" \
  -d '{"person":"Me","category":"Utilities","amount":120,"note":"Hydro April"}'
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Deployment

| Service | What to deploy |
|---|---|
| [Railway](https://railway.app) or [Render](https://render.com) | Backend (add env vars in dashboard) |
| [Vercel](https://vercel.com) or [Netlify](https://netlify.com) | Frontend (set `VITE_API_URL` env var) |

## Sheet Columns

| Col | Header | Example |
|---|---|---|
| A | Timestamp | 2026-04-18T10:30:00Z |
| B | Person | Me |
| C | Category | Mortgage |
| D | Amount | 1250.00 |
| E | Note | April payment |
| F | MonthKey | 2026-04 |
