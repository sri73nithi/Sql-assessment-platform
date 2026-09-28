import pytest
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from app.models.models import StudentSubmission, User, Assessment, Question, AssessmentAssignment, Topic
from app.services.scoring_service import scoring_service
from app.services.report_service import report_service


@pytest.mark.asyncio
async def test_best_submission_selection(db_session):
    """
    Explicitly tests Requirement 56:
    Submission 1 = 10
    Submission 2 = 18
    Submission 3 = 15
    Submission 4 = 20
    
    Verifies that:
    1. Best submission selected = Submission 4
    2. Best score = 20
    3. Admin report displays Best Score = 20
    """
    db = db_session

    # 1. Create Student & Admin
    student = User(
        email="candidate_test@assessment.com",
        password_hash="hash",
        full_name="Jane Doe",
        student_id_code="STU-2001",
        role="student"
    )
    db.add(student)
    await db.flush()

    # 2. Create Topic & Question
    topic = Topic(name="Window Functions Test", description="Testing best submission")
    db.add(topic)
    await db.flush()

    question = Question(
        topic_id=topic.id,
        title="Rank Salaries Question",
        business_scenario="Scenario text",
        problem_statement="Problem statement text",
        task_description="Task description text",
        difficulty="HARD",
        job_role="Data Engineer",
        database_engine="PostgreSQL",
        tables_schema_json=[],
        schema_ddl="CREATE TABLE emp (id INT, sal INT);",
        seed_data_sql="INSERT INTO emp VALUES (1, 100);",
        reference_sql="SELECT * FROM emp;",
        marks=20
    )
    db.add(question)
    await db.flush()

    # 3. Create Assessment & Assignment
    assessment = Assessment(
        title="Best Submission Test Assessment",
        job_role="Data Engineer",
        duration_minutes=60,
        start_date=datetime.now(timezone.utc) - timedelta(hours=1),
        end_date=datetime.now(timezone.utc) + timedelta(hours=24),
        status="PUBLISHED"
    )
    db.add(assessment)
    await db.flush()

    assignment = AssessmentAssignment(
        assessment_id=assessment.id,
        student_id=student.id
    )
    db.add(assignment)
    await db.flush()

    # 4. Insert Submissions: 10, 18, 15, 20
    scores_sequence = [10.0, 18.0, 15.0, 20.0]
    created_subs = []

    for idx, score_val in enumerate(scores_sequence):
        sub = StudentSubmission(
            assignment_id=assignment.id,
            student_id=student.id,
            assessment_id=assessment.id,
            question_id=question.id,
            submitted_sql=f"SELECT {idx+1};",
            passed_test_cases_count=idx+1,
            total_test_cases_count=4,
            calculated_score=Decimal(str(score_val)),
            submitted_at=datetime.now(timezone.utc) + timedelta(seconds=idx * 10)
        )
        db.add(sub)
        created_subs.append(sub)

    await db.commit()

    # 5. Query Best Submission
    best_sub = await scoring_service.get_best_submission(db, student.id, assessment.id)

    assert best_sub is not None
    assert best_sub.id == created_subs[3].id
    assert float(best_sub.calculated_score) == 20.0

    # 6. Verify Admin Report returns Best Score = 20.0
    report_data = await report_service.get_summary_analytics(db)
    rankings = report_data["candidate_rankings"]
    
    cand_row = next((r for r in rankings if r["candidate_email"] == "candidate_test@assessment.com"), None)
    assert cand_row is not None
    assert cand_row["best_score"] == 20.0
