from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.schemas.dashboard import DashboardStats, RoadmapRequest, RoadmapOut
from app.services.dashboard_service import DashboardService
from app.services.roadmap_service import RoadmapService
from app.utils.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/", response_model=DashboardStats)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full dashboard statistics including scores, trends, and weak areas."""
    return await DashboardService.get_dashboard(current_user.id, db)


@router.post("/roadmap", response_model=RoadmapOut)
async def generate_roadmap(
    data: RoadmapRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate an AI-powered learning roadmap for the target role."""
    return await RoadmapService.generate(data, current_user.id, db)


@router.get("/roadmaps", response_model=List[RoadmapOut])
async def get_roadmaps(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's previously generated learning roadmaps."""
    return await RoadmapService.get_latest(current_user.id, db)
