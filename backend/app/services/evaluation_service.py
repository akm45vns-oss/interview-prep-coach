from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from datetime import datetime, timezone

from app.models.session import InterviewSession, InterviewQuestion, SessionStatus
from app.models.attempt import InterviewAttempt
from app.ai.llm_client import llm_client
from app.schemas.interview import AnswerSubmit, EvaluationOut, SessionSummary


class EvaluationService:

    @staticmethod
    async def evaluate_answer(
        session_id: int,
        data: AnswerSubmit,
        user_id: int,
        db: AsyncSession,
    ) -> EvaluationOut:
        # Verify session
        sess_result = await db.execute(
            select(InterviewSession).where(
                InterviewSession.id == session_id,
                InterviewSession.user_id == user_id
            )
        )
        session = sess_result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

        # Verify question belongs to session
        q_result = await db.execute(
            select(InterviewQuestion).where(
                InterviewQuestion.id == data.question_id,
                InterviewQuestion.session_id == session_id
            )
        )
        question = q_result.scalar_one_or_none()
        if not question:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found in this session")

        # Check if already answered
        existing = await db.execute(
            select(InterviewAttempt).where(
                InterviewAttempt.session_id == session_id,
                InterviewAttempt.question_id == data.question_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Question already answered")

        # Get AI evaluation
        evaluation = await EvaluationService._evaluate_with_llm(
            question=question.question_text,
            answer=data.user_answer,
            role=session.role,
            category=question.category or "technical",
            difficulty=question.difficulty or session.difficulty,
        )

        # Save attempt
        attempt = InterviewAttempt(
            session_id=session_id,
            question_id=data.question_id,
            user_answer=data.user_answer,
            ai_evaluation=evaluation["feedback"],
            correctness_score=evaluation["correctness_score"],
            communication_score=evaluation["communication_score"],
            relevance_score=evaluation["relevance_score"],
            total_score=evaluation["total_score"],
            ideal_answer=evaluation["ideal_answer"],
            strengths=evaluation["strengths"],
            improvements=evaluation["improvements"],
        )
        db.add(attempt)
        await db.flush()

        # Check if all questions answered → mark session completed
        all_q_result = await db.execute(
            select(InterviewQuestion).where(InterviewQuestion.session_id == session_id)
        )
        all_questions = all_q_result.scalars().all()
        attempt_result = await db.execute(
            select(InterviewAttempt).where(InterviewAttempt.session_id == session_id)
        )
        all_attempts = attempt_result.scalars().all()

        if len(all_attempts) >= len(all_questions):
            session.status = SessionStatus.COMPLETED
            session.completed_at = datetime.now(timezone.utc)

        await db.flush()
        await db.refresh(attempt)

        return EvaluationOut(
            attempt_id=attempt.id,
            question_id=attempt.question_id,
            user_answer=attempt.user_answer,
            ai_evaluation=attempt.ai_evaluation,
            correctness_score=attempt.correctness_score,
            communication_score=attempt.communication_score,
            relevance_score=attempt.relevance_score,
            total_score=attempt.total_score,
            ideal_answer=attempt.ideal_answer,
            strengths=attempt.strengths or [],
            improvements=attempt.improvements or [],
        )

    @staticmethod
    async def _evaluate_with_llm(
        question: str,
        answer: str,
        role: str,
        category: str,
        difficulty: str,
    ) -> dict:
        prompt = f"""Evaluate this interview answer for a {role} position.

Question ({category}, {difficulty}): {question}

Candidate's Answer: {answer}

Evaluate on three dimensions (0-10 scale):
1. Correctness: Technical accuracy and depth
2. Communication: Clarity, structure, articulation
3. Relevance: How well the answer addresses the question

Return JSON:
{{
  "correctness_score": 7.5,
  "communication_score": 8.0,
  "relevance_score": 7.0,
  "total_score": 7.5,
  "feedback": "Overall feedback in 2-3 sentences",
  "ideal_answer": "What a strong answer would include...",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area 1", "area 2"]
}}"""

        try:
            result = llm_client.chat_json([
                {"role": "system", "content": f"You are an expert interviewer for {role} positions. Evaluate answers fairly and constructively."},
                {"role": "user", "content": prompt}
            ], max_tokens=800)

            if isinstance(result, dict):
                # Clamp scores to 0-10
                for key in ["correctness_score", "communication_score", "relevance_score"]:
                    result[key] = max(0.0, min(10.0, float(result.get(key, 5.0))))

                # Recalculate total as weighted average
                result["total_score"] = round(
                    result["correctness_score"] * 0.4 +
                    result["communication_score"] * 0.3 +
                    result["relevance_score"] * 0.3, 1
                )
                return result
        except Exception:
            pass

        # Fallback
        return {
            "correctness_score": 5.0,
            "communication_score": 5.0,
            "relevance_score": 5.0,
            "total_score": 5.0,
            "feedback": "Your answer shows some understanding of the topic. With more depth and structure, it could be stronger.",
            "ideal_answer": "A strong answer would clearly define the concept, provide practical examples, and demonstrate hands-on experience.",
            "strengths": ["Attempted to answer the question"],
            "improvements": ["Add more technical depth", "Use the STAR method for behavioral questions"],
        }

    @staticmethod
    async def get_session_summary(session_id: int, user_id: int, db: AsyncSession) -> SessionSummary:
        sess_result = await db.execute(
            select(InterviewSession).where(
                InterviewSession.id == session_id,
                InterviewSession.user_id == user_id
            )
        )
        session = sess_result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

        attempts_result = await db.execute(
            select(InterviewAttempt).where(InterviewAttempt.session_id == session_id)
        )
        attempts = attempts_result.scalars().all()

        if not attempts:
            return SessionSummary(
                session_id=session_id,
                role=session.role,
                difficulty=session.difficulty,
                total_questions=session.total_questions,
                answered=0,
                avg_score=0.0,
                avg_correctness=0.0,
                avg_communication=0.0,
                avg_relevance=0.0,
                weak_areas=[],
                strong_areas=[],
                attempts=[],
            )

        def avg(lst): return round(sum(lst) / len(lst), 2) if lst else 0.0

        scores = [a.total_score for a in attempts if a.total_score is not None]
        correctness = [a.correctness_score for a in attempts if a.correctness_score is not None]
        communication = [a.communication_score for a in attempts if a.communication_score is not None]
        relevance = [a.relevance_score for a in attempts if a.relevance_score is not None]

        weak_areas = []
        strong_areas = []
        if avg(correctness) < 6.0:
            weak_areas.append("Technical Knowledge")
        else:
            strong_areas.append("Technical Knowledge")
        if avg(communication) < 6.0:
            weak_areas.append("Communication Skills")
        else:
            strong_areas.append("Communication Skills")
        if avg(relevance) < 6.0:
            weak_areas.append("Answer Relevance")
        else:
            strong_areas.append("Answer Relevance")

        attempt_outs = [
            EvaluationOut(
                attempt_id=a.id,
                question_id=a.question_id,
                user_answer=a.user_answer,
                ai_evaluation=a.ai_evaluation or "",
                correctness_score=a.correctness_score or 0,
                communication_score=a.communication_score or 0,
                relevance_score=a.relevance_score or 0,
                total_score=a.total_score or 0,
                ideal_answer=a.ideal_answer or "",
                strengths=a.strengths or [],
                improvements=a.improvements or [],
            )
            for a in attempts
        ]

        return SessionSummary(
            session_id=session_id,
            role=session.role,
            difficulty=session.difficulty,
            total_questions=session.total_questions,
            answered=len(attempts),
            avg_score=avg(scores),
            avg_correctness=avg(correctness),
            avg_communication=avg(communication),
            avg_relevance=avg(relevance),
            weak_areas=weak_areas,
            strong_areas=strong_areas,
            attempts=attempt_outs,
        )
