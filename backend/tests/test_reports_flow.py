import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import (
    User, Assessment, Topic, Question, AssessmentQuestion,
    AssessmentAssignment, Invitation, StudentSubmission, AssessmentAdmin
)
from app.services.report_service import report_service


@pytest.mark.asyncio
async def test_full_reports_flow_and_endpoints(db_session: AsyncSession):
    # 1. Setup Admin, Candidate, and Assessment
    admin_user = User(
        email="report_admin@test.com",
        full_name="Report Admin",
        role="admin",
        password_hash="pwd_hash_admin"
    )
    student_user = User(
        email="report_student@test.com",
        full_name="Report Candidate",
        student_id_code="STU-REPORT-001",
        role="student",
        password_hash="pwd_hash_student"
    )
    db_session.add_all([admin_user, student_user])
    await db_session.commit()
    await db_session.refresh(admin_user)
    await db_session.refresh(student_user)

    topic = Topic(name="Advanced SQL Analytics", description="Reporting topic")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    question = Question(
        topic_id=topic.id,
        title="Revenue Trends Query",
        business_scenario="Calculate monthly revenue trends",
        problem_statement="Write a query with CTE",
        task_description="Return month and revenue",
        difficulty="MEDIUM",
        marks=10,
        status="ACTIVE"
    )
    db_session.add(question)
    await db_session.commit()
    await db_session.refresh(question)

    assessment = Assessment(
        title="Enterprise Data Analytics Test",
        job_role="Analytics Engineer",
        duration_minutes=60,
        status="ACTIVE",
        created_by=admin_user.id,
        point_of_contact_id=admin_user.id
    )
    db_session.add(assessment)
    await db_session.commit()
    await db_session.refresh(assessment)

    # Link question to assessment
    link = AssessmentQuestion(
        assessment_id=assessment.id,
        question_id=question.id,
        marks=10,
        sort_order=1
    )
    admin_role = AssessmentAdmin(
        assessment_id=assessment.id,
        user_id=admin_user.id,
        role="Lead Evaluator"
    )
    db_session.add_all([link, admin_role])
    await db_session.commit()

    # Create Assignment with invitation and completed status
    assignment = AssessmentAssignment(
        assessment_id=assessment.id,
        student_id=student_user.id,
        status="SHORTLISTED",
        assigned_at=datetime.utcnow() - timedelta(days=1),
        started_at=datetime.utcnow() - timedelta(hours=2),
        completed_at=datetime.utcnow() - timedelta(hours=1),
        total_score=9.0,
        percentage=90.0,
        integrity_status="Acceptable",
        integrity_score=98.0
    )
    db_session.add(assignment)
    await db_session.commit()
    await db_session.refresh(assignment)

    invitation = Invitation(
        assignment_id=assignment.id,
        student_id=student_user.id,
        assessment_id=assessment.id,
        token_hash="report_test_token_hash_abc",
        status="COMPLETED",
        expires_at=datetime.utcnow() + timedelta(days=5),
        opened_at=datetime.utcnow() - timedelta(hours=2),
        completed_at=datetime.utcnow() - timedelta(hours=1)
    )
    db_session.add(invitation)
    await db_session.commit()

    # Add candidate submission
    submission = StudentSubmission(
        assignment_id=assignment.id,
        student_id=student_user.id,
        assessment_id=assessment.id,
        question_id=question.id,
        submitted_sql="SELECT month, sum(revenue) FROM sales GROUP BY month;",
        passed_test_cases_count=5,
        total_test_cases_count=5,
        calculated_score=9.0,
        submitted_at=datetime.utcnow() - timedelta(hours=1)
    )
    db_session.add(submission)
    await db_session.commit()

    # 2. Test get_summary_analytics
    summary = await report_service.get_summary_analytics(db_session)
    assert summary["total_candidates"] >= 1
    assert summary["total_assessments"] >= 1
    assert summary["invited_count"] >= 1
    assert summary["opened_count"] >= 1
    assert summary["attempted_count"] >= 1
    assert summary["shortlisted_count"] >= 1
    assert summary["pass_rate"] >= 50.0
    assert len(summary["candidate_rankings"]) >= 1

    # 3. Test get_skill_map
    skill_map = await report_service.get_skill_map(db_session)
    assert len(skill_map["skills"]) >= 1
    sql_skill = next((s for s in skill_map["skills"] if s["topic"] == "Advanced SQL Analytics"), None)
    assert sql_skill is not None
    assert sql_skill["avg_percentage"] == 90.0
    assert sql_skill["submission_count"] >= 1

    # 4. Test get_tests_report
    tests_rep = await report_service.get_tests_report(db_session)
    assert tests_rep["total"] >= 1
    t_row = next((r for r in tests_rep["assessments"] if r["assessment_id"] == assessment.id), None)
    assert t_row is not None
    assert t_row["invited_count"] >= 1
    assert t_row["attempted_count"] >= 1
    assert t_row["shortlisted_count"] >= 1
    assert t_row["highest_score"] >= 90.0

    # 5. Test get_candidates_report
    candidates_rep = await report_service.get_candidates_report(db_session, search="Report Candidate")
    assert candidates_rep["total"] >= 1
    cand_entry = candidates_rep["candidates"][0]
    assert cand_entry["candidate_name"] == "Report Candidate"
    assert cand_entry["status"] == "SHORTLISTED"
    assert cand_entry["status_label"] == "Shortlisted"
    assert cand_entry["percentage"] == 90.0

    # 6. Test get_admins_report
    admins_rep = await report_service.get_admins_report(db_session)
    assert admins_rep["total"] >= 1
    admin_row = next((a for a in admins_rep["assessments"] if a["assessment_id"] == assessment.id), None)
    assert admin_row is not None
    assert len(admin_row["admins"]) >= 1
    poc_or_admin = next((adm for adm in admin_row["admins"] if adm["user_id"] == admin_user.id), None)
    assert poc_or_admin is not None

    # 7. Test generate_csv_report
    csv_text = await report_service.generate_csv_report(db_session, assessment_id=assessment.id)
    assert "Candidate Name" in csv_text
    assert "Report Candidate" in csv_text
    assert "Enterprise Data Analytics Test" in csv_text
    assert "Shortlisted" in csv_text
