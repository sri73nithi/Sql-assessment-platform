import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timedelta

from app.main import app
from app.models.models import User, Assessment, AssessmentAssignment, Invitation, ProctoringEvent, Topic, Question, TestCase
from app.core.database import get_db
from app.core.security import get_password_hash, create_access_token


@pytest.mark.asyncio
async def test_complete_candidates_flow_and_actions(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # 1. Setup Admin, Assessment, and Questions in DB
    admin = User(
        email="candidate_admin_test@assessment.com",
        password_hash=get_password_hash("admin123"),
        full_name="Assessment Director",
        role="admin",
        is_active=True
    )
    db_session.add(admin)
    await db_session.flush()

    assessment = Assessment(
        title="Senior Analytics Engineer Test",
        description="Complex CTEs, window functions and query tuning",
        job_role="Senior Analytics Engineer",
        duration_minutes=90,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=7),
        timezone="UTC",
        status="PUBLISHED",
        created_by=admin.id,
        point_of_contact_id=admin.id
    )
    db_session.add(assessment)
    await db_session.flush()

    # 2. Add Candidate 1 (Completed) & Candidate 2 (Invited)
    student1 = User(
        email="student1@assessment.com",
        password_hash=get_password_hash("student123"),
        full_name="Nithiyaa dhershini M",
        student_id_code="STU-2001",
        role="student",
        is_active=True
    )
    student2 = User(
        email="student2@assessment.com",
        password_hash=get_password_hash("student123"),
        full_name="Rahul Sharma",
        student_id_code="STU-2002",
        role="student",
        is_active=True
    )
    db_session.add_all([student1, student2])
    await db_session.flush()

    now = datetime.utcnow()
    asgn1 = AssessmentAssignment(
        assessment_id=assessment.id,
        student_id=student1.id,
        status="REVIEW_PENDING",
        assigned_at=now - timedelta(days=1),
        started_at=now - timedelta(hours=2),
        completed_at=now - timedelta(hours=1),
        total_score=85.0,
        percentage=85.0,
        attempt_percentage=100.0,
        integrity_status="Acceptable",
        integrity_score=92.0
    )
    asgn2 = AssessmentAssignment(
        assessment_id=assessment.id,
        student_id=student2.id,
        status="INVITED",
        assigned_at=now,
        started_at=None,
        completed_at=None,
        total_score=0.0,
        percentage=0.0,
        attempt_percentage=0.0
    )
    db_session.add_all([asgn1, asgn2])
    await db_session.flush()

    inv1 = Invitation(
        assignment_id=asgn1.id,
        student_id=student1.id,
        assessment_id=assessment.id,
        token_hash=f"tok_test_{student1.id[:6]}",
        status="COMPLETED",
        expires_at=now + timedelta(days=5),
        sent_at=now - timedelta(days=1),
        opened_at=now - timedelta(hours=2),
        completed_at=now - timedelta(hours=1)
    )
    inv2 = Invitation(
        assignment_id=asgn2.id,
        student_id=student2.id,
        assessment_id=assessment.id,
        token_hash=f"tok_test_{student2.id[:6]}",
        status="PENDING",
        expires_at=now + timedelta(days=5),
        sent_at=now
    )
    proc1 = ProctoringEvent(
        assessment_id=assessment.id,
        student_id=student1.id,
        event_type="TAB_SWITCH",
        violation_count=1,
        details_json={"note": "Tab blur"}
    )
    db_session.add_all([inv1, inv2, proc1])
    await db_session.commit()

    transport = ASGITransport(app=app)
    admin_token = create_access_token(data={"sub": admin.id, "role": "admin"})

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # A. GET Candidates list and verify real counts
        res_list = await ac.get(
            f"/api/assessments/{assessment.id}/candidates",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res_list.status_code == 200, res_list.text
        data = res_list.json()
        assert len(data["candidates"]) == 2
        assert data["counts"]["test_taken"] >= 1
        assert data["counts"]["invited"] >= 1
        assert data["counts"]["all"] == 2

        # B. GET Candidate details drilldown
        res_drill = await ac.get(
            f"/api/assessments/{assessment.id}/candidates/{asgn1.id}/details",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res_drill.status_code == 200
        drill_data = res_drill.json()
        assert drill_data["name"] == "Nithiyaa dhershini M"
        assert drill_data["percentage"] == 85.0
        assert drill_data["proctoring_summary"]["tab_switches"] >= 1

        # C. Extend Time for Candidate 2
        res_ext = await ac.post(
            f"/api/assessments/{assessment.id}/candidates/extend-time",
            json={"assignment_ids": [asgn2.id], "additional_minutes": 30, "reason": "Accommodation"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res_ext.status_code == 200
        assert res_ext.json()["extended_count"] == 1

        # D. Schedule Interview for Candidate 1
        res_iv = await ac.post(
            f"/api/assessments/{assessment.id}/candidates/schedule-interview",
            json={
                "assignment_id": asgn1.id,
                "interview_date": "2026-06-25",
                "interview_time": "11:00 AM",
                "interviewer_name": "Vinodkumar Chandrasekar",
                "meeting_link": "https://meet.google.com/test-room",
                "notes": "System architecture deep-dive"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res_iv.status_code == 200
        assert res_iv.json()["interview"]["interviewer"] == "Vinodkumar Chandrasekar"

        # E. Bulk status update to SHORTLISTED
        res_status = await ac.put(
            f"/api/assessments/{assessment.id}/candidates/status",
            json={"assignment_ids": [asgn1.id], "status": "SHORTLISTED", "notes": "Approved for round 2"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res_status.status_code == 200
        assert res_status.json()["new_status"] == "SHORTLISTED"

        # F. Reset test for Candidate 1
        res_reset = await ac.post(
            f"/api/assessments/{assessment.id}/candidates/reset-test",
            json={"assignment_ids": [asgn1.id]},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res_reset.status_code == 200
        assert res_reset.json()["reset_count"] == 1

        # G. Verify Candidate list after reset -> Candidate 1 now in TEST_RESET
        res_list2 = await ac.get(
            f"/api/assessments/{assessment.id}/candidates?status_filter=test_reset",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res_list2.status_code == 200
        assert len(res_list2.json()["candidates"]) == 1
        assert res_list2.json()["candidates"][0]["status"] == "TEST_RESET"

        # H. Export Candidate Summary Report CSV
        res_csv = await ac.post(
            f"/api/assessments/{assessment.id}/candidates/export-reports",
            json={"report_type": "SUMMARY_CSV"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res_csv.status_code == 200
        assert "text/csv" in res_csv.headers["content-type"]
        assert "Nithiyaa dhershini M" in res_csv.text
