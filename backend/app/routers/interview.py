from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.interview import (
    InterviewStartRequest, SessionOut, AnswerSubmit, EvaluationOut, SessionSummary
)
from app.services.question_service import QuestionService
from app.services.evaluation_service import EvaluationService
from app.utils.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/interview", tags=["Interview"])


@router.post("/start", response_model=SessionOut, status_code=201)
async def start_interview(
    data: InterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a new interview session. Generates AI questions based on role, difficulty, and resume."""
    return await QuestionService.start_session(data, current_user.id, db)


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get interview session with all questions."""
    return await QuestionService.get_session_questions(session_id, current_user.id, db)


@router.post("/{session_id}/answer", response_model=EvaluationOut)
async def submit_answer(
    session_id: int,
    data: AnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit an answer for evaluation. Returns AI scoring across correctness, communication, and relevance."""
    return await EvaluationService.evaluate_answer(session_id, data, current_user.id, db)


@router.get("/{session_id}/summary", response_model=SessionSummary)
async def get_summary(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the full summary and evaluation for a completed session."""
    return await EvaluationService.get_session_summary(session_id, current_user.id, db)
