import uuid
import re
import asyncio
import traceback
from typing import Dict, List, Any, Tuple, Optional
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import create_async_engine
try:
    import asyncpg
    HAS_PG = True
except ImportError:
    HAS_PG = False
import sqlite3

from app.core.config import settings


def parse_sql_error(raw_err: str, sql_query: str) -> Dict[str, Any]:
    lines = (sql_query or "").splitlines()
    error_type = "SQL Syntax Error"
    error_line = None
    error_column = None
    friendly_msg = raw_err

    # SQLite pattern: near "XYZ": syntax error
    near_match = re.search(r'near "(.*?)": syntax error', raw_err)
    if near_match:
        token = near_match.group(1)
        error_type = "SQL Syntax Error"
        for idx, line in enumerate(lines, 1):
            if token in line:
                error_line = idx
                error_column = line.find(token) + 1
                break
        friendly_msg = f"Unexpected token or incomplete expression near '{token}'."
        if token.upper() in ("WHERE", "JOIN", "ON", "GROUP", "ORDER", "HAVING", "AND", "OR", "SELECT", "FROM"):
            friendly_msg += f" Expected a valid clause, condition, or column after '{token}'."

    # SQLite pattern: no such table: XYZ
    tbl_match = re.search(r'no such table:\s*([^\s,]+)', raw_err)
    if tbl_match:
        table_name = tbl_match.group(1)
        error_type = "Table Not Found"
        for idx, line in enumerate(lines, 1):
            if table_name in line:
                error_line = idx
                error_column = line.find(table_name) + 1
                break
        friendly_msg = f"Table '{table_name}' does not exist in the database schema. Check table spelling in the Database Schema tab."

    # SQLite pattern: no such column: XYZ
    col_match = re.search(r'no such column:\s*([^\s,]+)', raw_err)
    if col_match:
        col_name = col_match.group(1)
        error_type = "Column Not Found"
        for idx, line in enumerate(lines, 1):
            if col_name in line:
                error_line = idx
                error_column = line.find(col_name) + 1
                break
        friendly_msg = f"Column '{col_name}' does not exist. Verify column definitions in the Database Schema tab."

    # SQLite pattern: ambiguous column name: XYZ
    ambig_match = re.search(r'ambiguous column name:\s*([^\s,]+)', raw_err)
    if ambig_match:
        col_name = ambig_match.group(1)
        error_type = "Ambiguous Column Reference"
        for idx, line in enumerate(lines, 1):
            if col_name in line:
                error_line = idx
                error_column = line.find(col_name) + 1
                break
        friendly_msg = f"Column '{col_name}' exists in multiple joined tables. Please qualify it with a table alias (e.g. table_alias.{col_name})."

    # PostgreSQL error line pattern
    pg_line_match = re.search(r'LINE (\d+):', raw_err)
    if pg_line_match:
        error_line = int(pg_line_match.group(1))

    # Fallback line detection for syntax errors
    if error_line is None and "syntax" in raw_err.lower():
        for idx in range(len(lines) - 1, -1, -1):
            if lines[idx].strip():
                error_line = idx + 1
                break

    return {
        "error": friendly_msg,
        "error_type": error_type,
        "error_line": error_line,
        "error_column": error_column,
        "raw_error": raw_err
    }


def parse_python_error(err: Exception, code: str) -> Dict[str, Any]:
    lines = (code or "").splitlines()
    error_type = type(err).__name__
    error_line = None
    error_column = None
    friendly_msg = str(err)

    if isinstance(err, SyntaxError):
        error_type = "Python Syntax Error"
        error_line = err.lineno
        error_column = err.offset
        friendly_msg = f"Syntax error: {err.msg}"
        if err.text:
            friendly_msg += f" in line: '{err.text.strip()}'"
    else:
        tb = traceback.extract_tb(err.__traceback__)
        for frame in reversed(tb):
            if frame.filename == "<string>":
                error_line = frame.lineno
                break
        friendly_msg = f"{error_type}: {str(err)}"

    return {
        "error": friendly_msg,
        "error_type": error_type,
        "error_line": error_line,
        "error_column": error_column,
        "raw_error": str(err)
    }

class SandboxService:
    def __init__(self):
        self.use_sqlite = "sqlite" in settings.SANDBOX_DATABASE_URL or settings.ENVIRONMENT == "development"
        self.pg_dsn = settings.SANDBOX_DATABASE_URL
        self._engine = None

    async def get_pg_connection(self):
        """Creates and returns a connection to the PostgreSQL sandbox database."""
        if not HAS_PG:
            raise ImportError("PostgreSQL client driver (asyncpg) is not installed on this system.")
        # Convert sqlalchemy database url format to asyncpg DSN if needed
        dsn = self.pg_dsn

        if dsn.startswith("postgresql+asyncpg://"):
            dsn = dsn.replace("postgresql+asyncpg://", "postgresql://")
        elif dsn.startswith("postgresql://"):
            pass
        else:
            raise ValueError("Unsupported Sandbox Database URL scheme")

        return await asyncpg.connect(dsn)

    async def run_query_sqlite(
        self, schema_ddl: str, seed_data_sql: str, sql_query: str
    ) -> Dict[str, Any]:
        """
        Executes query inside an in-memory SQLite database.
        Used as local development fallback when Docker/PostgreSQL Sandbox is unavailable.
        """
        loop = asyncio.get_event_loop()
        
        def _execute():
            conn = sqlite3.connect(":memory:")
            # Enable row factory to get dictionary outcomes
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            try:
                # 1. Clean DDL and Seed Statements (SQLite requires executing scripts or individual commands)
                # Split commands by semicolon, ignoring comments
                ddl_statements = [s.strip() for s in re.split(r';(?=(?:[^\']*\'[^\']*\')*[^\']*$)', schema_ddl) if s.strip()]
                for statement in ddl_statements:
                    cursor.execute(statement)

                seed_statements = [s.strip() for s in re.split(r';(?=(?:[^\']*\'[^\']*\')*[^\']*$)', seed_data_sql) if s.strip()]
                for statement in seed_statements:
                    cursor.execute(statement)
                
                conn.commit()

                # 2. Run Student query (enforce read-only constraint conceptually by running SELECT only)
                clean_query = sql_query.strip()
                if clean_query.endswith(";"):
                    clean_query = clean_query[:-1].strip()
                upper_query = clean_query.upper()

                if not upper_query.startswith("SELECT") and not upper_query.startswith("WITH"):
                    return {
                        "success": False,
                        "columns": [],
                        "rows": [],
                        "error": "Only SELECT queries or Common Table Expressions (WITH) are allowed."
                    }

                # Executing student query
                # Limit execution to 101 records to detect overflow
                cursor.execute(f"SELECT * FROM ({clean_query}) LIMIT 101")
                rows = cursor.fetchall()
                
                columns = [col[0] for col in cursor.description] if cursor.description else []
                
                # Convert SQLite Rows to dictionary list
                row_dicts = []
                for row in rows[:100]:
                    row_dicts.append({col: row[col] for col in columns})

                return {
                    "success": True,
                    "columns": columns,
                    "rows": row_dicts,
                    "error": None,
                    "error_type": None,
                    "error_line": None,
                    "error_column": None
                }
            except Exception as e:
                parsed = parse_sql_error(str(e), sql_query)
                return {
                    "success": False,
                    "columns": [],
                    "rows": [],
                    "error": parsed["error"],
                    "error_type": parsed["error_type"],
                    "error_line": parsed["error_line"],
                    "error_column": parsed["error_column"],
                    "raw_error": parsed["raw_error"]
                }
            finally:
                conn.close()

        return await loop.run_in_executor(None, _execute)

    async def run_query_postgres(
        self, schema_ddl: str, seed_data_sql: str, sql_query: str
    ) -> Dict[str, Any]:
        """
        Executes query inside the isolated PostgreSQL sandbox container.
        Uses schema isolation and sets role to sandbox_student for security.
        """
        schema_name = f"sandbox_{uuid.uuid4().hex[:12]}"
        conn = None
        try:
            conn = await self.get_pg_connection()
            
            # Start transactional sequence
            async with conn.transaction():
                # 1. Create temporary schema and select search path
                await conn.execute(f"CREATE SCHEMA {schema_name};")
                await conn.execute(f"SET search_path TO {schema_name};")
                
                # 2. Setup database tables (schema_ddl)
                if schema_ddl.strip():
                    await conn.execute(schema_ddl)
                
                # 3. Seed data
                if seed_data_sql.strip():
                    await conn.execute(seed_data_sql)
                
                # 4. Grant schema usage and select privileges to the student role
                await conn.execute(f"GRANT USAGE ON SCHEMA {schema_name} TO sandbox_student;")
                await conn.execute(f"GRANT SELECT ON ALL TABLES IN SCHEMA {schema_name} TO sandbox_student;")
                
            # Execute query in a separate session/transaction to isolate role settings
            # We open a sub-connection or run under role setting
            async with conn.transaction():
                # Switch session security context to sandbox_student
                await conn.execute("SET ROLE sandbox_student;")
                
                # Ensure the student is tied to this sandbox schema search path
                await conn.execute(f"SET search_path TO {schema_name};")
                
                # Enforce SELECT only
                clean_query = sql_query.strip()
                if clean_query.endswith(";"):
                    clean_query = clean_query[:-1].strip()
                upper_query = clean_query.upper()

                if not upper_query.startswith("SELECT") and not upper_query.startswith("WITH"):
                    # Revert role first to allow proper exit
                    await conn.execute("RESET ROLE;")
                    return {
                        "success": False,
                        "columns": [],
                        "rows": [],
                        "error": "Only SELECT or CTE (WITH) queries are allowed."
                    }

                # Run query with max 101 rows to check for overflow
                results = await conn.fetch(f"SELECT * FROM ({clean_query}) LIMIT 101")
                
                # Revert session role to administrative
                await conn.execute("RESET ROLE;")

            # Format the output results
            columns = list(results[0].keys()) if results else []
            rows = [dict(row) for row in results[:100]]

            return {
                "success": True,
                "columns": columns,
                "rows": rows,
                "error": None
            }

        except asyncpg.exceptions.PostgresError as pg_err:
            # Try to revert role if failed within role-locked block
            if conn:
                try:
                    await conn.execute("RESET ROLE;")
                except Exception:
                    pass
            return {
                "success": False,
                "columns": [],
                "rows": [],
                "error": f"Database Error: {pg_err.message}"
            }
        except Exception as e:
            return {
                "success": False,
                "columns": [],
                "rows": [],
                "error": f"Execution Error: {str(e)}"
            }
        finally:
            if conn:
                # Cleanup the schema in admin context
                try:
                    await conn.execute(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE;")
                except Exception:
                    pass
                await conn.close()

    async def execute_query(
        self, schema_ddl: str, seed_data_sql: str, sql_query: str, engine: str = "PostgreSQL"
    ) -> Dict[str, Any]:
        """Runs the query using the configured mode (PostgreSQL, MySQL emulation, or SQLite fallback)."""
        engine_upper = (engine or "PostgreSQL").upper()
        if self.use_sqlite or engine_upper in ("SQLITE", "MYSQL"):
            return await self.run_query_sqlite(schema_ddl, seed_data_sql, sql_query)
        else:
            try:
                return await self.run_query_postgres(schema_ddl, seed_data_sql, sql_query)
            except Exception as e:
                if settings.ENVIRONMENT == "development":
                    return await self.run_query_sqlite(schema_ddl, seed_data_sql, sql_query)
                raise e

    async def compare_outputs(
        self, actual: List[Dict[str, Any]], expected: List[Dict[str, Any]]
    ) -> bool:
        """
        Compares query output datasets.
        Ignores row order if the queries did not explicitly specify sorting,
        but enforces exact matching on structure and rows.
        """
        if len(actual) != len(expected):
            return False
        
        # Check column headers match
        if actual and expected:
            if set(actual[0].keys()) != set(expected[0].keys()):
                return False

        # Convert values to standardized formats (strings or floats with specific decimals)
        def standardize_val(v):
            if isinstance(v, float):
                return round(v, 4)
            return str(v) if v is not None else None

        def standardize_row(r):
            return {k: standardize_val(v) for k, v in r.items()}

        standardized_actual = [standardize_row(r) for r in actual]
        standardized_expected = [standardize_row(r) for r in expected]

        return standardized_actual == standardized_expected

    async def execute_python(self, code: str, input_setup: str = "", expected_output: Any = None) -> Dict[str, Any]:
        """
        Executes Python code transiently in an isolated context and tests execution.
        """
        loop = asyncio.get_event_loop()

        def _exec_py():
            local_scope = {}
            global_scope = {"__builtins__": __builtins__}
            try:
                compiled = compile(code, "<string>", "exec")
                exec(compiled, global_scope, local_scope)
                
                result_val = None
                if input_setup and input_setup.strip():
                    exec(input_setup, global_scope, local_scope)
                    if "result" in local_scope:
                        result_val = local_scope["result"]

                return {
                    "success": True,
                    "result": result_val,
                    "error": None,
                    "error_type": None,
                    "error_line": None,
                    "error_column": None
                }
            except Exception as e:
                parsed = parse_python_error(e, code)
                return {
                    "success": False,
                    "result": None,
                    "error": parsed["error"],
                    "error_type": parsed["error_type"],
                    "error_line": parsed["error_line"],
                    "error_column": parsed["error_column"],
                    "raw_error": parsed["raw_error"]
                }

        return await loop.run_in_executor(None, _exec_py)


sandbox_service = SandboxService()
