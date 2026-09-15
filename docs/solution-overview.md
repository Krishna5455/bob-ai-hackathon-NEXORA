# Solution Overview: Veno-Pump Clinical Monitoring & Intelligent Rehabilitation Platform

> **Safety Notice:** *Decision support only — clinician judgement required. AI output does not constitute a diagnosis, treatment recommendation, or prescription.*

---

## 1. Overview & Core Concept

**Veno-Pump Clinical Monitoring & Intelligent Rehabilitation Platform** is a web-based clinical decision support system designed to monitor, analyze, and optimize lower-limb venous rehabilitation protocols.

The software serves as the digital intelligence layer for the proposed Veno-Pump concept—bridging patient home therapy sessions and clinical oversight through automated longitudinal compliance tracking, symptom trajectory analysis, risk stratification, and AI-generated clinical insights.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   IMPLEMENTED SOFTWARE PLATFORM                        │
│                                                                        │
│  [ Synthetic / Simulated Data ]                                        │
│          ↓                                                             │
│  [ FastAPI + SQLite Engine ] ──→ [ Risk & Adherence Calculators ]      │
│          ↓                                     ↓                       │
│  [ IBM watsonx.ai (Granite) ] ←── [ Grounded Clinical Prompts ]        │
│          ↓                                                             │
│  [ Clinician Web Interface: React + TypeScript + Recharts ]            │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   ┆
                 Future Hardware Integration Layer
                                   ┆
┌──────────────────────────────────▼─────────────────────────────────────┐
│                 FUTURE PHYSICAL VENO-PUMP DEVICE                       │
│  - Smart calf sleeve wearable                                          │
│  - Pneumatic / graduated compression bladder actuators                 │
│  - Neuromuscular Electrical Stimulation (NMES) modules                 │
│  - On-sleeve telemetry and Bluetooth LE synchronization               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Implemented Software Features

### A. Patient & Cohort Management
- Centralized clinician dashboard listing all active patients under rehabilitation care.
- Real-time aggregation of cohort status, high-risk flags, average 28-day adherence rates, and recent therapy logs.
- Dedicated patient profile views with demographic details, diagnosis tags (e.g., CVI Stage 3, DVT Post-Op, Venous Ulcer Prevention), prescribed protocols, and session histories.

### B. Longitudinal Adherence Tracking
- **28-Day Adherence Metric:** Evaluates completed vs. prescribed sessions over rolling 28-day windows.
- **Week-over-Week Trend Analysis:** Quantifies compliance momentum (positive, neutral, or negative deltas) across the past four 7-day intervals.

### C. Multi-Symptom Outcome Progression
- Tracks longitudinal clinical recovery metrics across four key symptoms on standardized 0–10 numeric rating scales:
  - **Pain** (Calf / limb discomfort)
  - **Oedema / Swelling** (Circumferential ankle/calf fluid retention)
  - **Heaviness** (Lower extremity gravity resistance/fullness)
  - **Fatigue** (Exertion-induced muscular exhaustion)
- Interactive Recharts visualizers comparing symptom baselines against current 7-day averages.

### D. Automated Clinical Risk Stratification Engine
Deterministic rule engine evaluating four explicit risk conditions:
1. `ADHERENCE_DROP`: Adherence rate falls below critical clinical thresholds (<60%).
2. `SYMPTOM_WORSENING`: Cumulative symptom severity increase ≥ 2 points compared to baseline.
3. `INCOMPLETE_SESSIONS`: Repeated premature session terminations (e.g. >2 aborted sessions in 7 days).
4. `HIGH_DISCOMFORT`: Patient reported post-session discomfort level ≥ 7/10.

Assigns patient risk tiers (`LOW`, `MODERATE`, `HIGH`) with clear, actionable clinical alert banners.

### E. AI Clinical Insights (IBM watsonx.ai)
- Generates structured, patient-specific clinical narratives and cohort-level observations using **IBM watsonx.ai (IBM Granite 4 H Small)**.
- Features **grounded prompting**: the backend calculates exact statistical metrics first, injecting them into structured system prompts to eliminate LLM hallucinations.
- Built-in **deterministic fallback engine**: if the cloud AI service is offline or unconfigured, rule-based clinical analysis is returned with a clear demo banner.

### F. Interactive Clinician AI Assistant
- Conversational interface for clinicians to ask specific questions regarding patient trajectories, adherence patterns, or cohort risk distributions.
- Pre-grounded with patient context and strict safety guardrails preventing unverified diagnostic or prescriptive claims.

### G. Standardized Clinical Reports
- One-click compilation of comprehensive clinical summaries containing patient demographics, adherence charts, symptom evolution tables, risk factors, and AI-assisted notes ready for team case reviews.

### H. Rehabilitation Session Simulator
- Allows clinicians or evaluators to simulate new rehabilitation sessions with custom duration, target completion percentage, and reported discomfort, demonstrating immediate real-time risk recalculation.

---

## 3. Separation: Implemented Software vs. Future Hardware

| Capability / Component | Hackathon Prototype Status | Future Production Roadmap |
|---|---|---|
| **Web Dashboard & UI** | ✅ Fully Implemented (React + TS) | Advanced multi-tenant role permissions |
| **Adherence & Risk Engine** | ✅ Fully Implemented (FastAPI + SQLModel) | Multi-center normative benchmarking |
| **AI Insights & Assistant** | ✅ Fully Implemented (IBM Granite + Fallback) | Fine-tuned clinical LLM with EHR integration |
| **Clinical Summary Reports** | ✅ Fully Implemented | HL7 / FHIR export to hospital EHR systems |
| **Patient / Session Data** | 🔬 Synthetic & Simulated Datasets | Real-world clinical registry data |
| **Physical Calf Sleeve Hardware** | ⏳ Proposed Future Concept | Physical wearable with pneumatic/NMES actuators |
| **Telemetry & Bluetooth Sync** | ⏳ Simulated In-App | Real-time BLE / IoT sensor telemetry |

---

## 4. Key Design Decisions

1. **Grounded AI Architecture over Pure LLM Inference:**
   Clinical software demands deterministic accuracy. The platform computes authoritative metrics in Python first and passes them as explicit facts to IBM Granite, ensuring mathematical consistency.
2. **Graceful Offline Fallback:**
   Healthcare workflows cannot fail due to network drops or API rate limits. The backend seamlessly falls back to local clinical rule engines with clear visual provenance.
3. **Clinician-in-the-Loop Safeguards:**
   Every insight, assistant response, and report prominently displays decision support disclaimers and requires clinician review before taking clinical action.
4. **Vite + Tailwind CSS v4 Frontend:**
   Ensures fast bundle load times, responsive clinical layouts across desktop and tablet interfaces, and accessible medical status badging.

---

## 5. IBM Technologies Used

- **IBM watsonx.ai:** Generative AI infrastructure providing access to enterprise-grade foundation models.
- **IBM Granite 4 H Small (`ibm/granite-4-h-small`):** Foundation LLM utilized for generating clinical cohort summaries, individualized patient insights, and answering clinician assistant queries with structured safety constraints.
- **IBM Bob:** Utilized as an AI development and code generation accelerator throughout the engineering and documentation lifecycle.
