# 🩺 Veno-Pump Clinical Monitoring & Intelligent Rehabilitation Platform

> **Clinical Decision Support & Monitoring Prototype**
> *Decision support only — clinician judgement required. AI output does not constitute a diagnosis, treatment recommendation, or prescription.*

---

## 👥 Team

| Role / Position | Name | Email |
|---|---|---|
| **Team Lead** | Krishna Mangukiya | `25it053@charusat.edu.in` |
| **Team Member** | Dhwani Patel | `22bpt022@charusat.edu.in` |
| **Team Member** | Anjali Mestry | `22bpt016@charusat.edu.in` |
| **Team Member** | Siddhi Patel | `22bpt039@charusat.edu.in` |
| **Team Name** | Veno-Pump | — |
| **Hackathon Track** | AI Track | — |

---

## 🎯 Problem Statement

Patients undergoing lower-limb venous recovery, chronic venous insufficiency management, and post-surgical rehabilitation frequently struggle with inconsistent therapy adherence and unmonitored symptom fluctuations between infrequent outpatient clinical visits. Clinicians—such as vascular specialists, physiotherapists, and rehabilitation teams—lack continuous, objective longitudinal visibility into whether patients complete prescribed therapy sessions or experience escalating symptoms such as pain, oedema/swelling, heaviness, and fatigue. Without structured digital monitoring, emerging risks and non-compliance patterns often go unnoticed until clinical complications arise.

---

## 💡 Solution

**Veno-Pump Clinical Monitoring & Intelligent Rehabilitation Platform** is a clinician-centric digital platform designed to bridge the gap between home-based rehabilitation and clinical oversight. Built to support the proposed Veno-Pump calf-sleeve rehabilitation concept, the web platform ingests simulated session metrics and longitudinal patient data to evaluate 28-day adherence rates, compute multi-symptom outcome trajectories, and automatically flag high-risk non-compliance or symptom deterioration.

By pairing deterministic clinical rule engines with **IBM watsonx.ai (IBM Granite 4 H Small)**, the platform generates grounded clinical insights, facilitates real-time interactive clinician Q&A via an AI Assistant, and compiles structured clinical summary reports for case reviews.

> **Hardware Context:** The physical Veno-Pump wearable sleeve is a future hardware integration concept. The current hackathon platform functions as the digital intelligence, data aggregation, and clinician decision support software layer using synthetic patient cohorts and simulated rehabilitation sessions.

---

## ✨ Key Features

- **Longitudinal Patient & Cohort Monitoring:** Track rehabilitation compliance across active patient cohorts with 28-day adherence percentages, completion status, and week-over-week trends.
- **Multi-Symptom Outcome Progression:** Visualise four critical recovery dimensions over time—pain, oedema/swelling, heaviness, and fatigue—using interactive time-series charts.
- **Rule-Based Clinical Risk Stratification:** Automated risk engine that continuously evaluates session completions and symptom deltas to categorize patients into Low, Moderate, or High risk with explicit alert reasons.
- **AI-Powered Clinical Insights via IBM Granite:** Grounded clinical summaries and cohort-level observations powered by **IBM watsonx.ai (IBM Granite 4 H Small)**, backed by deterministic fallback logic.
- **Interactive Clinician AI Assistant:** Context-aware assistant allowing healthcare providers to query cohort status, patient adherence trends, and risk factors with guardrailed clinical decision support.
- **One-Click Clinical Summary Reports:** Instant generation of standardized, printable clinical reports detailing patient demographics, protocol compliance, symptom trends, risk flags, and AI-assisted clinical observations.
- **Rehabilitation Session Simulator:** Interactive session completion interface allowing clinicians to test protocol executions, record discomfort levels, and observe instant risk engine recalculation.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React |
| **State & Visualization** | TanStack React Query v5, Recharts, React Router v7, Axios |
| **Backend API** | Python 3.11+, FastAPI, SQLModel (SQLAlchemy + Pydantic v2), Uvicorn |
| **Database** | SQLite (with deterministic seeder for synthetic cohorts) |
| **AI & LLM Services** | IBM watsonx.ai, IBM Granite 4 H Small (`ibm/granite-4-h-small`), `ibm-watsonx-ai` SDK |
| **Development Acceleration** | IBM Bob (AI coding assistant) |
| **Deployment & Hosting** | Vercel (Frontend), Render (Backend API), GitHub |

---

## 📁 Repository Structure

```
.
├── src/
│   ├── backend/               # FastAPI backend application
│   │   ├── main.py            # FastAPI entry point, CORS, router registrations
│   │   ├── models.py          # SQLModel database schemas and Pydantic models
│   │   ├── database.py        # Database session and environment settings
│   │   ├── risk_engine.py     # Deterministic clinical risk stratification
│   │   ├── adherence.py       # 28-day adherence and trend computation
│   │   ├── ai_service.py      # IBM watsonx.ai integration with fallback
│   │   ├── seed.py            # Deterministic synthetic data seeder
│   │   ├── requirements.txt   # Python package dependencies
│   │   └── routers/           # API route modules (patients, sessions, dashboard, ai)
│   ├── frontend/              # Vite + React + TypeScript frontend
│   │   ├── src/               # React components, pages, hooks, types
│   │   ├── package.json       # Node package dependencies & scripts
│   │   └── vite.config.ts     # Vite configuration and dev proxy
│   └── .env.example           # Example environment configuration
├── docs/                      # Technical documentation
│   ├── problem-statement.md   # Clinical domain problem analysis
│   ├── solution-overview.md   # Implemented architecture and design
│   ├── architecture.md        # Detailed system architecture and data flows
│   └── setup-guide.md         # Comprehensive local setup instructions
├── demo/                      # Demonstration links and artifacts
│   ├── live-demo-url.txt      # Production web deployment URL
│   ├── demo-video-link.txt    # Video walkthrough link
│   └── screenshots/           # Application screenshots
├── presentation/              # Slide decks and hackathon materials
└── submission.yaml            # Submission metadata for automated evaluation
```

---

## ⚡ How to Run

### Prerequisites
- **Python:** 3.11 or newer
- **Node.js:** 18.x or newer (Node 20+ recommended)
- **Git:** Installed and configured

### 1. Clone the Repository
```bash
git clone https://github.com/Krishna5455/bob-ai-hackathon-NEXORA.git
cd bob-ai-hackathon-NEXORA
```

### 2. Backend Setup
```bash
cd src/backend

# Create and activate a virtual environment
# Windows:
python -m venv .venv
.venv\Scripts\activate

# Linux / macOS:
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (optional — deterministic fallback works without keys)
cp ../.env.example .env

# Initialize and seed synthetic clinical demo data
python seed.py

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```
*The backend API will be available at `http://localhost:8000` (interactive Swagger docs at `http://localhost:8000/docs`).*

### 3. Frontend Setup (in a separate terminal)
```bash
cd src/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*The web dashboard will be available at `http://localhost:5173`.*

---

## 🖥️ Demo

| Artifact | Link / Location |
|---|---|
| 🌐 **Live Web Application** | [https://veno-pump.vercel.app/](https://veno-pump.vercel.app/) |
| 🔌 **Live Backend API** | [https://veno-pump-api.onrender.com/docs](https://veno-pump-api.onrender.com/docs) |
| 📹 **Demo Video** | [See demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🖼️ **Screenshots** | [See demo/screenshots/](demo/screenshots/) |
| 📊 **Presentation Slides** | [See presentation/](presentation/) |

---

## ⚠️ Known Limitations

- **Prototype & Synthetic Data:** This software is a hackathon proof-of-concept. All patient profiles, medical histories, and session logs are synthetic demo datasets created for clinical workflow validation.
- **Hardware Integration Status:** The physical Veno-Pump wearable compression sleeve is an external hardware concept and is **not** currently manufactured or physically connected to this web software.
- **Clinical Decision Support Boundary:** The platform provides clinical decision support to assist healthcare professionals. It is **not** a diagnostic device, does not prescribe treatments, and does not alter therapeutic protocols autonomously. Clinician judgment remains mandatory.
- **External AI Service Fallback:** If IBM watsonx.ai credentials are not supplied or network latency occurs, the system transparently utilizes a deterministic rule-based clinical engine to ensure uninterrupted decision support.

---

## 🏅 What We're Most Proud Of

We are most proud of engineering an **architecturally safe, clinician-grounded AI decision support workflow**. Rather than asking an LLM to blindly summarize raw or unstructured patient notes, our backend first executes rigorous, deterministic clinical calculations (28-day adherence rates, week-over-week deltas, and 4-point risk factor analyses). These authoritative values are then structured into strict clinical prompts for **IBM watsonx.ai (IBM Granite 4 H Small)**.

This hybrid pattern guarantees zero-hallucination metrics, strictly enforces medical disclaimers, and maintains full decision support functionality through an offline fallback engine if external cloud APIs are unreachable.
