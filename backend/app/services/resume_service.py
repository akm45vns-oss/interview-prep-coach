import os
import re
import json
import aiofiles
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, UploadFile, status

from app.config import settings
from app.models.resume import Resume
from app.models.user import User
from app.utils.pdf_parser import extract_text_from_pdf
from app.utils.docx_parser import extract_text_from_docx
from app.ai.llm_client import llm_client
from app.schemas.resume import ResumeOut


ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MAX_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


class ResumeService:

    @staticmethod
    async def upload_and_parse(file: UploadFile, user: User, db: AsyncSession) -> ResumeOut:
        # Validate extension
        ext = Path(file.filename or "").suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only PDF and DOCX files are allowed. Got: {ext}"
            )

        # Read file
        file_bytes = await file.read()
        if len(file_bytes) > MAX_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Max size: {settings.MAX_FILE_SIZE_MB}MB"
            )

        # Save to disk
        safe_name = re.sub(r"[^\w.\-]", "_", file.filename or "resume")
        save_path = os.path.join(settings.UPLOAD_DIR, f"{user.id}_{safe_name}")
        async with aiofiles.open(save_path, "wb") as f:
            await f.write(file_bytes)

        # Extract text
        if ext == ".pdf":
            raw_text = extract_text_from_pdf(file_bytes)
        else:
            raw_text = extract_text_from_docx(file_bytes)

        if not raw_text.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not extract text from the file. Ensure it's not image-based."
            )

        # Parse with LLM
        parsed = await ResumeService._parse_resume_llm(raw_text)

        # Save to DB
        resume = Resume(
            user_id=user.id,
            filename=file.filename,
            file_path=save_path,
            raw_text=raw_text[:10000],  # Store first 10K chars
            parsed_skills=parsed.get("skills", []),
            parsed_education=parsed.get("education", []),
            parsed_projects=parsed.get("projects", []),
            parsed_experience=parsed.get("experience", []),
            contact_info=parsed.get("contact_info", {}),
        )
        db.add(resume)
        await db.flush()
        await db.refresh(resume)
        return ResumeOut.model_validate(resume)

    @staticmethod
    async def _parse_resume_llm(raw_text: str) -> dict:
        """Use LLM to extract structured data from resume text."""
        prompt = f"""Parse this resume and extract structured information.

Resume text:
{raw_text[:4000]}

Return a JSON object with these exact keys:
{{
  "contact_info": {{"name": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": ""}},
  "skills": ["skill1", "skill2", ...],
  "education": [{{"degree": "", "institution": "", "year": "", "gpa": ""}}],
  "experience": [{{"title": "", "company": "", "duration": "", "description": ""}}],
  "projects": [{{"name": "", "description": "", "technologies": []}}]
}}"""

        try:
            result = llm_client.chat_json([
                {"role": "system", "content": "You are a resume parser. Extract structured data accurately."},
                {"role": "user", "content": prompt}
            ])
            return result if isinstance(result, dict) else {}
        except Exception as e:
            # Fallback: return empty parsed data, don't fail the upload
            return {"skills": [], "education": [], "experience": [], "projects": [], "contact_info": {}}

    @staticmethod
    async def get_resume(resume_id: int, user_id: int, db: AsyncSession) -> ResumeOut:
        result = await db.execute(
            select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
        )
        resume = result.scalar_one_or_none()
        if not resume:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        return ResumeOut.model_validate(resume)

    @staticmethod
    async def get_user_resumes(user_id: int, db: AsyncSession) -> list[ResumeOut]:
        result = await db.execute(
            select(Resume).where(Resume.user_id == user_id).order_by(Resume.uploaded_at.desc())
        )
        resumes = result.scalars().all()
        return [ResumeOut.model_validate(r) for r in resumes]
