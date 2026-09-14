from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime, date
from enum import Enum
import uuid


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class SessionStatus(str, Enum):
    completed = "completed"
    missed = "missed"
    incomplete = "incomplete"


class InsightType(str, Enum):
    patient_summary = "patient_summary"
    dashboard_summary = "dashboard_summary"
    alert = "alert"


# ── Database Tables ────────────────────────────────────────────────────────────

class Patient(SQLModel, table=True):
    id: str = Field(primary_key=True)            # e.g. "P-001"
    name: str
    age: int
    diagnosis: str
    start_date: date
    planned_sessions_per_week: int = Field(default=3)
    risk_level: RiskLevel = Field(default=RiskLevel.low)
    risk_flags_json: str = Field(default="[]")   # JSON array of RiskFlag dicts
    notes: str = Field(default="")
    is_demo: bool = Field(default=True)

    sessions: List["TreatmentSession"] = Relationship(back_populates="patient")
    insights: List["AIInsight"] = Relationship(back_populates="patient")


class TreatmentSession(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    session_date: datetime
    duration_minutes: int
    status: SessionStatus
    compression_level: str = Field(default="moderate")   # simulated
    nmes_pattern: str = Field(default="standard-calf")   # simulated
    patient_reported_pain: int = Field(default=0)        # 0-10
    patient_reported_comfort: int = Field(default=5)     # 0-10
    notes: str = Field(default="")
    is_simulated: bool = Field(default=True)

    patient: Optional[Patient] = Relationship(back_populates="sessions")


class AIInsight(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    patient_id: Optional[str] = Field(default=None, foreign_key="patient.id")
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    insight_text: str
    insight_type: InsightType
    model_used: str = Field(default="ibm/granite-13b-instruct-v2")

    patient: Optional[Patient] = Relationship(back_populates="insights")


# ── API Response Schemas (not tables) ─────────────────────────────────────────

class RiskFlag(SQLModel):
    flag_type: str        # declining_adherence | missed_sessions | increasing_discomfort | irregular_attendance
    severity: str         # warning | critical
    detail: str


class AdherenceSummary(SQLModel):
    patient_id: str
    planned_sessions: int
    completed_sessions: int
    missed_sessions: int
    adherence_pct: float
    week_over_week_trend: float   # positive = improving, negative = declining


class OutcomePoint(SQLModel):
    session_date: datetime
    pain: int
    comfort: int


class PatientSummary(SQLModel):
    """Lightweight patient representation for list views."""
    id: str
    name: str
    age: int
    diagnosis: str
    start_date: date
    planned_sessions_per_week: int
    risk_level: RiskLevel
    risk_flags: List[RiskFlag]
    adherence: Optional[AdherenceSummary]
    is_demo: bool
    notes: str


class PatientDetail(PatientSummary):
    """Full patient detail including recent sessions."""
    sessions: List["TreatmentSessionRead"]
    insights: List["AIInsightRead"]


class TreatmentSessionRead(SQLModel):
    id: str
    patient_id: str
    session_date: datetime
    duration_minutes: int
    status: SessionStatus
    compression_level: str
    nmes_pattern: str
    patient_reported_pain: int
    patient_reported_comfort: int
    notes: str
    is_simulated: bool


class TreatmentSessionCreate(SQLModel):
    patient_id: str
    session_date: datetime
    duration_minutes: int
    status: SessionStatus
    compression_level: str = "moderate"
    nmes_pattern: str = "standard-calf"
    patient_reported_pain: int = 0
    patient_reported_comfort: int = 5
    notes: str = ""


class AIInsightRead(SQLModel):
    id: str
    patient_id: Optional[str]
    generated_at: datetime
    insight_text: str
    insight_type: InsightType
    model_used: str


class DashboardSummary(SQLModel):
    total_patients: int
    active_patients: int          # patients with at least one session in last 14 days
    completed_sessions_total: int
    avg_adherence_pct: float
    attention_count: int          # patients with high or medium risk
    risk_distribution: dict       # {"low": N, "medium": N, "high": N}
    attention_patients: List[PatientSummary]
    recent_insights: List[AIInsightRead]
