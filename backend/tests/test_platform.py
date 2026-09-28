import pytest
from app.services.sandbox_service import sandbox_service
from app.services.ai_service import ai_service


@pytest.mark.asyncio
async def test_ai_mock_questions_generation():
    questions = await ai_service.generate_questions(
        job_role="Data Engineer",
        topic="Window Functions",
        difficulty="HARD",
        database_engine="PostgreSQL",
        question_count=2
    )
    assert len(questions) == 2
    assert questions[0]["job_role"] == "Data Engineer"
    assert questions[0]["difficulty"] == "HARD"
    assert "tables_schema_json" in questions[0]
