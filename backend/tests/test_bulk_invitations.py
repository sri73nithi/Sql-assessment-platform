import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timedelta
from sqlalchemy import select

from app.main import app
from app.models.models import User, Assessment, AssessmentAssignment, Invitation
from app.core.database import get_db
from app.core.security import get_password_hash, create_access_token


@pytest.mark.asyncio
async def test_bulk_assign_candidates_workflow(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # 1. Setup Admin and Assessment in DB
    admin = User(
        email="bulk_admin_test@assessment.com",
        password_hash=get_password_hash("admin123"),
        full_name="Assessment Admin",
        role="admin",
        is_active=True
    )
    db_session.add(admin)
    await db_session.flush()

    assessment = Assessment(
        title="SQL Batch Evaluation Assessment",
        description="Testing bulk candidate invitations",
        job_role="Data Engineer",
        duration_minutes=60,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=7),
        timezone="UTC",
        status="PUBLISHED",
        created_by=admin.id,
        point_of_contact_id=admin.id
    )
    db_session.add(assessment)
    await db_session.flush()

    # Pre-existing candidate
    existing_student = User(
        email="existing_candidate@assessment.com",
        password_hash=get_password_hash("student123"),
        full_name="Existing Candidate",
        student_id_code="STU-9999",
        role="student",
        is_active=True
    )
    db_session.add(existing_student)
    await db_session.commit()

    admin_token = create_access_token(data={"sub": admin.id, "role": "admin"})
    headers = {"Authorization": f"Bearer {admin_token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 2. Invoke bulk assign endpoint with manual + CSV emails, duplicates, and invalid email
        payload = {
            "assessment_id": assessment.id,
            "emails": [
                "existing_candidate@assessment.com",
                "new_student_alpha@gmail.com",
                "new_student_beta@gmail.com",
                "existing_candidate@assessment.com", # duplicate
                "invalid-email-address",            # invalid
            ]
        }

        resp = await ac.post("/api/invitations/assign-bulk", json=payload, headers=headers)
        assert resp.status_code == 200, resp.text
        data = resp.json()

        assert data["success"] is True
        assert data["total_requested"] == 5
        assert data["sent_count"] == 3
        assert data["skipped_duplicates_count"] == 1
        assert data["skipped_invalid_count"] == 1
        assert data["failed_count"] == 0
        assert "existing_candidate@assessment.com" in data["sent_emails"]
        assert "new_student_alpha@gmail.com" in data["sent_emails"]
        assert "new_student_beta@gmail.com" in data["sent_emails"]

        # 3. Verify Database Records
        # Check newly created User
        u_res = await db_session.execute(select(User).where(User.email == "new_student_alpha@gmail.com"))
        alpha_user = u_res.scalar_one_or_none()
        assert alpha_user is not None
        assert alpha_user.role == "student"
        assert alpha_user.is_active is True

        # Check AssessmentAssignment
        a_res = await db_session.execute(
            select(AssessmentAssignment).where(
                AssessmentAssignment.assessment_id == assessment.id,
                AssessmentAssignment.student_id == alpha_user.id
            )
        )
        alpha_assign = a_res.scalar_one_or_none()
        assert alpha_assign is not None
        assert alpha_assign.status == "INVITED"

        # Check Invitation
        i_res = await db_session.execute(
            select(Invitation).where(Invitation.assignment_id == alpha_assign.id)
        )
        alpha_inv = i_res.scalar_one_or_none()
        assert alpha_inv is not None
        assert alpha_inv.token_hash is not None
        assert alpha_inv.expires_at > datetime.utcnow()
