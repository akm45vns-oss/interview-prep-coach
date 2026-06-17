from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from datetime import datetime, timezone

from app.models.session import InterviewSession, InterviewQuestion, SessionStatus
from app.models.resume import Resume
from app.ai.llm_client import llm_client
from app.schemas.interview import InterviewStartRequest, SessionOut, QuestionOut


class QuestionService:

    @staticmethod
    async def start_session(
        data: InterviewStartRequest,
        user_id: int,
        db: AsyncSession,
    ) -> SessionOut:
        # Optionally load resume context
        resume_context = ""
        if data.resume_id:
            result = await db.execute(
                select(Resume).where(Resume.id == data.resume_id, Resume.user_id == user_id)
            )
            resume = result.scalar_one_or_none()
            if resume:
                skills = resume.parsed_skills or []
                projects = resume.parsed_projects or []
                experience = resume.parsed_experience or []
                resume_context = f"""
Candidate Skills: {', '.join(skills[:20])}
Projects: {', '.join(p.get('name', '') for p in projects[:5])}
Experience: {', '.join(f"{e.get('title','')} at {e.get('company','')}" for e in experience[:3])}
"""

        # Generate questions via LLM
        questions_data = await QuestionService._generate_questions(
            role=data.role,
            difficulty=data.difficulty,
            num_questions=data.num_questions,
            resume_context=resume_context,
        )

        # Create session
        session = InterviewSession(
            user_id=user_id,
            resume_id=data.resume_id,
            role=data.role,
            difficulty=data.difficulty,
            status=SessionStatus.IN_PROGRESS,
            total_questions=len(questions_data),
        )
        db.add(session)
        await db.flush()

        # Create questions
        question_objs = []
        for i, q in enumerate(questions_data):
            question = InterviewQuestion(
                session_id=session.id,
                question_text=q["question"],
                category=q.get("category", "technical"),
                difficulty=q.get("difficulty", data.difficulty),
                order_index=i,
            )
            db.add(question)
            question_objs.append(question)

        await db.flush()
        for q in question_objs:
            await db.refresh(q)
        await db.refresh(session)

        # Build response manually to avoid async lazy-load issues
        question_outs = [
            QuestionOut(
                id=q.id,
                question_text=q.question_text,
                category=q.category,
                difficulty=q.difficulty,
                order_index=q.order_index,
            )
            for q in question_objs
        ]
        return SessionOut(
            id=session.id,
            user_id=session.user_id,
            resume_id=session.resume_id,
            role=session.role,
            difficulty=session.difficulty,
            status=session.status,
            total_questions=session.total_questions,
            created_at=session.created_at,
            completed_at=session.completed_at,
            questions=question_outs,
        )

    @staticmethod
    async def _generate_questions(
        role: str,
        difficulty: str,
        num_questions: int,
        resume_context: str,
    ) -> list[dict]:
        difficulty_guide = {
            "easy": "beginner-friendly, conceptual questions",
            "medium": "intermediate questions requiring practical knowledge",
            "hard": "advanced, scenario-based, system design questions",
        }

        prompt = f"""Generate {num_questions} interview questions for a {role} position.
Difficulty: {difficulty} ({difficulty_guide.get(difficulty, 'intermediate')})
{f"Candidate Background:{resume_context}" if resume_context else ""}

Mix question categories:
- Technical (40%): coding concepts, tools, frameworks
- Behavioral (30%): situational, STAR-method questions
- Problem-solving (20%): analytical, case-study questions
- Role-specific (10%): domain knowledge

Return JSON array:
[
  {{
    "question": "Full question text here",
    "category": "technical|behavioral|problem-solving|role-specific",
    "difficulty": "{difficulty}"
  }}
]"""

        try:
            result = llm_client.chat_json([
                {"role": "system", "content": f"You are an expert technical interviewer for {role} positions. Generate realistic, challenging interview questions."},
                {"role": "user", "content": prompt}
            ], max_tokens=2000)

            if isinstance(result, list) and result:
                return result[:num_questions]
        except Exception as e:
            pass

        # Fallback questions
        return [
            {"question": f"Tell me about your experience with key technologies for {role}.", "category": "technical", "difficulty": difficulty},
            {"question": "Describe a challenging project and how you overcame obstacles.", "category": "behavioral", "difficulty": difficulty},
            {"question": f"How would you design a scalable system for a {role} use case?", "category": "problem-solving", "difficulty": difficulty},
            {"question": "Where do you see yourself in 5 years in this field?", "category": "behavioral", "difficulty": difficulty},
            {"question": "What's your approach to debugging a complex production issue?", "category": "technical", "difficulty": difficulty},
        ][:num_questions]

    @staticmethod
    async def get_session_questions(session_id: int, user_id: int, db: AsyncSession) -> SessionOut:
        result = await db.execute(
            select(InterviewSession)
            .options(selectinload(InterviewSession.questions))
            .where(
                InterviewSession.id == session_id,
                InterviewSession.user_id == user_id
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

        question_outs = [
            QuestionOut(
                id=q.id,
                question_text=q.question_text,
                category=q.category,
                difficulty=q.difficulty,
                order_index=q.order_index,
            )
            for q in sorted(session.questions, key=lambda x: x.order_index)
        ]
        return SessionOut(
            id=session.id,
            user_id=session.user_id,
            resume_id=session.resume_id,
            role=session.role,
            difficulty=session.difficulty,
            status=session.status,
            total_questions=session.total_questions,
            created_at=session.created_at,
            completed_at=session.completed_at,
            questions=question_outs,
        )
