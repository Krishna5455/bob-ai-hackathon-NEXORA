from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_settings
from routers import patients, sessions, dashboard, ai

settings = get_settings()

app = FastAPI(
    title="Veno-Pump Clinical Monitoring API",
    description=(
        "Digital intelligence and clinical monitoring layer for the proposed Veno-Pump "
        "wearable rehabilitation device. "
        "⚠ All patient data is SYNTHETIC DEMO DATA. "
        "⚠ All device sessions are SIMULATED. "
        "This prototype does not represent a validated medical device or clinical treatment."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
@app.on_event("startup")
def on_startup():
    init_db()


# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(patients.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")


@app.get("/api/v1/health")
def health():
    return {
        "status": "ok",
        "app": "Veno-Pump Clinical Monitoring API",
        "note": "⚠ All data is synthetic/simulated. Prototype only.",
    }
