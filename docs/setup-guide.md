# Local Setup & Installation Guide

> **This guide provides step-by-step instructions for setting up and running the Veno-Pump Clinical Monitoring Platform locally.**

---

## 1. Prerequisites

Ensure you have the following software installed on your machine:

- **Python:** Version `3.11` or newer (`python --version` / `python3 --version`)
- **Node.js:** Version `18.x` or newer (`node -v`, Node 20+ recommended)
- **npm:** Included with Node.js (`npm -v`)
- **Git:** Installed and available in your terminal (`git --version`)
- **(Optional) IBM watsonx.ai Account:** Required only if testing live cloud AI inference. The application includes a built-in deterministic fallback engine that runs completely offline without any API keys.

---

## 2. Repository Structure Overview

```
bob-ai-hackathon-NEXORA/
├── src/
│   ├── backend/           # FastAPI backend with SQLite database
│   │   ├── requirements.txt
│   │   ├── seed.py
│   │   ├── main.py
│   │   └── ...
│   ├── frontend/          # Vite + React + TypeScript UI
│   │   ├── package.json
│   │   └── ...
│   └── .env.example       # Template environment variables
└── docs/                  # Documentation
```

---

## 3. Environment Configuration

### Backend Environment (`src/backend/.env`)

Copy `src/.env.example` to `src/backend/.env`:

```bash
# From the repository root:
cp src/.env.example src/backend/.env
```

The configuration options are detailed below:

| Variable | Description | Default / Example Value | Required |
|---|---|---|---|
| `WATSONX_API_KEY` | IBM watsonx.ai API Key | `your_api_key_here` | Optional (falls back to local rules) |
| `WATSONX_PROJECT_ID` | watsonx.ai Project GUID | `your_project_id_here` | Optional (falls back to local rules) |
| `WATSONX_URL` | IBM watsonx.ai Regional Endpoint | `https://eu-de.ml.cloud.ibm.com` | Optional |
| `WATSONX_MODEL_ID` | Foundation Model Identifier | `ibm/granite-4-h-small` | Optional |
| `DATABASE_URL` | SQLite database URI | `sqlite:///./venopump.db` | Yes |
| `APP_ENV` | Application environment mode | `development` | Yes |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173` | Yes |

> **Note:** If `WATSONX_API_KEY` is left as placeholder or empty, the platform automatically activates the deterministic clinical rule engine, allowing full offline testing without API credentials.

---

## 4. Backend Setup & Data Seeding

Open a terminal and navigate to `src/backend`:

```bash
# 1. Navigate to backend directory
cd src/backend

# 2. Create Python virtual environment
# Windows (PowerShell / Command Prompt):
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux:
python3 -m venv .venv
source .venv/bin/activate

# 3. Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 4. Initialize database and seed synthetic demo data
python seed.py

# 5. Start the FastAPI backend server
uvicorn main:app --reload --port 8000
```

The backend server is now running at `http://localhost:8000`.

### Verifying the Backend
- **Health Check:** Open `http://localhost:8000/api/v1/health` in your browser. Expected response:
  ```json
  {
    "status": "ok",
    "app": "Veno-Pump Clinical Monitoring API",
    "note": "⚠ All data is synthetic/simulated. Prototype only."
  }
  ```
- **Interactive Swagger Documentation:** Open `http://localhost:8000/docs` to explore all interactive endpoints.

---

## 5. Frontend Setup

Open a **second terminal** and navigate to `src/frontend`:

```bash
# 1. Navigate to frontend directory
cd src/frontend

# 2. Install Node dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

The development server will start at `http://localhost:5173`.

---

## 6. Accessing the Application

Open your browser and navigate to:
```
http://localhost:5173
```

Available application routes:
- `/` — Landing page with project overview and architecture links
- `/dashboard` — Clinician cohort monitoring overview
- `/patients` — Patient directory and risk filtering
- `/patients/P-004` — Longitudinal patient profile, outcome charts, and AI clinical insights
- `/patients/P-004/session` — Rehabilitation session simulator and live risk recalculation
- `/assistant` — Clinician AI Assistant for interactive cohort queries

---

## 7. Running Backend Automated Tests

To run the backend test suite:

```bash
cd src/backend
# Activate virtual environment if not already active
pytest -v
```

---

## 8. Troubleshooting

| Issue / Symptom | Possible Cause | Solution |
|---|---|---|
| `ModuleNotFoundError: No module named 'fastapi'` | Virtual environment not activated or packages not installed | Run `.venv\Scripts\activate` (Windows) or `source .venv/bin/activate` (Linux/macOS), then `pip install -r requirements.txt`. |
| `OperationalError: no such table: patient` | Database not seeded | Run `python seed.py` from within `src/backend/` to create tables and load demo patients. |
| `Port 8000 already in use` | Another process is occupying port 8000 | Specify a different port or kill the existing process: `uvicorn main:app --reload --port 8001`. Update frontend proxy if changed. |
| Frontend displays `API Connection Error` | Backend server is not running | Ensure FastAPI is running on `http://localhost:8000` in your first terminal. |
| AI endpoints return `Demo AI Insight — watsonx.ai not configured` | watsonx.ai credentials not configured | This is expected fallback behavior when no API key is provided. The system continues working normally using deterministic clinical rules. |
| Vite build or package installation errors | Incompatible Node.js version | Verify Node.js version using `node -v` (v18.x or v20.x recommended). Run `npm cache clean --force` and re-run `npm install`. |
