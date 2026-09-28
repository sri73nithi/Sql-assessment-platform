import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timedelta

from app.main import app
from app.core.database import get_db
from app.models.models import User, Assessment, Question, AssessmentQuestion, TestCase, Topic
from app.core.security import get_password_hash, create_access_token


@pytest.mark.asyncio
async def test_assessment_preview_flow(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    admin_email = f"preview_admin_{uuid.uuid4().hex[:8]}@assessment.com"

    # 1. Create admin user
    admin = User(
        email=admin_email,
        password_hash=get_password_hash("admin123"),
        full_name="Preview Admin",
        role="admin",
        is_active=True
    )
    db_session.add(admin)

    # Topic for question
    topic = Topic(name=f"Analytics_{uuid.uuid4().hex[:6]}", description="Analytics topic")
    db_session.add(topic)
    await db_session.flush()

    # 2. Create Assessment
    ass = Assessment(
        title="Senior SQL & Python Preview Assessment",
        description="Testing real preview mode rendering",
        job_role="Senior Data Engineer",
        duration_minutes=90,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=7),
        timezone="UTC",
        status="PUBLISHED",
        created_by=admin.id
    )
    db_session.add(ass)
    await db_session.flush()

    # 3. Create Technical SQL Question with reference_sql and hidden test cases
    q1 = Question(
        topic_id=topic.id,
        title="Total Revenue by Category",
        business_scenario="Sales analytics needs category revenue breakdown.",
        problem_statement="Calculate total sales revenue per category.",
        task_description="Group by category and sum total revenue.",
        difficulty="MEDIUM",
        job_role="Data Engineer",
        database_engine="sqlite",
        question_type="SQL_TECHNICAL",
        schema_ddl="CREATE TABLE sales (id INTEGER, category TEXT, revenue NUMERIC);",
        seed_data_sql="INSERT INTO sales VALUES (1, 'Electronics', 1000), (2, 'Books', 200);",
        reference_sql="SELECT category, SUM(revenue) AS total_revenue FROM sales GROUP BY category;",
        marks=15
    )
    db_session.add(q1)
    await db_session.flush()

    # Add 1 public test case and 1 hidden test case
    tc_pub = TestCase(
        question_id=q1.id,
        name="Public Sample Test",
        test_type="PUBLIC",
        expected_output_json=[{"category": "Books", "total_revenue": 200}, {"category": "Electronics", "total_revenue": 1000}],
        weight=5.0
    )
    tc_hid = TestCase(
        question_id=q1.id,
        name="Secret Edge Test",
        test_type="HIDDEN",
        expected_output_json=[{"category": "Toys", "total_revenue": 50}],
        weight=10.0
    )
    db_session.add_all([tc_pub, tc_hid])

    # 4. Create MCQ Question
    q2 = Question(
        topic_id=topic.id,
        title="SQL Primary Key Constraint",
        business_scenario="Database architecture evaluation.",
        problem_statement="Which property is TRUE for a Primary Key?",
        task_description="Select the single correct option.",
        difficulty="EASY",
        job_role="Data Engineer",
        question_type="MCQ",
        mcq_options_json=[
            {"id": "A", "text": "Can contain multiple NULL values"},
            {"id": "B", "text": "Must be UNIQUE and NOT NULL"},
            {"id": "C", "text": "Allows duplicate values"},
            {"id": "D", "text": "None of the above"}
        ],
        reference_sql="B",
        marks=5
    )
    db_session.add(q2)
    await db_session.flush()

    # Link questions to assessment
    link1 = AssessmentQuestion(assessment_id=ass.id, question_id=q1.id, marks=15, sort_order=1)
    link2 = AssessmentQuestion(assessment_id=ass.id, question_id=q2.id, marks=5, sort_order=2)
    db_session.add_all([link1, link2])
    await db_session.commit()

    token = create_access_token({"sub": admin.id, "role": "admin"})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # A. GET Preview
        preview_res = await client.get(f"/api/assessments/{ass.id}/preview", headers=headers)
        assert preview_res.status_code == 200, preview_res.text
        data = preview_res.json()

        assert data["preview_mode"] is True
        assert data["assessment"]["title"] == "Senior SQL & Python Preview Assessment"
        assert len(data["questions"]) == 2

        # Verify Q1 (SQL Technical)
        q1_data = data["questions"][0]
        assert q1_data["id"] == q1.id
        assert q1_data["question_type"] == "SQL_TECHNICAL"
        assert q1_data["marks"] == 15
        assert len(q1_data["public_test_cases"]) == 1
        assert q1_data["public_test_cases"][0]["name"] == "Public Sample Test"

        # Security check: reference_sql and hidden test cases must NOT be exposed
        assert "reference_sql" not in q1_data
        for tc in q1_data["public_test_cases"]:
            assert tc["test_type"] == "PUBLIC"
            assert tc["name"] != "Secret Edge Test"

        # Verify Q2 (MCQ)
        q2_data = data["questions"][1]
        assert q2_data["question_type"] == "MCQ"
        assert len(q2_data["mcq_options_json"]) == 4

        # B. POST Preview Run Code
        run_res = await client.post(
            f"/api/assessments/{ass.id}/preview-run/{q1.id}",
            json={"sql_query": "SELECT category, SUM(revenue) AS total_revenue FROM sales GROUP BY category;"},
            headers=headers
        )
        assert run_res.status_code == 200, run_res.text
        run_data = run_res.json()
        assert "results" in run_data
        assert len(run_data["results"]) == 1
        assert run_data["results"][0]["passed"] is True

        # C. POST Preview Run Code with Syntax Error to verify line diagnostics
        err_run_res = await client.post(
            f"/api/assessments/{ass.id}/preview-run/{q1.id}",
            json={"sql_query": "SELECT *\nFROM sales\nWHERE"},
            headers=headers
        )
        assert err_run_res.status_code == 200
        err_data = err_run_res.json()
        assert err_data["results"][0]["passed"] is False
        assert err_data["results"][0]["error_type"] == "SQL Syntax Error"
        assert err_data["results"][0]["error_line"] is not None

        # D. POST Preview Submit Code (evaluates public + hidden test cases safely)
        submit_res = await client.post(
            f"/api/assessments/{ass.id}/preview-submit/{q1.id}",
            json={"sql_query": "SELECT category, SUM(revenue) AS total_revenue FROM sales GROUP BY category;"},
            headers=headers
        )
        assert submit_res.status_code == 200
        sub_data = submit_res.json()
        assert sub_data["total_count"] == 2
        assert "score" in sub_data
        assert "max_score" in sub_data

        # Clean up overrides
        app.dependency_overrides.clear()
