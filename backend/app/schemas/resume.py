from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class ResumeOut(BaseModel):
    id: int
    user_id: int
    filename: str
    raw_text: Optional[str] = None
    parsed_skills: Optional[List[str]] = None
    parsed_education: Optional[List[Dict[str, Any]]] = None
    parsed_projects: Optional[List[Dict[str, Any]]] = None
    parsed_experience: Optional[List[Dict[str, Any]]] = None
    contact_info: Optional[Dict[str, Any]] = None
    ats_score: Optional[float] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ATSRequest(BaseModel):
    role: str
    job_description: Optional[str] = None


class ATSSuggestion(BaseModel):
    skill: str
    priority: str   # "high", "medium", "low"
    reason: str


class ATSScoreOut(BaseModel):
    score: float                        # 0-100
    matched_skills: List[str]
    missing_skills: List[str]
    suggestions: List[ATSSuggestion]
    summary: str
