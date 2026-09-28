from typing import Optional
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import (
    ReportSummaryResponse, SkillMapResponse, TestsReportResponse,
    CandidatesReportResponse, AdminsReportResponse
)
from app.services.report_service import report_service
from app.api.deps import get_current_admin

router = APIRouter()


@router.get("/summary", response_model=ReportSummaryResponse)
async def get_analytics_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    test_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin only: Fetches platform analytics metrics calculated directly from database tables."""
    return await report_service.get_summary_analytics(db, start_date=start_date, end_date=end_date, test_type=test_type)


@router.get("/skill-map", response_model=SkillMapResponse)
async def get_skill_map_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin only: Fetches skill/topic breakdown computed from candidate submission scores."""
    return await report_service.get_skill_map(db, start_date=start_date, end_date=end_date)


@router.get("/tests", response_model=TestsReportResponse)
async def get_tests_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin only: Fetches test/assessment performance breakdown from database records."""
    return await report_service.get_tests_report(db, start_date=start_date, end_date=end_date)


@router.get("/candidates", response_model=CandidatesReportResponse)
async def get_candidates_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    assessment_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin only: Fetches candidate results and proctoring/integrity summaries from database."""
    return await report_service.get_candidates_report(
        db,
        start_date=start_date,
        end_date=end_date,
        search=search,
        assessment_id=assessment_id
    )


@router.get("/admins", response_model=AdminsReportResponse)
async def get_admins_report(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin only: Fetches assessment administrators and points of contact from database."""
    return await report_service.get_admins_report(db)


@router.get("/export-csv")
async def export_reports_csv(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    assessment_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin only: Downloads complete assessment results and candidate performance matrix as CSV."""
    csv_content = await report_service.generate_csv_report(
        db,
        start_date=start_date,
        end_date=end_date,
        assessment_id=assessment_id
    )
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=assessment_reports.csv"}
    )


