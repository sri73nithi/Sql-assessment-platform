from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any, Optional
from datetime import datetime
import re
import uuid
from pydantic import BaseModel
from app.core.security import get_password_hash

from app.core.database import get_db
from app.models.models import (
    AssessmentAssignment, Invitation, User, Assessment, StudentSubmission, Question, CandidateAttempt, AuditLog, AssessmentQuestion
)
from app.schemas.schemas import (
    StudentAssessmentContextResponse, StudentQuestionView, TestCaseResponse,
    SaveProgressRequest, InterruptTestRequest
)
from app.services.email_service import email_service
from app.services.audit_service import audit_service
from app.services.proctoring_service import proctoring_service
from app.api.deps import get_current_admin, check_assessment_access

router = APIRouter()


@router.post("/assign")
async def assign_candidates(
    assessment_id: str,
    student_ids: List[str],
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin only: Assigns an assessment to students and sends email invitations with secure token links.
    """
    assessment = await check_assessment_access(assessment_id, admin, db)

    created_invitations = []

    for sid in student_ids:
        s_stmt = select(User).where(User.id == sid, User.role == "student")
        s_res = await db.execute(s_stmt)
        student = s_res.scalar_one_or_none()
        if not student:
            continue

        # Check existing assignment
        a_stmt = select(AssessmentAssignment).where(
            AssessmentAssignment.assessment_id == assessment_id,
            AssessmentAssignment.student_id == sid
        )
        a_res = await db.execute(a_stmt)
        assignment = a_res.scalar_one_or_none()

        if not assignment:
            assignment = AssessmentAssignment(
                assessment_id=assessment_id,
                student_id=sid
            )
            db.add(assignment)
            await db.flush()

        # Create invitation token and hash
        inv_data = await email_service.create_invitation(
            db=db,
            assignment_id=assignment.id,
            student_id=sid,
            assessment_id=assessment_id,
            expiry_hours=72
        )

        # Send invitation email
        await email_service.send_invitation_email(
            candidate_name=student.full_name,
            candidate_email=student.email,
            assessment_title=assessment.title,
            duration_minutes=assessment.duration_minutes,
            start_date=assessment.start_date,
            end_date=assessment.end_date,
            timezone=assessment.timezone,
            invitation_link=inv_data["invitation_link"]
        )

        created_invitations.append({
            "student_id": sid,
            "student_email": student.email,
            "invitation_link": inv_data["invitation_link"]
        })

        await audit_service.log_action(
            db=db,
            actor_id=admin.id,
            action="ASSESSMENT_ASSIGNED",
            entity_type="AssessmentAssignment",
            entity_id=assignment.id,
            details_json={"student_email": student.email, "assessment_title": assessment.title}
        )

    return {"detail": f"Successfully assigned assessment to {len(created_invitations)} candidates.", "invitations": created_invitations}
 
 
class BulkAssignRequest(BaseModel):
    assessment_id: str
    emails: List[str]


EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@router.post("/assign-bulk")
async def bulk_assign_candidates(
    payload: BulkAssignRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin only: Bulk assigns candidates to an assessment via email list (manual input or CSV).
    - Validates email formats and deduplicates
    - Automatically creates student user accounts if they do not yet exist
    - Creates AssessmentAssignment and Invitation records
    - Dispatches secure invitation links
    - Returns structured summary of sent, skipped, and failed invitations
    """
    assessment = await check_assessment_access(payload.assessment_id, admin, db)

    total_requested = len(payload.emails)
    seen_emails = set()
    valid_emails = []
    skipped_duplicates = []
    skipped_invalid = []
    failed_emails = []
    sent_emails = []

    for raw_email in payload.emails:
        clean_email = (raw_email or "").strip().lower()
        if not clean_email or not EMAIL_REGEX.match(clean_email):
            skipped_invalid.append(raw_email)
            continue
        if clean_email in seen_emails:
            skipped_duplicates.append(clean_email)
            continue
        seen_emails.add(clean_email)
        valid_emails.append(clean_email)

    for email in valid_emails:
        try:
            # 1. Find or create student User
            s_stmt = select(User).where(User.email == email)
            s_res = await db.execute(s_stmt)
            student = s_res.scalar_one_or_none()

            if not student:
                name_part = email.split("@")[0].replace(".", " ").replace("_", " ").title()
                student = User(
                    email=email,
                    full_name=name_part,
                    password_hash=get_password_hash("Candidate@123"),
                    role="student",
                    student_id_code=f"STU-{uuid.uuid4().hex[:6].upper()}",
                    is_active=True
                )
                db.add(student)
                await db.flush()

            # 2. Find or create AssessmentAssignment
            a_stmt = select(AssessmentAssignment).where(
                AssessmentAssignment.assessment_id == payload.assessment_id,
                AssessmentAssignment.student_id == student.id
            )
            a_res = await db.execute(a_stmt)
            assignment = a_res.scalar_one_or_none()

            if not assignment:
                assignment = AssessmentAssignment(
                    assessment_id=payload.assessment_id,
                    student_id=student.id,
                    status="INVITED"
                )
                db.add(assignment)
                await db.flush()

            # 3. Create or update Invitation token
            inv_data = await email_service.create_invitation(
                db=db,
                assignment_id=assignment.id,
                student_id=student.id,
                assessment_id=payload.assessment_id,
                expiry_hours=72
            )

            # 4. Dispatch invitation email
            await email_service.send_invitation_email(
                candidate_name=student.full_name,
                candidate_email=student.email,
                assessment_title=assessment.title,
                duration_minutes=assessment.duration_minutes,
                start_date=assessment.start_date,
                end_date=assessment.end_date,
                timezone=assessment.timezone,
                invitation_link=inv_data["invitation_link"]
            )

            # 5. Audit log
            await audit_service.log_action(
                db=db,
                actor_id=admin.id,
                action="ASSESSMENT_ASSIGNED",
                entity_type="AssessmentAssignment",
                entity_id=assignment.id,
                details_json={"student_email": student.email, "assessment_title": assessment.title}
            )

            sent_emails.append(email)
        except Exception as ex:
            failed_emails.append({"email": email, "reason": str(ex)})

    return {
        "success": len(failed_emails) == 0,
        "total_requested": total_requested,
        "sent_count": len(sent_emails),
        "skipped_duplicates_count": len(skipped_duplicates),
        "skipped_invalid_count": len(skipped_invalid),
        "failed_count": len(failed_emails),
        "sent_emails": sent_emails,
        "failed_emails": failed_emails,
        "skipped_duplicates": skipped_duplicates,
        "skipped_invalid": skipped_invalid
    }



@router.get("/validate-token")
@router.get("/validate/{token}")
@router.get("/access/{token}")
async def validate_student_token(
    request: Request,
    token: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Student access endpoint: Validates secure invitation token and returns assessment context.
    STRICT SECURITY: Excludes reference_sql, hidden test cases, editorial, solutions.
    Enforces IP/Geo whitelist if configured. Restores candidate progress and attempt state.
    """
    invitation = await email_service.validate_token(db, token)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or revoked assessment token."
        )

    # Update invitation status to OPENED / STARTED
    if invitation.status in ["PENDING", "SENT"]:
        invitation.status = "OPENED"
        await db.commit()

    # Load assessment with questions
    a_stmt = select(Assessment).where(Assessment.id == invitation.assessment_id).options(
        selectinload(Assessment.question_links).selectinload(AssessmentQuestion.question).selectinload(Question.test_cases)
    )
    a_res = await db.execute(a_stmt)
    assessment = a_res.scalar_one_or_none()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assigned assessment not found")

    # Enforce IP restriction
    proctoring_cfg = assessment.proctoring_config_json or {
        "fullscreen_required": True,
        "tab_switch_detection": True,
        "max_tab_violations": 3,
        "copy_paste_restricted": True,
        "webcam_proctoring": True,
        "audio_proctoring": False,
        "plagiarism_detection": True,
        "similarity_threshold": 80.0,
        "external_similarity_check": False,
        "ip_restriction_enabled": False,
        "allowed_ips": [],
        "geo_fencing_enabled": False,
        "allowed_countries": []
    }

    if proctoring_cfg.get("ip_restriction_enabled", False):
        client_ip = request.client.host if request and request.client else "127.0.0.1"
        allowed_ips = proctoring_cfg.get("allowed_ips", [])
        if not proctoring_service.validate_client_ip(client_ip, allowed_ips):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted: Candidate IP address ({client_ip}) is not permitted for this assessment."
            )

    # Load candidate and advanced settings
    cand_cfg = assessment.candidate_settings_json or {
        "start_end_window_enforced": False,
        "allow_resume_unfinished": True,
        "max_attempts": 1,
        "allow_free_navigation": True,
        "allow_revisit_previous": True,
        "allow_unanswered_submission": True,
        "time_expired_action": "AUTO_SUBMIT",
        "show_score_immediately": True,
        "show_incorrect_questions": True
    }
    adv_cfg = assessment.advanced_settings_json or {
        "assessment_enabled": True,
        "run_code_enabled": True,
        "submit_code_enabled": True,
        "custom_input_enabled": True,
        "allowed_languages": ["sql", "python"],
        "max_submission_attempts": 10
    }

    # 1. Enforce assessment enabled
    if not adv_cfg.get("assessment_enabled", True) or assessment.status == "ARCHIVED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This assessment is currently disabled or closed by the administrator."
        )

    # 2. Enforce start/end window if configured
    now = datetime.utcnow()
    if cand_cfg.get("start_end_window_enforced", False):
        if assessment.start_date and now < assessment.start_date:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Assessment has not opened yet. Access window starts on {assessment.start_date.strftime('%Y-%m-%d %H:%M UTC')}."
            )
        if assessment.end_date and now > assessment.end_date:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Assessment access window closed on {assessment.end_date.strftime('%Y-%m-%d %H:%M UTC')}."
            )

    # 3. Load assignment and check status
    stmt_asgn = (
        select(AssessmentAssignment)
        .where(AssessmentAssignment.id == invitation.assignment_id)
        .options(selectinload(AssessmentAssignment.attempts))
    )
    res_asgn = await db.execute(stmt_asgn)
    assignment = res_asgn.scalar_one_or_none()

    if not assignment:
        raise HTTPException(status_code=404, detail="Candidate assignment record not found.")

    asgn_status = (assignment.status or "INVITED").upper()

    if asgn_status == "ACCESS_DISABLED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your assessment access has been disabled by the administrator."
        )
    if asgn_status == "EXPIRED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your assessment invitation or session has expired."
        )
    if asgn_status == "COMPLETED" and not cand_cfg.get("allow_resume_unfinished", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You have already submitted this assessment and multiple attempts are not permitted."
        )

    # Load student info
    u_stmt = select(User).where(User.id == invitation.student_id)
    u_res = await db.execute(u_stmt)
    student = u_res.scalar_one_or_none()

    # Prepare student question view (STRICT: excluding reference_sql, hidden test cases, correct answers)
    student_questions = []
    for link in assessment.question_links:
        q = link.question
        public_tcs = [
            TestCaseResponse.from_orm(tc) for tc in q.test_cases if tc.test_type == "PUBLIC"
        ]
        q_view = StudentQuestionView(
            id=q.id,
            title=q.title,
            business_scenario=q.business_scenario or "",
            problem_statement=q.problem_statement,
            task_description=q.task_description,
            notes=q.notes,
            requirements=q.requirements,
            difficulty=q.difficulty,
            job_role=q.job_role,
            database_engine=q.database_engine,
            tables_schema_json=q.tables_schema_json or [],
            schema_ddl=q.schema_ddl or "",
            seed_data_sql=q.seed_data_sql or "",
            marks=q.marks,
            question_type=q.question_type or "SQL_TECHNICAL",
            mcq_options_json=q.mcq_options_json,
            code_language=q.code_language or "sql",
            function_signature=q.function_signature,
            input_format=q.input_format,
            output_format=q.output_format,
            output_columns_json=getattr(q, "output_columns_json", None),
            constraints=q.constraints,
            example_input_json=q.example_input_json,
            example_output_json=q.example_output_json,
            example_explanation=q.example_explanation,
            supported_databases_json=q.supported_databases_json or ["PostgreSQL", "MySQL", "SQLite"],
            tags_json=q.tags_json or [],
            public_test_cases=public_tcs
        )
        student_questions.append(q_view)

    # Effective duration calculation
    time_extension = assignment.time_extension_minutes or 0
    effective_duration = assessment.duration_minutes + time_extension

    # Load or initialize CandidateAttempt
    attempts = assignment.attempts or []
    active_attempt = next((a for a in attempts if a.is_active), None) or (attempts[-1] if attempts else None)

    if not active_attempt:
        active_attempt = CandidateAttempt(
            assignment=assignment,
            student_id=invitation.student_id,
            assessment_id=invitation.assessment_id,
            attempt_number=1,
            status="IN_PROGRESS",
            started_at=datetime.utcnow(),
            time_spent_seconds=0,
            time_remaining_seconds=effective_duration * 60,
            time_limit_minutes=effective_duration,
            is_active=True
        )
        db.add(active_attempt)
    else:
        if active_attempt.status in ["RETAKE_ENABLED", "NOT_STARTED"]:
            active_attempt.status = "IN_PROGRESS"
            if not active_attempt.started_at:
                active_attempt.started_at = datetime.utcnow()

    # If assignment was RETAKE_ENABLED or INVITED, transition to IN_PROGRESS
    if assignment.status in ["RETAKE_ENABLED", "INVITED"]:
        assignment.status = "IN_PROGRESS"
        if not assignment.started_at:
            assignment.started_at = datetime.utcnow()

    await db.commit()

    saved_prog = active_attempt.questions_progress_json if active_attempt else None
    remaining_seconds = (
        active_attempt.time_remaining_seconds
        if (active_attempt and active_attempt.time_remaining_seconds is not None and active_attempt.time_remaining_seconds > 0)
        else (effective_duration * 60)
    )

    return {
        "assessment": {
            "id": assessment.id,
            "title": assessment.title,
            "description": assessment.description,
            "job_role": assessment.job_role,
            "duration_minutes": effective_duration,
            "base_duration_minutes": assessment.duration_minutes,
            "time_extension_minutes": time_extension,
            "start_date": assessment.start_date,
            "end_date": assessment.end_date,
            "timezone": assessment.timezone,
            "status": assessment.status,
            "proctoring_config": proctoring_cfg,
            "candidate_settings": cand_cfg,
            "advanced_settings": adv_cfg
        },
        "student": {
            "id": student.id if student else "",
            "email": student.email if student else "",
            "full_name": student.full_name if student else "Candidate",
            "student_id_code": student.student_id_code if student else None,
            "role": student.role if student else "student"
        },
        "assignment_id": invitation.assignment_id,
        "invitation_status": invitation.status,
        "candidate_status": assignment.status if assignment else "INVITED",
        "active_attempt_number": active_attempt.attempt_number if active_attempt else 1,
        "saved_progress": saved_prog,
        "time_remaining_seconds": remaining_seconds,
        "questions": student_questions
    }


@router.post("/save-progress/{token}")
async def save_student_progress(
    token: str,
    payload: SaveProgressRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Candidate autosave endpoint: Periodically preserves candidate drafts and time remaining.
    Work is saved continuously so candidates never lose code on disconnect or browser crash.
    """
    invitation = await email_service.validate_token(db, token)
    if not invitation:
        raise HTTPException(status_code=401, detail="Invalid assessment token.")

    stmt = (
        select(AssessmentAssignment)
        .where(AssessmentAssignment.id == invitation.assignment_id)
        .options(selectinload(AssessmentAssignment.attempts))
    )
    res = await db.execute(stmt)
    assignment = res.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    attempts = assignment.attempts or []
    active_attempt = next((a for a in attempts if a.is_active), None) or (attempts[-1] if attempts else None)
    if not active_attempt:
        active_attempt = CandidateAttempt(
            assignment_id=assignment.id,
            student_id=invitation.student_id,
            assessment_id=invitation.assessment_id,
            attempt_number=1,
            status="IN_PROGRESS",
            started_at=datetime.utcnow(),
            is_active=True
        )
        db.add(active_attempt)

    # Save progress JSON
    existing_prog = active_attempt.questions_progress_json or {}
    new_prog = {
        "active_question_id": payload.active_question_id or existing_prog.get("active_question_id"),
        "drafts": payload.drafts if payload.drafts is not None else existing_prog.get("drafts", {})
    }
    active_attempt.questions_progress_json = new_prog

    if payload.time_remaining_seconds is not None:
        active_attempt.time_remaining_seconds = payload.time_remaining_seconds
        if active_attempt.time_limit_minutes:
            total_sec = active_attempt.time_limit_minutes * 60
            active_attempt.time_spent_seconds = max(0, total_sec - payload.time_remaining_seconds)

    if payload.drafts:
        attempted_cnt = sum(1 for d in payload.drafts.values() if isinstance(d, dict) and d.get("code") and d.get("code").strip())
        active_attempt.attempted_questions_count = max(active_attempt.attempted_questions_count or 0, attempted_cnt)

    await db.commit()
    return {"success": True, "saved_at": datetime.utcnow().isoformat()}


@router.post("/interrupt/{token}")
async def mark_student_attempt_interrupted(
    token: str,
    payload: Optional[InterruptTestRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Called when candidate leaves the test unexpectedly (browser closed, tab unloaded, or network loss).
    Marks attempt as INTERRUPTED, saves latest draft, and records audit event.
    """
    invitation = await email_service.validate_token(db, token)
    if not invitation:
        raise HTTPException(status_code=401, detail="Invalid assessment token.")

    stmt = (
        select(AssessmentAssignment)
        .where(AssessmentAssignment.id == invitation.assignment_id)
        .options(selectinload(AssessmentAssignment.attempts), selectinload(AssessmentAssignment.student))
    )
    res = await db.execute(stmt)
    assignment = res.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    attempts = assignment.attempts or []
    active_attempt = next((a for a in attempts if a.is_active), None) or (attempts[-1] if attempts else None)
    if active_attempt:
        active_attempt.status = "INTERRUPTED"
        if payload and payload.drafts is not None:
            existing_prog = active_attempt.questions_progress_json or {}
            active_attempt.questions_progress_json = {
                "active_question_id": existing_prog.get("active_question_id"),
                "drafts": payload.drafts
            }
        if payload and payload.time_remaining_seconds is not None:
            active_attempt.time_remaining_seconds = payload.time_remaining_seconds
            if active_attempt.time_limit_minutes:
                total_sec = active_attempt.time_limit_minutes * 60
                active_attempt.time_spent_seconds = max(0, total_sec - payload.time_remaining_seconds)

    assignment.status = "INTERRUPTED"

    db.add(AuditLog(
        actor_id=assignment.student_id,
        action="CANDIDATE_ATTEMPT_INTERRUPTED",
        entity_type="AssessmentAssignment",
        entity_id=assignment.id,
        details_json={
            "reason": payload.reason if payload else "Interrupted / Browser Closed",
            "candidate_name": assignment.student.full_name if assignment.student else "",
            "attempt_number": active_attempt.attempt_number if active_attempt else 1
        }
    ))

    await db.commit()
    return {
        "success": True,
        "status": "INTERRUPTED",
        "message": "Assessment attempt safely preserved and marked as Interrupted."
    }
