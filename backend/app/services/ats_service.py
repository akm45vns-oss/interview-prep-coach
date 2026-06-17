from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.resume import Resume
from app.ai.skill_matcher import score_resume_for_role
from app.ai.llm_client import llm_client
from app.schemas.resume import ATSScoreOut, ATSSuggestion


class ATSService:

    @staticmethod
    async def score(
        resume_id: int,
        user_id: int,
        role: str,
        job_description: str,
        db: AsyncSession,
    ) -> ATSScoreOut:
        # Fetch resume
        result = await db.execute(
            select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
        )
        resume = result.scalar_one_or_none()
        if not resume:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

        skills = resume.parsed_skills or []
        if not skills:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Resume has no parsed skills. Please re-upload."
            )

        # Compute skill match score
        match_result = score_resume_for_role(skills, role, job_description)

        # Get LLM suggestions for missing skills
        suggestions = await ATSService._get_suggestions(
            missing_skills=match_result["missing_skills"],
            role=role,
            current_skills=skills,
        )

        # ATS summary from LLM
        summary = await ATSService._get_ats_summary(
            score=match_result["score"],
            matched=match_result["matched_skills"],
            missing=match_result["missing_skills"],
            role=role,
        )

        # Update DB
        resume.ats_score = match_result["score"]
        await db.flush()

        return ATSScoreOut(
            score=match_result["score"],
            matched_skills=match_result["matched_skills"],
            missing_skills=match_result["missing_skills"],
            suggestions=suggestions,
            summary=summary,
        )

    @staticmethod
    async def _get_suggestions(
        missing_skills: list[str],
        role: str,
        current_skills: list[str],
    ) -> list[ATSSuggestion]:
        if not missing_skills:
            return []

        prompt = f"""For a {role} position, the candidate is missing these skills: {missing_skills[:10]}.
They currently have: {current_skills[:10]}.

For each missing skill, assign a priority (high/medium/low) and a brief reason why it matters.

Return JSON array:
[{{"skill": "...", "priority": "high|medium|low", "reason": "..."}}]"""

        try:
            raw = llm_client.chat_json([
                {"role": "system", "content": "You are a technical career coach."},
                {"role": "user", "content": prompt}
            ])
            if isinstance(raw, list):
                return [ATSSuggestion(**item) for item in raw[:10]]
        except Exception:
            pass

        # Fallback
        return [
            ATSSuggestion(skill=s, priority="medium", reason=f"Required for {role} roles")
            for s in missing_skills[:5]
        ]

    @staticmethod
    async def _get_ats_summary(score: float, matched: list, missing: list, role: str) -> str:
        prompt = f"""ATS Score: {score}/100 for {role} role.
Matched skills: {matched[:8]}
Missing skills: {missing[:8]}

Write a 2-3 sentence professional summary of this ATS analysis with actionable advice."""

        try:
            return llm_client.chat([
                {"role": "system", "content": "You are a professional resume reviewer."},
                {"role": "user", "content": prompt}
            ], max_tokens=200)
        except Exception:
            return f"Your resume scores {score}/100 for {role}. Focus on adding the missing skills to improve your ATS ranking."
