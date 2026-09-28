import pytest
from app.services.validation_service import validation_service
from app.services.uniqueness_service import uniqueness_service
from app.services.sandbox_service import sandbox_service
from app.schemas.schemas import StudentQuestionView, TestCaseResponse as TestCaseResponseSchema


@pytest.mark.asyncio
async def test_pre_validation_sql_question():
    sql_question = {
        "question_type": "SQL_TECHNICAL",
        "title": "SQL Test Question",
        "schema_ddl": "CREATE TABLE employees (id INT, salary INT);",
        "seed_data_sql": "INSERT INTO employees VALUES (1, 5000), (2, 7000);",
        "reference_sql": "SELECT MAX(salary) as max_sal FROM employees;",
        "test_cases": [
            {
                "test_type": "PUBLIC",
                "name": "Public Case",
                "input_setup_sql": "",
                "expected_output_json": [{"max_sal": 7000}]
            }
        ]
    }
    passed, reason, stages = await validation_service.validate_question(sql_question)
    assert passed is True
    assert "validated successfully" in reason.lower()


@pytest.mark.asyncio
async def test_pre_validation_python_question():
    py_question = {
        "question_type": "PYTHON_TECHNICAL",
        "code_language": "python",
        "title": "Python Test Question",
        "reference_sql": "def add(a, b):\n    return a + b",
        "test_cases": [
            {
                "test_type": "PUBLIC",
                "name": "Test 1",
                "input_setup_sql": "result = add(2, 3)",
                "expected_output_json": 5
            }
        ]
    }
    passed, reason, stages = await validation_service.validate_question(py_question)
    assert passed is True


@pytest.mark.asyncio
async def test_pre_validation_mcq_question():
    mcq_question = {
        "question_type": "MCQ",
        "title": "MCQ Question",
        "mcq_options_json": [
            {"id": "A", "text": "Option A"},
            {"id": "B", "text": "Option B"},
            {"id": "C", "text": "Option C"},
            {"id": "D", "text": "Option D"}
        ],
        "correct_answer": "A",
        "explanation": "Option A is correct because of X."
    }
    passed, reason, stages = await validation_service.validate_question(mcq_question)
    assert passed is True


@pytest.mark.asyncio
async def test_student_security_lockdown():
    # Verify that StudentQuestionView does NOT include reference_sql, correct_answer, explanation
    public_tc = TestCaseResponseSchema(
        id="tc-1",
        question_id="q-1",
        test_type="PUBLIC",
        name="Public Test Case",
        input_setup_sql="",
        expected_output_json=[{"res": 1}],
        weight=1.0,
        created_at="2026-08-26T00:00:00"
    )

    q_view = StudentQuestionView(
        id="q-100",
        title="Sample Question",
        business_scenario="Scenario text",
        problem_statement="Problem text",
        task_description="Task text",
        difficulty="MEDIUM",
        job_role="Data Engineer",
        database_engine="PostgreSQL",
        tables_schema_json=[],
        schema_ddl="",
        seed_data_sql="",
        marks=10,
        question_type="SQL_TECHNICAL",
        public_test_cases=[public_tc]
    )

    d = q_view.dict()
    assert "reference_sql" not in d
    assert "correct_answer" not in d
    assert "explanation" not in d
