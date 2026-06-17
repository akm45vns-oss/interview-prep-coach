from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class WeakArea(BaseModel):
    category: str
    avg_score: float
    count: int


class SessionBrief(BaseModel):
    id: int
    role: str
    difficulty: str
    status: str
    avg_score: Optional[float] = None
    total_questions: int
    answered: int
    created_at: datetime


class DashboardStats(BaseModel):
    total_sessions: int
    completed_sessions: int
    total_answers: int
    overall_avg_score: float
    best_score: float
    improvement_trend: List[float]      # avg score per session (last 10)
    weak_areas: List[WeakArea]
    strong_areas: List[WeakArea]
    recent_sessions: List[SessionBrief]
    skills_to_improve: List[str]


class RoadmapRequest(BaseModel):
    resume_id: Optional[int] = None
    role: str
    weak_areas: Optional[List[str]] = None


class RoadmapPhase(BaseModel):
    phase: int
    title: str
    duration: str
    topics: List[str]
    resources: List[Dict[str, str]]     # {"title": ..., "url": ..., "type": ...}
    milestone: str


class RoadmapOut(BaseModel):
    id: int
    role: str
    phases: List[RoadmapPhase]
    total_duration: str
    created_at: datetime

    class Config:
        from_attributes = True
