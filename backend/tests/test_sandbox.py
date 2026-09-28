import pytest
from app.services.sandbox_service import sandbox_service


@pytest.mark.asyncio
async def test_sandbox_valid_select():
    ddl = "CREATE TABLE test_users (id INT, name VARCHAR(50));"
    seed = "INSERT INTO test_users VALUES (1, 'Alice'), (2, 'Bob');"
    sql = "SELECT name FROM test_users WHERE id = 1;"

    res = await sandbox_service.execute_query(ddl, seed, sql)
    assert res["success"] is True
    assert len(res["rows"]) == 1
    assert res["rows"][0]["name"] == "Alice"


@pytest.mark.asyncio
async def test_sandbox_blocks_destructive_query():
    ddl = "CREATE TABLE test_users (id INT, name VARCHAR(50));"
    seed = "INSERT INTO test_users VALUES (1, 'Alice');"
    sql = "DROP TABLE test_users;"

    res = await sandbox_service.execute_query(ddl, seed, sql)
    assert res["success"] is False
    assert "Only SELECT or CTE (WITH) queries are allowed" in res["error"] or "Only SELECT" in res["error"]
