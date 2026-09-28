import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.main import app
from app.core.database import get_db
from app.models.models import (
    User, Assessment, Topic, Question, AssessmentAssignment,
    Invitation, CandidateAttempt, AuditLog, AssessmentQuestion
)
from app.core.security import create_access_token, get_password_hash


@pytest.mark.asyncio
async def test_candidate_interruption_and_reenable_flow(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # 1. Setup Admin, Assessment, Question, and Candidate
    admin = User(
        email="admin_reenable@test.com",
        password_hash=get_password_hash("admin123"),
        full_name="Reenable Admin",
        role="admin",
        is_active=True
    )
    student = User(
        email="alex.mercer@test.com",
        password_hash=get_password_hash("student123"),
        full_name="Alex Mercer",
        role="student",
        student_id_code="STU-ALEX",
        is_active=True
    )
    db_session.add_all([admin, student])
    await db_session.flush()

    topic = Topic(name="SQL Reenable Topic", description="Topic for testing")
    db_session.add(topic)
    await db_session.flush()

    q = Question(
        topic_id=topic.id,
        title="Department Highest Salary",
        business_scenario="Find highest salary per department.",
        problem_statement="Write a query to find highest salary.",
        task_description="Return department and salary.",
        difficulty="MEDIUM",
        job_role="Data Engineer",
        database_engine="PostgreSQL",
        schema_ddl="CREATE TABLE emp (id INT, dept VARCHAR(50), salary INT);",
        seed_data_sql="INSERT INTO emp VALUES (1, 'IT', 90000);",
        marks=20
    )
    db_session.add(q)
    await db_session.flush()

    assessment = Assessment(
        title="Data Engineer Assessment",
        description="Assessment for Alex Mercer",
        job_role="Data Engineer",
        duration_minutes=60,
        start_date=datetime.utcnow() - timedelta(days=1),
        end_date=datetime.utcnow() + timedelta(days=7),
        status="ACTIVE",
        created_by=admin.id
    )
    db_session.add(assessment)
    await db_session.flush()

    aq = AssessmentQuestion(assessment_id=assessment.id, question_id=q.id, marks=20, sort_order=1)
    db_session.add(aq)

    assignment = AssessmentAssignment(
        assessment_id=assessment.id,
        student_id=student.id,
        status="INVITED"
    )
    db_session.add(assignment)
    await db_session.flush()

    raw_token = "reenable-test-token-123"
    import hashlib
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    invitation = Invitation(
        assignment_id=assignment.id,
        student_id=student.id,
        assessment_id=assessment.id,
        token_hash=token_hash,
        status="SENT",
        expires_at=datetime.utcnow() + timedelta(days=3)
    )
    db_session.add(invitation)
    await db_session.commit()

    admin_token = create_access_token(data={"sub": admin.id, "role": "admin"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    assessment_id = assessment.id
    assignment_id = assignment.id
    question_id = q.id

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 2. Candidate starts assessment
        val_resp = await client.get(f"/api/invitations/validate/{raw_token}")
        assert val_resp.status_code == 200
        val_data = val_resp.json()
        assert val_data["candidate_status"] == "IN_PROGRESS"
        assert val_data["active_attempt_number"] == 1
        assert val_data["time_remaining_seconds"] == 60 * 60

        # 3. Candidate types code and autosave triggers
        save_payload = {
            "active_question_id": question_id,
            "drafts": {
                question_id: {
                    "code": "SELECT dept, MAX(salary) FROM emp GROUP BY dept;",
                    "database_engine": "PostgreSQL"
                }
            },
            "time_remaining_seconds": 42 * 60  # 18 minutes spent, 42 remaining
        }
        save_resp = await client.post(f"/api/invitations/save-progress/{raw_token}", json=save_payload)
        assert save_resp.status_code == 200
        assert save_resp.json()["success"] is True

        # 4. Candidate accidentally exits / closes tab -> interruption recorded
        interrupt_payload = {
            "reason": "Candidate accidentally closed the browser",
            "drafts": save_payload["drafts"],
            "time_remaining_seconds": 42 * 60
        }
        int_resp = await client.post(f"/api/invitations/interrupt/{raw_token}", json=interrupt_payload)
        assert int_resp.status_code == 200
        assert int_resp.json()["status"] == "INTERRUPTED"

        # Verify assignment status in DB is now INTERRUPTED
        db_session.expire_all()
        stmt_check = select(AssessmentAssignment).where(AssessmentAssignment.id == assignment_id).options(selectinload(AssessmentAssignment.attempts))
        res_check = await db_session.execute(stmt_check)
        asgn_in_db = res_check.scalar_one()
        assert asgn_in_db.status == "INTERRUPTED"
        assert len(asgn_in_db.attempts) == 1
        assert asgn_in_db.attempts[0].status == "INTERRUPTED"
        assert asgn_in_db.attempts[0].time_remaining_seconds == 42 * 60

        # 5. Check candidates list from admin perspective
        cand_resp = await client.get(f"/api/assessments/{assessment_id}/candidates", headers=admin_headers)
        assert cand_resp.status_code == 200
        cands_data = cand_resp.json()
        assert cands_data["counts"]["interrupted"] == 1
        alex_item = next(c for c in cands_data["candidates"] if c["id"] == assignment_id)
        assert alex_item["status"] == "INTERRUPTED"

        # 6. Admin re-enables test with Option 1: Resume Previous Attempt + Add 30 Minutes
        reenable_payload = {
            "assignment_id": assignment_id,
            "action": "RESUME_PREVIOUS",
            "time_mode": "ADD_ADDITIONAL_TIME",
            "additional_minutes": 30,
            "reason": "Candidate technical problem",
            "custom_reason": None
        }
        reenable_resp = await client.post(
            f"/api/assessments/{assessment_id}/candidates/{assignment_id}/re-enable",
            json=reenable_payload,
            headers=admin_headers
        )
        assert reenable_resp.status_code == 200
        r_data = reenable_resp.json()
        assert r_data["success"] is True
        assert r_data["status"] == "RETAKE_ENABLED"
        assert r_data["action"] == "RESUME_PREVIOUS"

        # 7. Candidate accesses assessment again -> draft code and additional time restored
        val_resp_2 = await client.get(f"/api/invitations/validate/{raw_token}")
        assert val_resp_2.status_code == 200
        val_data_2 = val_resp_2.json()
        assert val_data_2["candidate_status"] == "IN_PROGRESS"
        # Time should be 42 mins + 30 mins = 72 mins = 4320 sec
        assert val_data_2["time_remaining_seconds"] == (42 + 30) * 60
        # Saved progress preserved
        assert val_data_2["saved_progress"]["drafts"][question_id]["code"] == "SELECT dept, MAX(salary) FROM emp GROUP BY dept;"

        # 8. Check Candidate Drilldown attempt history
        drill_resp = await client.get(
            f"/api/assessments/{assessment_id}/candidates/{assignment_id}/details",
            headers=admin_headers
        )
        assert drill_resp.status_code == 200
        drill_data = drill_resp.json()
        assert len(drill_data["attempt_history"]) == 1
        att1 = drill_data["attempt_history"][0]
        assert att1["attempt_number"] == 1
        assert att1["re_enable_reason"] == "Candidate technical problem"

        # 9. Now test Option 2: Admin re-enables with Start a New Attempt
        new_att_payload = {
            "assignment_id": assignment_id,
            "action": "START_NEW",
            "time_mode": "FULL_DURATION",
            "additional_minutes": 0,
            "reason": "Admin approved retake"
        }
        new_att_resp = await client.post(
            f"/api/assessments/{assessment_id}/candidates/{assignment_id}/re-enable",
            json=new_att_payload,
            headers=admin_headers
        )
        assert new_att_resp.status_code == 200
        assert new_att_resp.json()["attempt_number"] == 2

        # 10. Check Drilldown again -> Now contains Attempt 1 and Attempt 2!
        drill_resp_2 = await client.get(
            f"/api/assessments/{assessment_id}/candidates/{assignment_id}/details",
            headers=admin_headers
        )
        assert drill_resp_2.status_code == 200
        drill_data_2 = drill_resp_2.json()
        assert len(drill_data_2["attempt_history"]) == 2
        assert drill_data_2["active_attempt_number"] == 2
        # Attempt 1 preserved
        assert drill_data_2["attempt_history"][0]["attempt_number"] == 1
        assert drill_data_2["attempt_history"][0]["is_active"] is False
        # Attempt 2 active
        assert drill_data_2["attempt_history"][1]["attempt_number"] == 2
        assert drill_data_2["attempt_history"][1]["is_active"] is True

        # 11. Security test: student token cannot re-enable test (403 Forbidden)
        student_token = create_access_token(data={"sub": student.id, "role": "student"})
        student_headers = {"Authorization": f"Bearer {student_token}"}
        forbidden_resp = await client.post(
            f"/api/assessments/{assessment_id}/candidates/{assignment_id}/re-enable",
            json=reenable_payload,
            headers=student_headers
        )
        assert forbidden_resp.status_code == 403
