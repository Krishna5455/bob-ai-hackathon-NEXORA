# Source Code — Veno-Pump Clinical Monitoring Platform

⚠ All patient data and device sessions are **synthetic demo data**. This is a software prototype only. The physical Veno-Pump device is a proposed concept and is not clinically validated.

## Structure

```
src/
  backend/          FastAPI + SQLModel + SQLite backend
  frontend/         Vite + React + TypeScript frontend
  .env.example      All environment variable definitions
```

## Quick Start

### Backend

```bash
cd src/backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with demo data
python seed.py

# Start the API server
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd src/frontend

# Install dependencies
npm install

# Start the dev server (requires backend running on port 8000)
npm run dev
```

App available at: http://localhost:5173

### Running Both Together

Open two terminals — one for the backend and one for the frontend.

## Environment Variables

See `src/.env.example` for all variables. For local development:

- Backend: copy to `src/backend/.env`
- Frontend: copy `VITE_*` vars to `src/frontend/.env.local`

## Re-seeding the Database

If the database is reset (e.g. after redeploy), run:

```bash
cd src/backend
python seed.py
```

All demo data is deterministic relative to today's date.

## IBM Technology

- **IBM Bob** — Used as the AI development assistant (SDLC tooling) throughout this project
- **IBM watsonx.ai** — Planned runtime AI service for the Clinician AI Assistant and AI Clinical Insights (Phase 4)
