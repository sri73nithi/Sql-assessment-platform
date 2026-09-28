from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.models import Assessment, Question, AssessmentQuestion, User, AssessmentAdmin
from app.schemas.schemas import (
    AssessmentCreate,
    AssessmentResponse,
    AssessmentUpdate,
    AssessmentQuestionLink,
    AssessmentAdminResponse,
    AddAssessmentAdminRequest,
    SetPointOfContactRequest,
    AdminDirectoryUser,
    StudentQuestionView,
    TestCaseResponse,
    RunCodeRequest,
    RunCodeResponse,
    TestCaseRunResult,
    SubmitCodeRequest,
    SubmitCodeResponse
)
from app.services.audit_service import audit_service
from app.api.deps import get_current_admin, get_current_user, check_assessment_access

router = APIRouter()


async def build_assessment_response(ass: Assessment, db: AsyncSession) -> AssessmentResponse:
    # 1. Fetch questions
    questions = [link.question for link in ass.question_links] if ass.question_links else []

    # 2. Fetch assessment_admins
    stmt_admins = (
        select(AssessmentAdmin)
        .where(AssessmentAdmin.assessment_id == ass.id)
        .options(selectinload(AssessmentAdmin.user))
        .order_by(AssessmentAdmin.created_at.asc())
    )
    res_admins = await db.execute(stmt_admins)
    admin_records = res_admins.scalars().all()

    # 3. Fetch POC details
    poc_user = None
    if ass.point_of_contact_id:
        poc_stmt = select(User).where(User.id == ass.point_of_contact_id)
        poc_res = await db.execute(poc_stmt)
        poc_user = poc_res.scalar_one_or_none()

    admin_items: List[AssessmentAdminResponse] = []
    seen_user_ids = set()

    # Include creator if exists
    if ass.created_by:
        creator_stmt = select(User).where(User.id == ass.created_by)
        creator_res = await db.execute(creator_stmt)
        creator_user = creator_res.scalar_one_or_none()
        if creator_user:
            seen_user_ids.add(creator_user.id)
            is_poc = (ass.point_of_contact_id == creator_user.id) or (ass.point_of_contact_id is None and len(admin_records) == 0)
            admin_items.append(AssessmentAdminResponse(
                id=f"creator-{creator_user.id}",
                user_id=creator_user.id,
                name=creator_user.full_name,
                email=creator_user.email,
                role="All access",
                is_poc=is_poc,
                created_at=ass.created_at
            ))

    # Include assigned AssessmentAdmin records
    for rec in admin_records:
        if rec.user and rec.user_id not in seen_user_ids:
            seen_user_ids.add(rec.user_id)
            is_poc = (ass.point_of_contact_id == rec.user_id)
            admin_items.append(AssessmentAdminResponse(
                id=rec.id,
                user_id=rec.user.id,
                name=rec.user.full_name,
                email=rec.user.email,
                role=rec.role or "All access",
                is_poc=is_poc,
                created_at=rec.created_at
            ))

    # If no POC is flagged yet but we have admins, flag the designated or first one
    has_poc = any(item.is_poc for item in admin_items)
    if not has_poc and admin_items:
        admin_items[0].is_poc = True

    active_poc_item = next((item for item in admin_items if item.is_poc), admin_items[0] if admin_items else None)
    poc_name = poc_user.full_name if poc_user else (active_poc_item.name if active_poc_item else None)
    poc_email = poc_user.email if poc_user else (active_poc_item.email if active_poc_item else None)
    poc_id = poc_user.id if poc_user else (active_poc_item.user_id if active_poc_item else None)

    return AssessmentResponse(
        id=ass.id,
        title=ass.title,
        description=ass.description,
        job_role=ass.job_role,
        duration_minutes=ass.duration_minutes,
        start_date=ass.start_date,
        end_date=ass.end_date,
        timezone=ass.timezone,
        status=ass.status,
        created_by=ass.created_by,
        point_of_contact_id=poc_id,
        point_of_contact_name=poc_name,
        point_of_contact_email=poc_email,
        proctoring_config_json=ass.proctoring_config_json,
        candidate_settings_json=ass.candidate_settings_json,
        email_reports_settings_json=ass.email_reports_settings_json,
        advanced_settings_json=ass.advanced_settings_json,
        email_templates_json=ass.email_templates_json,
        created_at=ass.created_at,
        updated_at=ass.updated_at,
        questions=questions,
        admins=admin_items
    )


@router.get("/admin-directory/users", response_model=List[AdminDirectoryUser])
async def list_admin_directory_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Returns list of all active platform administrators for selection in assessment admin assignment.
    """
    stmt = select(User).where(User.role == "admin", User.is_active == True).order_by(User.full_name.asc())
    res = await db.execute(stmt)
    users = res.scalars().all()
    return users


@router.get("", response_model=List[AssessmentResponse])
async def list_assessments(
    status_filter: str = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    stmt = select(Assessment).options(
        selectinload(Assessment.question_links).selectinload(AssessmentQuestion.question).selectinload(Question.test_cases)
    )

    # If not global superadmin, restrict to assessments created by or assigned to current admin
    if admin.email != "admin@assessment.com":
        subquery_assigned = select(AssessmentAdmin.assessment_id).where(AssessmentAdmin.user_id == admin.id)
        stmt = stmt.where(
            (Assessment.created_by == admin.id) | (Assessment.id.in_(subquery_assigned))
        )

    if status_filter:
        stmt = stmt.where(Assessment.status == status_filter.upper())

    stmt = stmt.order_by(Assessment.created_at.desc())
    res = await db.execute(stmt)
    assessments = res.scalars().all()

    response_items = []
    for ass in assessments:
        resp = await build_assessment_response(ass, db)
        response_items.append(resp)
    return response_items


@router.get("/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    await check_assessment_access(assessment_id, admin, db)
    stmt = select(Assessment).where(Assessment.id == assessment_id).options(
        selectinload(Assessment.question_links).selectinload(AssessmentQuestion.question).selectinload(Question.test_cases)
    )
    res = await db.execute(stmt)
    ass = res.scalar_one_or_none()
    if not ass:
        raise HTTPException(status_code=404, detail="Assessment not found")

    return await build_assessment_response(ass, db)


@router.get("/{assessment_id}/admins", response_model=List[AssessmentAdminResponse])
async def get_assessment_admins(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Returns list of all administrators assigned to this assessment with POC flags.
    """
    await check_assessment_access(assessment_id, admin, db)
    stmt = select(Assessment).where(Assessment.id == assessment_id).options(
        selectinload(Assessment.question_links).selectinload(AssessmentQuestion.question).selectinload(Question.test_cases)
    )
    res = await db.execute(stmt)
    ass = res.scalar_one_or_none()
    if not ass:
        raise HTTPException(status_code=404, detail="Assessment not found")

    full_resp = await build_assessment_response(ass, db)
    return full_resp.admins


@router.post("/{assessment_id}/admins", response_model=AssessmentResponse)
async def add_assessment_admin(
    assessment_id: str,
    payload: AddAssessmentAdminRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Adds a test admin to the assessment.
    If the admin user does not already exist in the database, automatically creates a new admin account.
    Prevents duplicates if the user is already assigned to the assessment.
    """
    ass = await check_assessment_access(assessment_id, admin, db)

    # 1. Resolve user by user_id or email
    user = None
    if payload.user_id:
        u_res = await db.execute(select(User).where(User.id == payload.user_id))
        user = u_res.scalar_one_or_none()

    if not user and payload.email:
        u_res = await db.execute(select(User).where(User.email == payload.email.strip().lower()))
        user = u_res.scalar_one_or_none()

    if not user:
        # Create new admin user account
        user_name = payload.name.strip() if payload.name and payload.name.strip() else payload.email.split('@')[0].capitalize()
        user = User(
            email=payload.email.strip().lower(),
            full_name=user_name,
            password_hash=get_password_hash("admin123"),
            role="admin",
            is_active=True
        )
        db.add(user)
        await db.flush()
    else:
        # Ensure user has admin role
        if user.role != "admin":
            user.role = "admin"
        if payload.name and payload.name.strip() and user.full_name == user.email.split('@')[0]:
            user.full_name = payload.name.strip()

    # 2. Check for duplicate assignment
    is_creator = (ass.created_by == user.id)
    dup_stmt = select(AssessmentAdmin).where(
        AssessmentAdmin.assessment_id == assessment_id,
        AssessmentAdmin.user_id == user.id
    )
    dup_res = await db.execute(dup_stmt)
    existing_link = dup_res.scalar_one_or_none()

    if is_creator or existing_link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Admin with email '{user.email}' is already added to this assessment."
        )

    # 3. Create AssessmentAdmin link
    admin_link = AssessmentAdmin(
        assessment_id=assessment_id,
        user_id=user.id,
        role=payload.role or "All access"
    )
    db.add(admin_link)

    # If assessment has no point of contact, assign this new admin or creator
    if not ass.point_of_contact_id:
        ass.point_of_contact_id = user.id

    await db.commit()

    await audit_service.log_action(
        db=db,
        actor_id=admin.id,
        action="ASSESSMENT_ADMIN_ADDED",
        entity_type="AssessmentAdmin",
        entity_id=admin_link.id,
        details_json={"assessment_id": assessment_id, "admin_email": user.email, "role": admin_link.role}
    )

    # Re-fetch assessment with relationships loaded
    stmt_full = select(Assessment).where(Assessment.id == assessment_id).options(
        selectinload(Assessment.question_links).selectinload(AssessmentQuestion.question).selectinload(Question.test_cases)
    )
    res_full = await db.execute(stmt_full)
    updated_ass = res_full.scalar_one_or_none()

    return await build_assessment_response(updated_ass, db)


@router.delete("/{assessment_id}/admins/{user_id}", response_model=AssessmentResponse)
async def remove_assessment_admin(
    assessment_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Removes an administrator's permissions from this assessment.
    Revokes their management access immediately.
    Updates Point of Contact if the removed admin was currently designated as POC.
    """
    ass = await check_assessment_access(assessment_id, admin, db)

    # Find the link
    stmt = select(AssessmentAdmin).where(
        AssessmentAdmin.assessment_id == assessment_id,
        AssessmentAdmin.user_id == user_id
    )
    res = await db.execute(stmt)
    admin_link = res.scalar_one_or_none()

    if not admin_link:
        if ass.created_by == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the assessment creator/owner from this assessment."
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin is not assigned to this assessment."
        )

    # Delete the admin link
    await db.delete(admin_link)
    await db.flush()

    # If removed admin was Point of Contact, reassign POC
    if ass.point_of_contact_id == user_id:
        next_stmt = select(AssessmentAdmin).where(
            AssessmentAdmin.assessment_id == assessment_id,
            AssessmentAdmin.user_id != user_id
        )
        next_res = await db.execute(next_stmt)
        next_admin = next_res.scalars().first()
        if next_admin:
            ass.point_of_contact_id = next_admin.user_id
        elif ass.created_by:
            ass.point_of_contact_id = ass.created_by
        else:
            ass.point_of_contact_id = None

    await db.commit()

    await audit_service.log_action(
        db=db,
        actor_id=admin.id,
        action="ASSESSMENT_ADMIN_REMOVED",
        entity_type="AssessmentAdmin",
        entity_id=admin_link.id,
        details_json={"assessment_id": assessment_id, "removed_user_id": user_id}
    )

    stmt_full = select(Assessment).where(Assessment.id == assessment_id).options(
        selectinload(Assessment.question_links).selectinload(AssessmentQuestion.question).selectinload(Question.test_cases)
    )
    res_full = await db.execute(stmt_full)
    updated_ass = res_full.scalar_one_or_none()

    return await build_assessment_response(updated_ass, db)


@router.put("/{assessment_id}/point-of-contact", response_model=AssessmentResponse)
async def update_assessment_point_of_contact(
    assessment_id: str,
    payload: SetPointOfContactRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Updates the primary Point of Contact (POC) for the assessment and persists the selection.
    """
    ass = await check_assessment_access(assessment_id, admin, db)

    # Resolve target user
    target_user = None
    if payload.user_id:
        u_res = await db.execute(select(User).where(User.id == payload.user_id))
        target_user = u_res.scalar_one_or_none()

    if not target_user and payload.email:
        u_res = await db.execute(select(User).where(User.email == payload.email.strip().lower()))
        target_user = u_res.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specified user account not found."
        )

    # Validate that target user is an admin of this assessment
    is_creator = (ass.created_by == target_user.id)
    admin_link_stmt = select(AssessmentAdmin).where(
        AssessmentAdmin.assessment_id == assessment_id,
        AssessmentAdmin.user_id == target_user.id
    )
    admin_link_res = await db.execute(admin_link_stmt)
    is_assigned_admin = admin_link_res.scalar_one_or_none() is not None

    if not is_creator and not is_assigned_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User '{target_user.full_name}' ({target_user.email}) must be added as a test admin before being set as Point of Contact."
        )

    ass.point_of_contact_id = target_user.id
    ass.updated_at = datetime.utcnow()
    await db.commit()

    await audit_service.log_action(
        db=db,
        actor_id=admin.id,
        action="ASSESSMENT_POC_UPDATED",
        entity_type="Assessment",
        entity_id=ass.id,
        details_json={"point_of_contact_id": target_user.id, "point_of_contact_email": target_user.email}
    )

    stmt_full = select(Assessment).where(Assessment.id == assessment_id).options(
        selectinload(Assessment.question_links).selectinload(AssessmentQuestion.question).selectinload(Question.test_cases)
    )
    res_full = await db.execute(stmt_full)
    updated_ass = res_full.scalar_one_or_none()

    return await build_assessment_response(updated_ass, db)


@router.post("", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    payload: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    ass = Assessment(
        title=payload.title,
        description=payload.description,
        job_role=payload.job_role,
        duration_minutes=payload.duration_minutes,
        start_date=payload.start_date,
        end_date=payload.end_date,
        timezone=payload.timezone,
        status="DRAFT",
        created_by=admin.id,
        point_of_contact_id=admin.id
    )
    db.add(ass)
    await db.flush()

    for link in payload.questions:
        aq = AssessmentQuestion(
            assessment_id=ass.id,
            question_id=link.question_id,
            marks=link.marks,
            sort_order=link.sort_order
        )
        db.add(aq)

    await db.commit()
    await db.refresh(ass)

    await audit_service.log_action(
        db=db,
        actor_id=admin.id,
        action="ASSESSMENT_CREATED",
        entity_type="Assessment",
        entity_id=ass.id,
        details_json={"title": ass.title}
    )

    return await get_assessment(ass.id, db, admin)


@router.put("/{assessment_id}", response_model=AssessmentResponse)
async def update_assessment(
    assessment_id: str,
    payload: AssessmentUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    ass = await check_assessment_access(assessment_id, admin, db)

    if payload.title is not None:
        ass.title = payload.title
    if payload.description is not None:
        ass.description = payload.description
    if payload.job_role is not None:
        ass.job_role = payload.job_role
    if payload.duration_minutes is not None:
        ass.duration_minutes = payload.duration_minutes
    if payload.start_date is not None:
        ass.start_date = payload.start_date
    if payload.end_date is not None:
        ass.end_date = payload.end_date
    if payload.timezone is not None:
        ass.timezone = payload.timezone
    if payload.status is not None:
        ass.status = payload.status.upper()

    if payload.questions is not None:
        # Clear existing question links
        stmt_del = select(AssessmentQuestion).where(AssessmentQuestion.assessment_id == assessment_id)
        res_del = await db.execute(stmt_del)
        for old_link in res_del.scalars().all():
            await db.delete(old_link)
        await db.flush()

        # Insert new question links
        for link in payload.questions:
            aq = AssessmentQuestion(
                assessment_id=ass.id,
                question_id=link.question_id,
                marks=link.marks,
                sort_order=link.sort_order
            )
            db.add(aq)

    await db.commit()
    return await get_assessment(ass.id, db, admin)


@router.put("/{assessment_id}/publish", response_model=AssessmentResponse)
async def publish_assessment(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    await check_assessment_access(assessment_id, admin, db)
    stmt = select(Assessment).where(Assessment.id == assessment_id).options(
        selectinload(Assessment.question_links).selectinload(AssessmentQuestion.question).selectinload(Question.test_cases)
    )
    res = await db.execute(stmt)
    ass = res.scalar_one_or_none()
    if not ass:
        raise HTTPException(status_code=404, detail="Assessment not found")

    questions = [link.question for link in ass.question_links]
    if not questions:
        raise HTTPException(status_code=400, detail="Cannot publish assessment: No questions linked.")

    # Validation Safeguards
    for q in questions:
        if q.question_type != "MCQ":
            if not q.reference_sql and not getattr(q, "reference_solution", None):
                raise HTTPException(status_code=400, detail=f"Publish safeguard failed: Question '{q.title}' lacks reference solution.")
            if not q.test_cases:
                raise HTTPException(status_code=400, detail=f"Publish safeguard failed: Question '{q.title}' has no test cases configured.")
        else:
            if not q.correct_answer:
                raise HTTPException(status_code=400, detail=f"Publish safeguard failed: MCQ '{q.title}' has no correct answer set.")

    ass.status = "PUBLISHED"
    await db.commit()

    await audit_service.log_action(
        db=db,
        actor_id=admin.id,
        action="ASSESSMENT_PUBLISHED",
        entity_type="Assessment",
        entity_id=ass.id,
        details_json={"title": ass.title}
    )

    return await get_assessment(ass.id, db, admin)


@router.put("/{assessment_id}/archive", response_model=AssessmentResponse)
async def archive_assessment(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    ass = await check_assessment_access(assessment_id, admin, db)

    ass.status = "ARCHIVED"
    await db.commit()

    await audit_service.log_action(
        db=db,
        actor_id=admin.id,
        action="ASSESSMENT_ARCHIVED",
        entity_type="Assessment",
        entity_id=ass.id,
        details_json={"title": ass.title}
    )

    return await get_assessment(ass.id, db, admin)


@router.post("/{assessment_id}/questions", response_model=AssessmentResponse)
async def link_question_to_assessment(
    assessment_id: str,
    payload: AssessmentQuestionLink,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    ass = await check_assessment_access(assessment_id, admin, db)

    # Check if already linked
    link_stmt = select(AssessmentQuestion).where(
        AssessmentQuestion.assessment_id == assessment_id,
        AssessmentQuestion.question_id == payload.question_id
    )
    link_res = await db.execute(link_stmt)
    existing = link_res.scalar_one_or_none()

    if not existing:
        aq = AssessmentQuestion(
            assessment_id=assessment_id,
            question_id=payload.question_id,
            marks=payload.marks or 10,
            sort_order=payload.sort_order or 1
        )
        db.add(aq)
        await db.commit()

    return await get_assessment(ass.id, db, admin)


@router.delete("/{assessment_id}/questions/{question_id}", response_model=AssessmentResponse)
async def unlink_question_from_assessment(
    assessment_id: str,
    question_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    await check_assessment_access(assessment_id, admin, db)

    stmt = select(AssessmentQuestion).where(
        AssessmentQuestion.assessment_id == assessment_id,
        AssessmentQuestion.question_id == question_id
    )
    res = await db.execute(stmt)
    link = res.scalar_one_or_none()
    if link:
        await db.delete(link)
        await db.commit()

    return await get_assessment(assessment_id, db, admin)


@router.put("/{assessment_id}/settings", response_model=AssessmentResponse)
async def update_assessment_settings(
    assessment_id: str,
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    ass = await check_assessment_access(assessment_id, admin, db)

    if "title" in payload and payload["title"]:
        ass.title = payload["title"]
    if "description" in payload:
        ass.description = payload["description"]
    if "duration_minutes" in payload and payload["duration_minutes"] is not None:
        ass.duration_minutes = int(payload["duration_minutes"])
    if "job_role" in payload and payload["job_role"]:
        ass.job_role = payload["job_role"]
    if "status" in payload and payload["status"]:
        ass.status = payload["status"]
    if "timezone" in payload and payload["timezone"]:
        ass.timezone = payload["timezone"]
    if "start_date" in payload and payload["start_date"]:
        try:
            ass.start_date = datetime.fromisoformat(str(payload["start_date"]).replace('Z', ''))
        except Exception:
            pass
    if "end_date" in payload and payload["end_date"]:
        try:
            ass.end_date = datetime.fromisoformat(str(payload["end_date"]).replace('Z', ''))
        except Exception:
            pass

    # Proctoring Settings
    if "proctoring_config" in payload:
        ass.proctoring_config_json = payload["proctoring_config"]
    elif "proctoring_config_json" in payload:
        ass.proctoring_config_json = payload["proctoring_config_json"]

    # Candidate Settings
    if "candidate_settings" in payload:
        ass.candidate_settings_json = payload["candidate_settings"]
    elif "candidate_settings_json" in payload:
        ass.candidate_settings_json = payload["candidate_settings_json"]

    # Email & Reports Settings
    if "email_reports_settings" in payload:
        ass.email_reports_settings_json = payload["email_reports_settings"]
    elif "email_reports_settings_json" in payload:
        ass.email_reports_settings_json = payload["email_reports_settings_json"]

    # Advanced Settings
    if "advanced_settings" in payload:
        ass.advanced_settings_json = payload["advanced_settings"]
    elif "advanced_settings_json" in payload:
        ass.advanced_settings_json = payload["advanced_settings_json"]

    # Email Templates
    if "email_templates" in payload:
        ass.email_templates_json = payload["email_templates"]
    elif "email_templates_json" in payload:
        ass.email_templates_json = payload["email_templates_json"]

    ass.updated_at = datetime.utcnow()
    await db.commit()

    await audit_service.log_action(
        db=db,
        actor_id=admin.id,
        action="ASSESSMENT_SETTINGS_UPDATED",
        entity_type="Assessment",
        entity_id=ass.id,
        details_json=payload
    )

    return await get_assessment(assessment_id, db, admin)


@router.post("/{assessment_id}/send-test-email")
async def send_assessment_test_email(
    assessment_id: str,
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Sends a test email for any chosen template type using candidate/assessment placeholders.
    """
    from app.services.email_service import email_service

    ass = await check_assessment_access(assessment_id, admin, db)

    recipient = payload.get("recipient_email", admin.email or "admin@assessment.com")
    template_type = payload.get("template_type", "invitation")
    custom_template = payload.get("template_data")

    if not custom_template and ass.email_templates_json:
        custom_template = ass.email_templates_json.get(template_type)

    result = await email_service.send_test_email(
        recipient_email=recipient,
        template_type=template_type,
        assessment_title=ass.title,
        custom_template=custom_template
    )

    return result


@router.post("/{assessment_id}/reset-template")
async def reset_assessment_email_template(
    assessment_id: str,
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Restores the standard default template for a specific email type.
    """
    from app.services.email_service import email_service

    template_type = payload.get("template_type", "invitation")
    defaults = email_service.get_default_templates()
    default_tmpl = defaults.get(template_type, defaults["invitation"])

    ass = await check_assessment_access(assessment_id, admin, db)

    current_templates = ass.email_templates_json or email_service.get_default_templates()
    current_templates[template_type] = default_tmpl
    ass.email_templates_json = current_templates
    ass.updated_at = datetime.utcnow()
    await db.commit()

    return {
        "success": True,
        "template_type": template_type,
        "template": default_tmpl
    }


@router.get("/{assessment_id}/export-csv")
async def export_single_assessment_csv(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Generates and downloads a CSV export containing all candidate performance results for this specific assessment.
    """
    from fastapi import Response
    from app.services.report_service import report_service

    ass = await check_assessment_access(assessment_id, admin, db)

    csv_data = await report_service.generate_assessment_csv_report(db, assessment_id)
    filename = f"Assessment_Report_{ass.title.replace(' ', '_')}_{assessment_id[:8]}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.post("/{assessment_id}/proctoring-event")
async def record_proctoring_event(
    assessment_id: str,
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """
    Real-time student proctoring event sink.
    Logs tab switches, fullscreen exits, copy/paste attempts, face absence, and audio spikes.
    Evaluates against maximum allowed violations to trigger auto-termination if limit is exceeded.
    """
    from app.services.proctoring_service import proctoring_service
    from app.services.email_service import email_service
    from app.models.models import ProctoringEvent

    token = payload.get("token")
    student_id = payload.get("student_id")
    event_type = payload.get("event_type", "TAB_SWITCH")
    details = payload.get("details", {})
    client_ip = payload.get("client_ip")

    if token:
        invitation = await email_service.validate_token(db, token)
        if invitation:
            student_id = invitation.student_id

    if not student_id:
        raise HTTPException(status_code=400, detail="Missing valid student identity or token.")

    # Load assessment proctoring configuration
    a_stmt = select(Assessment).where(Assessment.id == assessment_id)
    a_res = await db.execute(a_stmt)
    assessment = a_res.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    proctoring_cfg = assessment.proctoring_config_json or {}
    max_violations = int(proctoring_cfg.get("max_tab_violations", 3))

    event = await proctoring_service.log_proctoring_event(
        db=db,
        assessment_id=assessment_id,
        student_id=student_id,
        event_type=event_type,
        details=details,
        ip_address=client_ip
    )

    # Count total violations for this student in this assessment
    v_stmt = select(ProctoringEvent).where(
        ProctoringEvent.assessment_id == assessment_id,
        ProctoringEvent.student_id == student_id,
        ProctoringEvent.event_type.in_(["TAB_SWITCH", "FULLSCREEN_EXIT", "COPY_PASTE"])
    )
    v_res = await db.execute(v_stmt)
    all_violations = v_res.scalars().all()
    total_violations = len(all_violations)

    terminate = total_violations >= max_violations

    return {
        "success": True,
        "event_id": event.id,
        "event_type": event_type,
        "violation_count": total_violations,
        "max_allowed_violations": max_violations,
        "terminate_assessment": terminate,
        "warning_message": (
            f"Violation {total_violations} of {max_violations} recorded. "
            + ("Assessment will be automatically terminated!" if terminate else "Please return to fullscreen immediately.")
        )
    }


@router.get("/{assessment_id}/proctoring-reports")
async def get_assessment_proctoring_reports(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Returns candidate-by-candidate integrity analysis, violation history, and plagiarism flags.
    """
    from app.models.models import ProctoringEvent, StudentSubmission, User, AssessmentAssignment

    await check_assessment_access(assessment_id, admin, db)

    # Load candidates assigned
    stmt_assign = (
        select(AssessmentAssignment)
        .where(AssessmentAssignment.assessment_id == assessment_id)
        .options(selectinload(AssessmentAssignment.student), selectinload(AssessmentAssignment.submissions))
    )
    res_assign = await db.execute(stmt_assign)
    assignments = res_assign.scalars().all()

    # Load all proctoring events for this assessment
    stmt_events = (
        select(ProctoringEvent)
        .where(ProctoringEvent.assessment_id == assessment_id)
        .order_by(ProctoringEvent.created_at.desc())
    )
    res_events = await db.execute(stmt_events)
    events = res_events.scalars().all()

    reports = []
    for ass in assignments:
        stu = ass.student
        stu_events = [e for e in events if e.student_id == stu.id]
        tab_switches = len([e for e in stu_events if e.event_type == "TAB_SWITCH"])
        fullscreen_exits = len([e for e in stu_events if e.event_type == "FULLSCREEN_EXIT"])
        copy_paste_attempts = len([e for e in stu_events if e.event_type == "COPY_PASTE"])
        webcam_flags = len([e for e in stu_events if e.event_type in ["NO_FACE", "MULTIPLE_FACES"]])
        audio_flags = len([e for e in stu_events if e.event_type == "AUDIO_SPIKE"])

        # Check plagiarism on candidate's submissions
        plagiarized_submissions = []
        for sub in ass.submissions:
            if sub.is_plagiarized or (sub.similarity_score and float(sub.similarity_score) >= 70.0):
                plagiarized_submissions.append({
                    "submission_id": sub.id,
                    "question_id": sub.question_id,
                    "similarity_score": float(sub.similarity_score),
                    "plagiarism_details": sub.plagiarism_details_json,
                    "submitted_code": sub.submitted_sql
                })

        # Calculate Integrity Score
        integrity_score = max(0, 100 - (tab_switches * 10) - (fullscreen_exits * 8) - (copy_paste_attempts * 5) - (webcam_flags * 5) - (len(plagiarized_submissions) * 25))

        reports.append({
            "student_id": stu.id,
            "student_name": stu.full_name,
            "student_email": stu.email,
            "integrity_score": integrity_score,
            "total_violations": len(stu_events),
            "breakdown": {
                "tab_switches": tab_switches,
                "fullscreen_exits": fullscreen_exits,
                "copy_paste_attempts": copy_paste_attempts,
                "webcam_flags": webcam_flags,
                "audio_flags": audio_flags
            },
            "events_log": [
                {
                    "id": e.id,
                    "event_type": e.event_type,
                    "details": e.details_json,
                    "ip_address": e.ip_address,
                    "timestamp": e.created_at.isoformat()
                }
                for e in stu_events
            ],
            "plagiarized_submissions": plagiarized_submissions
        })

    return reports


@router.get("/{assessment_id}/detailed-analytics")
async def get_assessment_detailed_analytics_api(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Returns comprehensive analytics for the assessment including:
    - Overall summary metrics (pass rate, avg score, completion time, violations, plagiarism flags)
    - Visual charts data (score distribution histogram, performance bands, pass/fail, skill performance)
    - Question-by-question analytics & test-case diagnostics
    - Candidate feedback summary ratings
    """
    from app.services.analytics_service import analytics_service

    await check_assessment_access(assessment_id, admin, db)

    data = await analytics_service.get_assessment_detailed_analytics(db, assessment_id)
    if not data:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return data


@router.get("/{assessment_id}/feedbacks")
async def get_assessment_feedbacks_api(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Returns candidate feedback list submitted by candidates for this assessment.
    """
    from app.services.analytics_service import analytics_service

    await check_assessment_access(assessment_id, admin, db)

    return await analytics_service.get_candidate_feedbacks(db, assessment_id)


@router.get("/{assessment_id}/preview")
async def get_assessment_preview(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin only: Fetches the student view of this assessment for Preview Mode.
    Strips all reference solutions, editorials, official answers, and hidden test cases.
    """
    await check_assessment_access(assessment_id, admin, db)

    stmt = (
        select(Assessment)
        .where(Assessment.id == assessment_id)
        .options(
            selectinload(Assessment.question_links).selectinload(AssessmentQuestion.question).selectinload(Question.test_cases)
        )
    )
    res = await db.execute(stmt)
    assessment = res.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    links = sorted(assessment.question_links or [], key=lambda l: l.sort_order if l.sort_order is not None else 999)

    student_questions = []
    for link in links:
        q = link.question
        if not q:
            continue
        public_tcs = [
            TestCaseResponse.model_validate(tc) for tc in (q.test_cases or []) if tc.test_type == "PUBLIC"
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
            database_engine=q.database_engine or "PostgreSQL",
            tables_schema_json=q.tables_schema_json or [],
            schema_ddl=q.schema_ddl or "",
            seed_data_sql=q.seed_data_sql or "",
            marks=link.marks or q.marks,
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

    return {
        "preview_mode": True,
        "assessment": {
            "id": assessment.id,
            "title": assessment.title,
            "description": assessment.description,
            "job_role": assessment.job_role,
            "duration_minutes": assessment.duration_minutes,
            "start_date": assessment.start_date,
            "end_date": assessment.end_date,
            "timezone": assessment.timezone,
            "status": assessment.status,
            "proctoring_config": assessment.proctoring_config_json or {},
            "candidate_settings": assessment.candidate_settings_json or {},
            "advanced_settings": assessment.advanced_settings_json or {}
        },
        "questions": student_questions
    }


@router.post("/{assessment_id}/preview-run/{question_id}", response_model=RunCodeResponse)
async def run_code_preview(
    assessment_id: str,
    question_id: str,
    payload: RunCodeRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin only: Executes code in Preview Mode against public test cases only.
    Runs transiently in sandbox; no student attempt or score is created.
    """
    await check_assessment_access(assessment_id, admin, db)

    q_stmt = select(Question).where(Question.id == question_id).options(selectinload(Question.test_cases))
    q_res = await db.execute(q_stmt)
    question = q_res.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")

    from app.services.sandbox_service import sandbox_service

    code_text = payload.code or payload.sql_query or payload.submitted_answer or ""
    selected_engine = payload.database_engine or getattr(payload, "dialect", None) or "PostgreSQL"
    public_tcs = [tc for tc in question.test_cases if tc.test_type == "PUBLIC"]
    results = []
    all_passed = True

    is_python = question.question_type == "PYTHON_TECHNICAL" or (question.code_language or "").lower() == "python"

    for tc in public_tcs:
        setup = tc.input_setup_sql or question.seed_data_sql or ""
        if is_python:
            res = await sandbox_service.execute_python(code_text, setup)
            passed = res["success"] and not res.get("error")
            actual = res.get("result")
            err = res.get("error")
        else:
            res = await sandbox_service.execute_query(
                question.schema_ddl or "",
                setup,
                code_text,
                engine=selected_engine or question.database_engine or "PostgreSQL"
            )
            passed = False
            err = res.get("error")
            actual = res.get("rows")
            if res["success"] and not err:
                passed = await sandbox_service.compare_outputs(
                    res.get("rows", []),
                    tc.expected_output_json if isinstance(tc.expected_output_json, list) else []
                )

        if not passed:
            all_passed = False

        results.append(TestCaseRunResult(
            test_case_id=tc.id,
            test_name=tc.name,
            passed=passed,
            actual_output=actual,
            expected_output=tc.expected_output_json if isinstance(tc.expected_output_json, list) else [],
            error=err,
            error_type=res.get("error_type"),
            error_line=res.get("error_line"),
            error_column=res.get("error_column")
        ))

    return RunCodeResponse(
        success=all_passed,
        message="Preview execution complete.",
        results=results
    )


@router.post("/{assessment_id}/preview-submit/{question_id}", response_model=SubmitCodeResponse)
async def submit_code_preview(
    assessment_id: str,
    question_id: str,
    payload: SubmitCodeRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin only: Simulates full submission evaluation (public + hidden test cases) in Preview Mode.
    Transient sandbox execution without modifying student database records.
    """
    await check_assessment_access(assessment_id, admin, db)

    q_stmt = select(Question).where(Question.id == question_id).options(selectinload(Question.test_cases))
    q_res = await db.execute(q_stmt)
    question = q_res.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")

    from app.services.sandbox_service import sandbox_service
    from decimal import Decimal

    code_text = payload.code or payload.sql_query or payload.submitted_answer or ""
    selected_engine = payload.database_engine or getattr(payload, "dialect", None) or "PostgreSQL"

    if question.question_type == "MCQ":
        clean_ans = code_text.strip().upper()
        correct_ans = (question.correct_answer or question.reference_sql or "").strip().upper()
        is_passed = (clean_ans == correct_ans) and bool(clean_ans)
        score = float(question.marks) if is_passed else 0.0

        return SubmitCodeResponse(
            submission_id="preview-sub-mcq",
            passed_count=1 if is_passed else 0,
            total_count=1,
            score=score,
            max_score=float(question.marks),
            results=[
                TestCaseRunResult(
                    test_case_id="mcq-preview",
                    test_name="Option Selection",
                    passed=is_passed,
                    actual_output=clean_ans,
                    expected_output=None,
                    error=None if is_passed else "Incorrect option selected."
                )
            ]
        )

    is_python = question.question_type == "PYTHON_TECHNICAL" or (question.code_language or "").lower() == "python"
    test_cases = question.test_cases or []

    total_weight = Decimal("0.00")
    passed_weight = Decimal("0.00")
    passed_count = 0
    results = []

    for tc in test_cases:
        tc_weight = Decimal(str(tc.weight if tc.weight else 1.00))
        total_weight += tc_weight
        setup = tc.input_setup_sql or question.seed_data_sql or ""

        if is_python:
            res = await sandbox_service.execute_python(code_text, setup, tc.expected_output_json)
            passed = res["success"] and not res.get("error")
            err = res.get("error")
        else:
            res = await sandbox_service.execute_query(
                question.schema_ddl or "",
                setup,
                code_text,
                engine=selected_engine or question.database_engine or "PostgreSQL"
            )
            passed = False
            err = res.get("error")
            if res["success"] and not err:
                passed = await sandbox_service.compare_outputs(
                    res.get("rows", []),
                    tc.expected_output_json if isinstance(tc.expected_output_json, list) else []
                )

        if passed:
            passed_count += 1
            passed_weight += tc_weight

        results.append(TestCaseRunResult(
            test_case_id=tc.id,
            test_name=tc.name if tc.test_type == "PUBLIC" else "Hidden Test Case",
            passed=passed,
            actual_output=None if tc.test_type == "HIDDEN" else (res.get("rows") or res.get("result")),
            expected_output=None if tc.test_type == "HIDDEN" else tc.expected_output_json,
            error=err if tc.test_type == "PUBLIC" else (err if not passed else None),
            error_type=res.get("error_type"),
            error_line=res.get("error_line"),
            error_column=res.get("error_column")
        ))

    score_ratio = (passed_weight / total_weight) if total_weight > Decimal("0.00") else Decimal("0.00")
    final_score = round(float(score_ratio * Decimal(str(question.marks))), 2)

    return SubmitCodeResponse(
        submission_id="preview-sub-official",
        passed_count=passed_count,
        total_count=len(test_cases),
        score=final_score,
        max_score=float(question.marks),
        results=results
    )






