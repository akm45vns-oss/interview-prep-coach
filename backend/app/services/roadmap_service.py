from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.resume import Resume, LearningRoadmap
from app.ai.llm_client import llm_client
from app.schemas.dashboard import RoadmapRequest, RoadmapOut, RoadmapPhase
from fastapi import HTTPException, status


class RoadmapService:

    @staticmethod
    async def generate(data: RoadmapRequest, user_id: int, db: AsyncSession) -> RoadmapOut:
        # Get resume skills if resume_id provided
        current_skills = []
        resume_id = data.resume_id

        if resume_id:
            result = await db.execute(
                select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
            )
            resume = result.scalar_one_or_none()
            if resume and resume.parsed_skills:
                current_skills = resume.parsed_skills

        weak_areas = data.weak_areas or []

        prompt = f"""Create a detailed learning roadmap for someone targeting a {data.role} position.

Current Skills: {', '.join(current_skills[:15]) if current_skills else 'Not specified'}
Weak Areas to Address: {', '.join(weak_areas) if weak_areas else 'General preparation'}

Create a 3-phase roadmap with specific, actionable learning paths.

Return JSON:
{{
  "phases": [
    {{
      "phase": 1,
      "title": "Foundation",
      "duration": "4 weeks",
      "topics": ["topic1", "topic2", "topic3"],
      "resources": [
        {{"title": "Resource Name", "url": "https://...", "type": "course|book|tutorial|practice"}}
      ],
      "milestone": "What you'll be able to do after this phase"
    }},
    {{
      "phase": 2,
      "title": "Core Skills",
      "duration": "6 weeks",
      "topics": [...],
      "resources": [...],
      "milestone": "..."
    }},
    {{
      "phase": 3,
      "title": "Advanced & Interview Prep",
      "duration": "4 weeks",
      "topics": [...],
      "resources": [...],
      "milestone": "..."
    }}
  ],
  "total_duration": "14 weeks"
}}"""

        try:
            result = llm_client.chat_json([
                {"role": "system", "content": f"You are a senior career coach and technical mentor specializing in {data.role} career paths."},
                {"role": "user", "content": prompt}
            ], max_tokens=2000)

            phases_data = result.get("phases", [])
            total_duration = result.get("total_duration", "12 weeks")
            phases = [RoadmapPhase(**p) for p in phases_data]

        except Exception:
            # Fallback roadmap
            phases = [
                RoadmapPhase(
                    phase=1,
                    title="Foundation Building",
                    duration="4 weeks",
                    topics=["Core programming concepts", "Data structures", "System basics"],
                    resources=[
                        {"title": "LeetCode", "url": "https://leetcode.com", "type": "practice"},
                        {"title": "Coursera", "url": "https://coursera.org", "type": "course"},
                    ],
                    milestone=f"Solid foundation for {data.role} interviews"
                ),
                RoadmapPhase(
                    phase=2,
                    title="Core Skills",
                    duration="6 weeks",
                    topics=["Domain-specific tools", "Best practices", "Project work"],
                    resources=[
                        {"title": "GitHub Projects", "url": "https://github.com", "type": "practice"},
                    ],
                    milestone="Portfolio-ready projects"
                ),
                RoadmapPhase(
                    phase=3,
                    title="Interview Preparation",
                    duration="4 weeks",
                    topics=["Mock interviews", "System design", "Behavioral prep"],
                    resources=[
                        {"title": "Pramp", "url": "https://pramp.com", "type": "practice"},
                    ],
                    milestone="Interview-ready"
                ),
            ]
            total_duration = "14 weeks"

        # Save to DB
        roadmap_db = LearningRoadmap(
            user_id=user_id,
            resume_id=resume_id,
            role=data.role,
            roadmap_json={
                "phases": [p.model_dump() for p in phases],
                "total_duration": total_duration
            }
        )
        db.add(roadmap_db)
        await db.flush()
        await db.refresh(roadmap_db)

        return RoadmapOut(
            id=roadmap_db.id,
            role=data.role,
            phases=phases,
            total_duration=total_duration,
            created_at=roadmap_db.created_at,
        )

    @staticmethod
    async def get_latest(user_id: int, db: AsyncSession) -> list:
        result = await db.execute(
            select(LearningRoadmap)
            .where(LearningRoadmap.user_id == user_id)
            .order_by(LearningRoadmap.created_at.desc())
            .limit(5)
        )
        roadmaps = result.scalars().all()
        out = []
        for r in roadmaps:
            rj = r.roadmap_json or {}
            phases = [RoadmapPhase(**p) for p in rj.get("phases", [])]
            out.append(RoadmapOut(
                id=r.id,
                role=r.role,
                phases=phases,
                total_duration=rj.get("total_duration", ""),
                created_at=r.created_at,
            ))
        return out
