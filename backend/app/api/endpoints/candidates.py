from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.models.models import User
from app.api.deps import get_current_admin, check_assessment_access
from app.schemas.schemas import (
    CandidateListResponse, CandidateDetailResponse,
    ResetCandidateTestRequest, ExtendTimeRequest, ScheduleInterviewRequest,
    UpdateCandidateStatusRequest, CandidateReportExportRequest,
    ReEnableCandidateTestRequest, CandidateAttemptHistoryItem
)
from app.services.candidate_service import candidate_service

router = APIRouter()


@router.post("/{assessment_id}/candidates/{assignment_id}/re-enable")
async def re_enable_candidate_test(
    assessment_id: str,
    assignment_id: str,
    payload: ReEnableCandidateTestRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin only: Re-enables a test attempt for an individual candidate with options:
    - Resume Previous Attempt (preserves answers, drafts, remaining time)
    - Start a New Attempt (creates fresh attempt, archives previous attempt in history)
    - Custom time configuration (remaining time, full duration, or additional minutes)
    - Mandatory audit logging
    """
    await check_assessment_access(assessment_id, admin, db)
    # Ensure payload assignment_id matches path
    payload.assignment_id = assignment_id
    try:
        return await candidate_service.re_enable_candidate_test(
            db=db,
            assessment_id=assessment_id,
            payload=payload,
            admin_id=admin.id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{assessment_id}/candidates/{assignment_id}/attempts", response_model=List[CandidateAttemptHistoryItem])
async def get_candidate_attempts(
    assessment_id: str,
    assignment_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin only: Fetches all attempt records for a specific candidate assignment.
    """
    await check_assessment_access(assessment_id, admin, db)
    try:
        return await candidate_service.get_candidate_attempts(
            db=db,
            assessment_id=assessment_id,
            assignment_id=assignment_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{assessment_id}/candidates", response_model=CandidateListResponse)
async def get_assessment_candidates(
    assessment_id: str,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin only: Fetches all candidates assigned to this assessment from the real database,
    calculating dynamic attempt percentage, test scores, integrity index, and category counts.
    """
    await check_assessment_access(assessment_id, admin, db)
    return await candidate_service.get_assessment_candidates(
        db=db,
        assessment_id=assessment_id,
        status_filter=status_filter,
        search_query=search
    )


@router.get("/{assessment_id}/candidates/{assignment_id}/details", response_model=CandidateDetailResponse)
async def get_candidate_details(
    assessment_id: str,
    assignment_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin only: Fetches candidate drilldown including question-wise performance,
    test case execution matrix, submitted code, proctoring events timeline, and interview details.
    """
    await check_assessment_access(assessment_id, admin, db)
    details = await candidate_service.get_candidate_drilldown(
        db=db,
        assessment_id=assessment_id,
        assignment_id=assignment_id
    )
    if not details:
        raise HTTPException(status_code=404, detail="Candidate assignment record not found.")
    return details


@router.post("/{assessment_id}/candidates/reset-test")
async def reset_candidate_tests(
    assessment_id: str,
    payload: ResetCandidateTestRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin only: Resets test attempt for one or multiple candidates according to assessment rules,
    allowing re-entry and recording audit history.
    """
    await check_assessment_access(assessment_id, admin, db)
    return await candidate_service.reset_candidate_tests(
        db=db,
        assessment_id=assessment_id,
        assignment_ids=payload.assignment_ids,
        admin_id=admin.id
    )


@router.post("/{assessment_id}/candidates/extend-time")
async def extend_candidate_time(
    assessment_id: str,
    payload: ExtendTimeRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin only: Extends assessment time for candidate(s) by additional minutes.
    """
    await check_assessment_access(assessment_id, admin, db)
    return await candidate_service.extend_candidate_time(
        db=db,
        assessment_id=assessment_id,
        assignment_ids=payload.assignment_ids,
        additional_minutes=payload.additional_minutes,
        reason=payload.reason,
        admin_id=admin.id
    )


@router.post("/{assessment_id}/candidates/schedule-interview")
async def schedule_candidate_interview(
    assessment_id: str,
    payload: ScheduleInterviewRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin only: Schedules candidate interview with date, time, interviewer, and meeting link.
    """
    await check_assessment_access(assessment_id, admin, db)
    try:
        return await candidate_service.schedule_interview(
            db=db,
            assessment_id=assessment_id,
            payload=payload,
            admin_id=admin.id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{assessment_id}/candidates/status")
async def update_candidate_statuses(
    assessment_id: str,
    payload: UpdateCandidateStatusRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin only: Bulk updates review status (e.g. SHORTLISTED, REJECTED, ARCHIVED, REVIEW_PENDING).
    """
    await check_assessment_access(assessment_id, admin, db)
    return await candidate_service.update_candidate_statuses(
        db=db,
        assessment_id=assessment_id,
        assignment_ids=payload.assignment_ids,
        status=payload.status,
        notes=payload.notes,
        admin_id=admin.id
    )


@router.post("/{assessment_id}/candidates/export-reports")
async def export_candidate_reports(
    assessment_id: str,
    payload: CandidateReportExportRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin only: Exports customized CSV reports for candidates (Summary, Proctoring, Question breakdown).
    """
    await check_assessment_access(assessment_id, admin, db)
    csv_content = await candidate_service.generate_candidate_reports_csv(
        db=db,
        assessment_id=assessment_id,
        assignment_ids=payload.assignment_ids,
        report_type=payload.report_type,
        status_filter=payload.status_filter
    )
    filename = f"candidates_{payload.report_type.lower()}_{assessment_id[:8]}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
