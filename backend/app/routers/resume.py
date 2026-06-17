from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.schemas.resume import ResumeOut, ATSRequest, ATSScoreOut
from app.services.resume_service import ResumeService
from app.services.ats_service import ATSService
from app.utils.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/resume", tags=["Resume"])


@router.post("/upload", response_model=ResumeOut, status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a PDF or DOCX resume. Parses skills, education, projects, and experience."""
    return await ResumeService.upload_and_parse(file, current_user, db)


@router.get("/", response_model=List[ResumeOut])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all resumes for the current user."""
    return await ResumeService.get_user_resumes(current_user.id, db)


@router.get("/{resume_id}", response_model=ResumeOut)
async def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific resume by ID."""
    return await ResumeService.get_resume(resume_id, current_user.id, db)


@router.post("/{resume_id}/ats-score", response_model=ATSScoreOut)
async def ats_score(
    resume_id: int,
    data: ATSRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Compute ATS score for a resume against a target role."""
    return await ATSService.score(
        resume_id=resume_id,
        user_id=current_user.id,
        role=data.role,
        job_description=data.job_description or "",
        db=db,
    )
