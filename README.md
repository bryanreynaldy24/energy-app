# Indonesia Energy Narrative Monitor — Web App

Real-time narrative intelligence dashboard connected to Google Sheets.

---

## Architecture

```
Google Sheet (2 tabs)
  └─ social_media
  └─ conventional_media
        │
        ▼  (fetched on every page load + auto-refresh every 5 min)
Backend (FastAPI / Python)
  ├─ analysis.py      ← cluster definitions LOCKED here
  ├─ pptx_generator.py
  └─ main.py
        │
        ▼
Frontend (React)
  ├─ Narrative Gap Table
  ├─ Daily Trend Chart (3 views)
  ├─ Regional Formation Cards
  └─ Download PPTX button
```

---

## Setup

### 1. Prepare your Google Sheet

1. Open your Google Sheet (must have tabs named exactly `social_media` and `conventional_media`)
2. Go to **File → Share → Publish to web**
3. Select **Entire Document** → **CSV** → Publish
4. Copy the Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/**SHEET_ID_HERE**/edit`

### 2. Deploy Backend to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the `backend/` folder as the root
4. Add environment variable:
   ```
   GOOGLE_SHEET_ID = your_sheet_id_here
   ```
5. Railway will auto-detect Python and deploy
6. Copy the generated URL (e.g. `https://your-app.up.railway.app`)

### 3. Deploy Frontend to Vercel (or Railway)

1. Create another Railway service (or use Vercel)
2. Select the `frontend/` folder as the root
3. Add environment variable:
   ```
   REACT_APP_API_URL = https://your-backend.up.railway.app
   ```
4. Build command: `npm run build`
5. Output directory: `build`

---

## Cluster Definitions (LOCKED)

Clusters are defined in `backend/analysis.py` and **never change based on data**.

| ID | Name | Character |
|---|---|---|
| A | Broken Promise | Political accountability, DPR anger |
| B | Inflation Domino | Purchasing power, staples, UMKM |
| C | Subsidy Migration | Pertalite / LPG 3kg shift |
| D | Geopolitical | Iran-Hormuz oil shock |
| F | EV / Alternatives | Energy transition signals |

To add or rename a cluster, edit `CLUSTER_DEFS` in `backend/analysis.py` — it will never change on its own.

---

## How Data Updates Work

- When your team adds rows to the Google Sheet → the next page load or auto-refresh (every 5 min) picks it up automatically
- The "Last Updated" shown in the header reflects the most recent date in the dataset
- No manual CSV export needed

---

## Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
GOOGLE_SHEET_ID=your_id uvicorn main:app --reload
# API runs at http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm install
npm start
# App runs at http://localhost:3000
```
