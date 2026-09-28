import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timedelta
import uuid

from app.main import app
from app.models.models import User, Topic, Question, Assessment
from app.core.database import get_db
from app.core.security import get_password_hash, create_access_token


@pytest.mark.asyncio
async def test_library_filtering_and_workflows(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # 1. Setup Admin
    admin = User(
        email="lib_admin_test@assessment.com",
        password_hash=get_password_hash("admin123"),
        full_name="Library Admin",
        role="admin",
        is_active=True
    )
    db_session.add(admin)

    # 2. Setup Topic
    topic = Topic(name="Window Functions", description="Window functions and analytics")
    db_session.add(topic)
    await db_session.flush()

    # 3. Setup SQL Question in Question Library
    sql_q = Question(
        topic_id=topic.id,
        title="Customer Revenue Streaks Test",
        business_scenario="Consecutive purchase streaks",
        problem_statement="Find consecutive days with purchases.",
        task_description="Use window functions.",
        difficulty="HARD",
        marks=50,
        job_role="Data Engineer",
        database_engine="PostgreSQL",
        code_language="sql",
        question_type="SQL_TECHNICAL",
        library_source="Question Library",
        uniqueness_score=100.0,
        status="ACTIVE"
    )
    db_session.add(sql_q)

    # 4. Setup Python Question in Question Library
    py_q = Question(
        topic_id=topic.id,
        title="Python Log Parser Challenge",
        business_scenario="Parse fatal errors from syslogs",
        problem_statement="Extract timestamp and message from logs.",
        task_description="Implement parse_fatal_errors function.",
        difficulty="MEDIUM",
        marks=25,
        job_role="Data Engineer",
        database_engine="python",
        code_language="python",
        question_type="PYTHON_TECHNICAL",
        library_source="Question Library",
        uniqueness_score=100.0,
        status="ACTIVE"
    )
    db_session.add(py_q)

    # 5. Setup Assessment for linking
    ass = Assessment(
        title="Engineering Evaluation Assessment",
        description="Assessment for hiring",
        job_role="Data Engineer",
        duration_minutes=60,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=7),
        timezone="UTC",
        status="PUBLISHED",
        created_by=admin.id,
        point_of_contact_id=admin.id
    )
    db_session.add(ass)
    await db_session.commit()

    token = create_access_token({"sub": admin.id, "role": "admin"})
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # A. List questions from Question Library
        res_he = await ac.get("/api/questions?library_source=Question Library", headers=headers)
        assert res_he.status_code == 200
        he_questions = res_he.json()
        assert len(he_questions) >= 2
        for q in he_questions:
            assert q.get("library_source") == "Question Library"

        # B. Filter by Language: SQL
        res_sql = await ac.get("/api/questions?language=sql", headers=headers)
        assert res_sql.status_code == 200
        sql_questions = res_sql.json()
        assert len(sql_questions) >= 1
        for q in sql_questions:
            assert q.get("code_language") == "sql"

        # C. Filter by Language: Python
        res_py = await ac.get("/api/questions?language=python", headers=headers)
        assert res_py.status_code == 200
        py_questions = res_py.json()
        assert len(py_questions) >= 1
        for q in py_questions:
            assert q.get("code_language") == "python"

        # D. Filter by Database Engine: PostgreSQL
        res_pg = await ac.get("/api/questions?database_engine=PostgreSQL", headers=headers)
        assert res_pg.status_code == 200
        pg_questions = res_pg.json()
        assert len(pg_questions) >= 1

        # E. Search functionality
        res_search = await ac.get("/api/questions?search=Streaks", headers=headers)
        assert res_search.status_code == 200
        search_results = res_search.json()
        assert len(search_results) >= 1

        # F. Duplicate Question to My Library
        target_q_id = sql_q.id
        res_dup = await ac.post(f"/api/questions/{target_q_id}/duplicate", headers=headers)
        assert res_dup.status_code == 200
        dup_data = res_dup.json()
        assert dup_data["library_source"] == "My Library"
        assert "(Copy)" in dup_data["title"]

        # G. Save AI-Generated Batch to My Library
        test_title = f"AI Challenge: High Frequency Fraud {uuid.uuid4().hex[:6]}"
        batch_payload = {
            "questions": [
                {
                    "title": test_title,
                    "business_scenario": "Detect rapid ATM withdrawal patterns.",
                    "problem_statement": f"Find multiple withdrawals within 3 minutes.",
                    "task_description": "Write a SQL query using window functions.",
                    "difficulty": "HARD",
                    "job_role": "Security Data Engineer",
                    "database_engine": "PostgreSQL",
                    "code_language": "sql",
                    "question_type": "SQL_TECHNICAL",
                    "marks": 50,
                    "topic_name": "Window Functions",
                    "uniqueness_score": 99.0
                }
            ],
            "target_library": "My Library"
        }
        res_batch = await ac.post("/api/question-generation/save-batch", json=batch_payload, headers=headers)
        assert res_batch.status_code == 200
        assert "Successfully saved 1 questions to My Library" in res_batch.json()["detail"]

        # H. Verify it appears in My Library
        res_my_lib = await ac.get("/api/questions?library_source=My Library", headers=headers)
        assert res_my_lib.status_code == 200
        my_questions = res_my_lib.json()
        titles = [q["title"] for q in my_questions]
        assert test_title in titles

        # I. Add Question to Assessment
        res_add = await ac.post(
            f"/api/questions/{target_q_id}/add-to-assessment/{ass.id}",
            headers=headers
        )
        assert res_add.status_code == 200
        assert "successfully added to assessment" in res_add.json()["detail"]
