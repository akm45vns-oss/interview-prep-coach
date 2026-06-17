from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.export_service import ExportService
from app.utils.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/export", tags=["Export"])


@router.get("/{session_id}/pdf")
async def export_pdf(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export an interview session as a PDF performance report."""
    pdf_bytes = await ExportService.generate_pdf(session_id, current_user.id, db)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=interview_report_session_{session_id}.pdf"
        },
    )
