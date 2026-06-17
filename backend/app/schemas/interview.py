from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class InterviewStartRequest(BaseModel):
    resume_id: Optional[int] = None
    role: str
    difficulty: str = "medium"          # easy | medium | hard
    num_questions: int = 5


class QuestionOut(BaseModel):
    id: int
    question_text: str
    category: Optional[str] = None
    difficulty: Optional[str] = None
    order_index: int

    class Config:
        from_attributes = True


class SessionOut(BaseModel):
    id: int
    user_id: int
    resume_id: Optional[int] = None
    role: str
    difficulty: str
    status: str
    total_questions: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    questions: List[QuestionOut] = []

    class Config:
        from_attributes = True


class AnswerSubmit(BaseModel):
    question_id: int
    user_answer: str


class EvaluationOut(BaseModel):
    attempt_id: int
    question_id: int
    user_answer: str
    ai_evaluation: str
    correctness_score: float
    communication_score: float
    relevance_score: float
    total_score: float
    ideal_answer: str
    strengths: List[str]
    improvements: List[str]

    class Config:
        from_attributes = True


class SessionSummary(BaseModel):
    session_id: int
    role: str
    difficulty: str
    total_questions: int
    answered: int
    avg_score: float
    avg_correctness: float
    avg_communication: float
    avg_relevance: float
    weak_areas: List[str]
    strong_areas: List[str]
    attempts: List[EvaluationOut]
