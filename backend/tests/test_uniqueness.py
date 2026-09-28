import pytest
from app.services.uniqueness_engine import uniqueness_engine


@pytest.mark.asyncio
async def test_uniqueness_engine_layers(db_session):
    db = db_session

    scenario = "Retail store transactional database analysis."
    problem = "Find the top customer by total purchase amount."
    task = "Return customer_id and total_spent."
    diff = "MEDIUM"
    ref_sql = "SELECT customer_id, SUM(amount) AS total_spent FROM orders GROUP BY customer_id ORDER BY total_spent DESC LIMIT 1;"
    schema = [{"name": "orders", "columns": [{"name": "customer_id", "type": "INT"}, {"name": "amount", "type": "NUMERIC"}]}]

    # Compute hashes
    exact_h = uniqueness_engine.compute_exact_text_hash(scenario, problem, task)
    canonical_h = uniqueness_engine.compute_canonical_problem_hash(problem, task, diff)
    sql_h = uniqueness_engine.compute_sql_structure_hash(ref_sql)
    schema_h = uniqueness_engine.compute_schema_fingerprint_hash(schema)

    assert len(exact_h) == 64
    assert len(canonical_h) == 64
    assert len(sql_h) == 64
    assert len(schema_h) == 64

    # Check batch duplicate detection
    fp_data = uniqueness_engine.generate_fingerprint_data(
        question_id="q-100",
        scenario=scenario,
        problem_statement=problem,
        task=task,
        difficulty=diff,
        reference_sql=ref_sql,
        tables_schema=schema
    )

    is_dup, reason = await uniqueness_engine.is_duplicate(
        db,
        scenario=scenario,
        problem_statement=problem,
        task=task,
        difficulty=diff,
        reference_sql=ref_sql,
        tables_schema=schema,
        current_batch_fingerprints=[fp_data]
    )

    assert is_dup is True
    assert "Duplicate of another question in the current generation batch" in reason
