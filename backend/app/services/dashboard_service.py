from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException

from app.models.session import InterviewSession, SessionStatus
from app.models.attempt import InterviewAttempt
from app.schemas.dashboard import DashboardStats, WeakArea, SessionBrief


class DashboardService:

    @staticmethod
    async def get_dashboard(user_id: int, db: AsyncSession) -> DashboardStats:
        # All sessions
        sess_result = await db.execute(
            select(InterviewSession)
            .where(InterviewSession.user_id == user_id)
            .order_by(InterviewSession.created_at.desc())
        )
        all_sessions = sess_result.scalars().all()

        # All attempts via joined sessions
        attempts_result = await db.execute(
            select(InterviewAttempt)
            .join(InterviewSession, InterviewAttempt.session_id == InterviewSession.id)
            .where(InterviewSession.user_id == user_id)
        )
        all_attempts = attempts_result.scalars().all()

        total_sessions = len(all_sessions)
        completed_sessions = sum(1 for s in all_sessions if s.status == SessionStatus.COMPLETED)
        total_answers = len(all_attempts)

        scores = [a.total_score for a in all_attempts if a.total_score is not None]
        overall_avg = round(sum(scores) / len(scores), 2) if scores else 0.0
        best_score = max(scores) if scores else 0.0

        # Improvement trend (avg score per completed session, last 10)
        completed = [s for s in all_sessions if s.status == SessionStatus.COMPLETED][-10:]
        trend = []
        for sess in completed:
            sess_attempts = [a for a in all_attempts if a.session_id == sess.id]
            sess_scores = [a.total_score for a in sess_attempts if a.total_score is not None]
            trend.append(round(sum(sess_scores) / len(sess_scores), 2) if sess_scores else 0.0)

        # Weak / strong areas based on score dimensions
        correctness_scores = [a.correctness_score for a in all_attempts if a.correctness_score is not None]
        comm_scores = [a.communication_score for a in all_attempts if a.communication_score is not None]
        rel_scores = [a.relevance_score for a in all_attempts if a.relevance_score is not None]

        def avg(lst): return round(sum(lst) / len(lst), 2) if lst else 0.0

        dimension_scores = {
            "Technical Knowledge": avg(correctness_scores),
            "Communication": avg(comm_scores),
            "Answer Relevance": avg(rel_scores),
        }

        weak_areas = [
            WeakArea(category=k, avg_score=v, count=total_answers)
            for k, v in dimension_scores.items() if v < 6.0
        ]
        strong_areas = [
            WeakArea(category=k, avg_score=v, count=total_answers)
            for k, v in dimension_scores.items() if v >= 6.0
        ]

        # Skills to improve from low-scoring attempts
        skills_to_improve = []
        if avg(correctness_scores) < 6.0:
            skills_to_improve.append("Core technical concepts")
        if avg(comm_scores) < 6.0:
            skills_to_improve.append("Structured communication (STAR method)")
        if avg(rel_scores) < 6.0:
            skills_to_improve.append("Question relevance and focus")

        # Recent sessions
        recent = []
        for sess in all_sessions[:5]:
            sess_attempts = [a for a in all_attempts if a.session_id == sess.id]
            sess_scores = [a.total_score for a in sess_attempts if a.total_score is not None]
            recent.append(SessionBrief(
                id=sess.id,
                role=sess.role,
                difficulty=sess.difficulty,
                status=sess.status,
                avg_score=avg(sess_scores) if sess_scores else None,
                total_questions=sess.total_questions,
                answered=len(sess_attempts),
                created_at=sess.created_at,
            ))

        return DashboardStats(
            total_sessions=total_sessions,
            completed_sessions=completed_sessions,
            total_answers=total_answers,
            overall_avg_score=overall_avg,
            best_score=best_score,
            improvement_trend=trend,
            weak_areas=weak_areas,
            strong_areas=strong_areas,
            recent_sessions=recent,
            skills_to_improve=skills_to_improve,
        )
