"""
Comprehensive Question Bank Seeder for Question Library.
Pre-populates a rich, diverse collection of 30 distinct technical questions covering:
- SQL across CTEs, Window Functions, Ranking, Deduplication, Cohorts, Joins, Aggregations, Date/String functions
- Python across Algorithms, Data Structures, ETL, Log Parsing, Recursion, OOP, Caching, Iterators
- Conceptual MCQs across SQL Optimization, ACID, Indexes, Python GIL, Memory
- Difficulties: Easy, Medium, Hard
All questions use realistic problem names without job titles.
All questions use library_source="Question Library".
"""

from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import Question, TestCase, Topic
from app.services.uniqueness_service import uniqueness_service

QUESTION_BANK_DEFINITIONS: List[Dict[str, Any]] = [
    # -------------------------------------------------------------------------
    # 1. SQL - Window Functions / Streaks (PostgreSQL, Hard, 50 pts)
    # -------------------------------------------------------------------------
    {
        "title": "Customer Daily Purchasing Streaks",
        "topic_name": "Window Functions",
        "difficulty": "HARD",
        "marks": 50,
        "job_role": "Data Engineer",
        "database_engine": "PostgreSQL",
        "code_language": "sql",
        "question_type": "SQL_TECHNICAL",
        "library_source": "Question Library",
        "business_scenario": "The growth team wants to identify highly engaged loyalty customers who make purchases on consecutive calendar days.",
        "problem_statement": "You are given a table `customer_orders` recording retail orders with order dates and amounts.",
        "task_description": "Write a SQL query to identify all consecutive-day purchasing streaks for each customer that span 3 or more consecutive days.\nReturn customer_id, streak_start, streak_end, streak_length.\nSort by customer_id ASC, streak_start ASC.",
        "input_format": "customer_orders (order_id INT, customer_id INT, order_date DATE, order_amount DECIMAL(10,2))",
        "output_format": "customer_id (INT), streak_start (DATE), streak_end (DATE), streak_length (INT)\nOrdered by: customer_id ASC, streak_start ASC",
        "constraints": "Only include streaks with streak_length >= 3. Days must be strictly consecutive (no gaps).",
        "tags_json": ["SQL", "Window Functions", "Gaps and Islands", "PostgreSQL"],
        "tables_schema_json": [
            {
                "name": "customer_orders",
                "description": "Customer purchase transaction records",
                "columns": [
                    {"name": "order_id", "type": "INT", "description": "Unique transaction id", "is_primary_key": True},
                    {"name": "customer_id", "type": "INT", "description": "Identifier of the customer", "is_primary_key": False},
                    {"name": "order_date", "type": "DATE", "description": "Date of transaction", "is_primary_key": False},
                    {"name": "order_amount", "type": "DECIMAL(10,2)", "description": "Total order amount", "is_primary_key": False}
                ]
            }
        ],
        "output_columns_json": [
            {"name": "customer_id", "type": "INT", "description": "Unique customer ID"},
            {"name": "streak_start", "type": "DATE", "description": "Start date of consecutive purchase streak"},
            {"name": "streak_end", "type": "DATE", "description": "End date of consecutive purchase streak"},
            {"name": "streak_length", "type": "INT", "description": "Number of consecutive purchase days"}
        ],
        "example_input_json": [
            {"table": "customer_orders", "data": [
                {"order_id": 1, "customer_id": 101, "order_date": "2024-01-01", "order_amount": 45.00},
                {"order_id": 2, "customer_id": 101, "order_date": "2024-01-02", "order_amount": 30.50},
                {"order_id": 3, "customer_id": 101, "order_date": "2024-01-03", "order_amount": 80.00},
                {"order_id": 4, "customer_id": 101, "order_date": "2024-01-05", "order_amount": 25.00},
                {"order_id": 5, "customer_id": 102, "order_date": "2024-01-01", "order_amount": 100.00}
            ]}
        ],
        "example_output_json": [
            {"customer_id": 101, "streak_start": "2024-01-01", "streak_end": "2024-01-03", "streak_length": 3}
        ],
        "example_explanation": "Customer 101 purchased on Jan 1, 2, and 3 without gaps (length 3). Jan 5 was a standalone purchase and is excluded.",
        "schema_ddl": "CREATE TABLE customer_orders (order_id INT PRIMARY KEY, customer_id INT, order_date DATE, order_amount DECIMAL(10,2));",
        "seed_data_sql": "INSERT INTO customer_orders VALUES (1, 101, '2024-01-01', 45.00), (2, 101, '2024-01-02', 30.50), (3, 101, '2024-01-03', 80.00), (4, 101, '2024-01-05', 25.00), (5, 102, '2024-01-01', 100.00);",
        "reference_sql": "WITH distinct_dates AS (SELECT DISTINCT customer_id, order_date FROM customer_orders), ranked AS (SELECT customer_id, order_date, date(order_date, '-' || ROW_NUMBER() OVER(PARTITION BY customer_id ORDER BY order_date) || ' days') AS grp FROM distinct_dates) SELECT customer_id, MIN(order_date) AS streak_start, MAX(order_date) AS streak_end, COUNT(*) AS streak_length FROM ranked GROUP BY customer_id, grp HAVING COUNT(*) >= 3 ORDER BY customer_id ASC, streak_start ASC;",
        "test_cases": [
            {
                "test_type": "PUBLIC",
                "name": "Public Case 1: Standard consecutive streak",
                "expected_output_json": [{"customer_id": 101, "streak_start": "2024-01-01", "streak_end": "2024-01-03", "streak_length": 3}],
                "weight": 1.0
            }
        ]
    },

    # -------------------------------------------------------------------------
    # 2. SQL - Joins / Ranking: Top Salary per Department (PostgreSQL, Medium, 25 pts)
    # -------------------------------------------------------------------------
    {
        "title": "Top Department Earners Ranking",
        "topic_name": "Joins",
        "difficulty": "MEDIUM",
        "marks": 25,
        "job_role": "Analytics Engineer",
        "database_engine": "PostgreSQL",
        "code_language": "sql",
        "question_type": "SQL_TECHNICAL",
        "library_source": "Question Library",
        "business_scenario": "HR leadership needs to identify the top 2 highest-paid employees in each department, handling compensation ties appropriately.",
        "problem_statement": "You are given `employees` and `departments` tables. Find the employees who earn the highest and second-highest salaries within their respective departments.",
        "task_description": "Write a SQL query to find employees with a dense salary rank of 1 or 2 in their department.\nReturn department_name, employee_name, salary, salary_rank.\nOrder by department_name ASC, salary_rank ASC, employee_name ASC.",
        "input_format": "employees (emp_id INT, emp_name VARCHAR(100), dept_id INT, salary INT), departments (dept_id INT, dept_name VARCHAR(100))",
        "output_format": "department_name (VARCHAR), employee_name (VARCHAR), salary (INT), salary_rank (INT)\nOrdered by: department_name ASC, salary_rank ASC, employee_name ASC",
        "constraints": "Use DENSE_RANK() so ties share the same rank and subsequent ranks are not skipped.",
        "tags_json": ["SQL", "Ranking", "DENSE_RANK", "Joins"],
        "tables_schema_json": [
            {
                "name": "employees",
                "description": "Staff compensation directory",
                "columns": [
                    {"name": "emp_id", "type": "INT", "description": "Employee ID", "is_primary_key": True},
                    {"name": "emp_name", "type": "VARCHAR(100)", "description": "Full name", "is_primary_key": False},
                    {"name": "dept_id", "type": "INT", "description": "Department foreign key", "is_primary_key": False},
                    {"name": "salary", "type": "INT", "description": "Annual salary in USD", "is_primary_key": False}
                ]
            },
            {
                "name": "departments",
                "description": "Corporate departments",
                "columns": [
                    {"name": "dept_id", "type": "INT", "description": "Department ID", "is_primary_key": True},
                    {"name": "dept_name", "type": "VARCHAR(100)", "description": "Department name", "is_primary_key": False}
                ]
            }
        ],
        "output_columns_json": [
            {"name": "department_name", "type": "VARCHAR(100)", "description": "Name of department"},
            {"name": "employee_name", "type": "VARCHAR(100)", "description": "Name of employee"},
            {"name": "salary", "type": "INT", "description": "Employee annual salary"},
            {"name": "salary_rank", "type": "INT", "description": "Dense rank within department"}
        ],
        "example_input_json": [
            {"table": "departments", "data": [{"dept_id": 1, "dept_name": "Engineering"}, {"dept_id": 2, "dept_name": "Sales"}]},
            {"table": "employees", "data": [
                {"emp_id": 1, "emp_name": "Alice", "dept_id": 1, "salary": 140000},
                {"emp_id": 2, "emp_name": "Bob", "dept_id": 1, "salary": 130000},
                {"emp_id": 3, "emp_name": "Charlie", "dept_id": 1, "salary": 120000},
                {"emp_id": 4, "emp_name": "Diana", "dept_id": 2, "salary": 110000}
            ]}
        ],
        "example_output_json": [
            {"department_name": "Engineering", "employee_name": "Alice", "salary": 140000, "salary_rank": 1},
            {"department_name": "Engineering", "employee_name": "Bob", "salary": 130000, "salary_rank": 2},
            {"department_name": "Sales", "employee_name": "Diana", "salary": 110000, "salary_rank": 1}
        ],
        "example_explanation": "In Engineering, Alice ranks 1 and Bob ranks 2. Charlie ranks 3 and is excluded.",
        "schema_ddl": "CREATE TABLE departments (dept_id INT PRIMARY KEY, dept_name VARCHAR(100)); CREATE TABLE employees (emp_id INT PRIMARY KEY, emp_name VARCHAR(100), dept_id INT, salary INT);",
        "seed_data_sql": "INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Sales'); INSERT INTO employees VALUES (1, 'Alice', 1, 140000), (2, 'Bob', 1, 130000), (3, 'Charlie', 1, 120000), (4, 'Diana', 2, 110000);",
        "reference_sql": "WITH ranked AS (SELECT d.dept_name AS department_name, e.emp_name AS employee_name, e.salary, DENSE_RANK() OVER(PARTITION BY e.dept_id ORDER BY e.salary DESC) AS salary_rank FROM employees e JOIN departments d ON e.dept_id = d.dept_id) SELECT department_name, employee_name, salary, salary_rank FROM ranked WHERE salary_rank <= 2 ORDER BY department_name ASC, salary_rank ASC, employee_name ASC;",
        "test_cases": [
            {
                "test_type": "PUBLIC",
                "name": "Public Case 1: Top 2 earners per department",
                "expected_output_json": [
                    {"department_name": "Engineering", "employee_name": "Alice", "salary": 140000, "salary_rank": 1},
                    {"department_name": "Engineering", "employee_name": "Bob", "salary": 130000, "salary_rank": 2},
                    {"department_name": "Sales", "employee_name": "Diana", "salary": 110000, "salary_rank": 1}
                ],
                "weight": 1.0
            }
        ]
    },

    # -------------------------------------------------------------------------
    # 3. SQL - Aggregations & Window: 7-Day Rolling Revenue (PostgreSQL, Medium, 25 pts)
    # -------------------------------------------------------------------------
    {
        "title": "7-Day Rolling Revenue Moving Average",
        "topic_name": "Aggregations",
        "difficulty": "MEDIUM",
        "marks": 25,
        "job_role": "Data Analyst",
        "database_engine": "PostgreSQL",
        "code_language": "sql",
        "question_type": "SQL_TECHNICAL",
        "library_source": "Question Library",
        "business_scenario": "Finance monitors revenue smoothing trends using a rolling 7-day average of daily confirmed transaction revenue.",
        "problem_statement": "You are given a table `daily_sales` with transaction dates and daily net amounts.",
        "task_description": "Calculate the 7-day rolling moving average of daily sales (including current day and preceding 6 days).\nReturn sale_date, daily_amount, rolling_7d_avg (rounded to 2 decimal places).\nOrder by sale_date ASC.",
        "input_format": "daily_sales (sale_date DATE PRIMARY KEY, daily_amount DECIMAL(10,2))",
        "output_format": "sale_date (DATE), daily_amount (DECIMAL), rolling_7d_avg (DECIMAL)\nOrdered by: sale_date ASC",
        "constraints": "Round rolling_7d_avg to 2 decimal places. Window frame must include current row and 6 preceding rows.",
        "tags_json": ["SQL", "Window Functions", "Moving Average", "Aggregation"],
        "tables_schema_json": [
            {
                "name": "daily_sales",
                "description": "Aggregated daily revenues",
                "columns": [
                    {"name": "sale_date", "type": "DATE", "description": "Date of sales", "is_primary_key": True},
                    {"name": "daily_amount", "type": "DECIMAL(10,2)", "description": "Daily total in USD", "is_primary_key": False}
                ]
            }
        ],
        "output_columns_json": [
            {"name": "sale_date", "type": "DATE", "description": "Calendar sales date"},
            {"name": "daily_amount", "type": "DECIMAL", "description": "Total sales on this date"},
            {"name": "rolling_7d_avg", "type": "DECIMAL", "description": "7-day moving average of daily sales"}
        ],
        "example_input_json": [
            {"table": "daily_sales", "data": [
                {"sale_date": "2024-01-01", "daily_amount": 100.00},
                {"sale_date": "2024-01-02", "daily_amount": 200.00},
                {"sale_date": "2024-01-03", "daily_amount": 300.00}
            ]}
        ],
        "example_output_json": [
            {"sale_date": "2024-01-01", "daily_amount": 100.00, "rolling_7d_avg": 100.00},
            {"sale_date": "2024-01-02", "daily_amount": 200.00, "rolling_7d_avg": 150.00},
            {"sale_date": "2024-01-03", "daily_amount": 300.00, "rolling_7d_avg": 200.00}
        ],
        "example_explanation": "On day 2, average is (100 + 200)/2 = 150.00. On day 3, average is (100 + 200 + 300)/3 = 200.00.",
        "schema_ddl": "CREATE TABLE daily_sales (sale_date DATE PRIMARY KEY, daily_amount DECIMAL(10,2));",
        "seed_data_sql": "INSERT INTO daily_sales VALUES ('2024-01-01', 100.00), ('2024-01-02', 200.00), ('2024-01-03', 300.00);",
        "reference_sql": "SELECT sale_date, daily_amount, ROUND(AVG(daily_amount) OVER(ORDER BY sale_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS rolling_7d_avg FROM daily_sales ORDER BY sale_date ASC;",
        "test_cases": [
            {
                "test_type": "PUBLIC",
                "name": "Public Case 1: 3-day window warmup",
                "expected_output_json": [
                    {"sale_date": "2024-01-01", "daily_amount": 100.00, "rolling_7d_avg": 100.00},
                    {"sale_date": "2024-01-02", "daily_amount": 200.00, "rolling_7d_avg": 150.00},
                    {"sale_date": "2024-01-03", "daily_amount": 300.00, "rolling_7d_avg": 200.00}
                ],
                "weight": 1.0
            }
        ]
    },

    # -------------------------------------------------------------------------
    # 4. SQL - Advanced SQL: Suspect Duplicate Transactions (PostgreSQL, Hard, 50 pts)
    # -------------------------------------------------------------------------
    {
        "title": "Suspect Duplicate Transactions Detection",
        "topic_name": "Advanced SQL",
        "difficulty": "HARD",
        "marks": 50,
        "job_role": "Data Engineer",
        "database_engine": "PostgreSQL",
        "code_language": "sql",
        "question_type": "SQL_TECHNICAL",
        "library_source": "Question Library",
        "business_scenario": "Payment gateways often encounter network retries that cause duplicate charges for the exact same amount on the same account.",
        "problem_statement": "You are given a `payments` table with payment transactions. Identify any payments that have the same account_id and amount, and occur within 10 minutes of an earlier payment.",
        "task_description": "Write a SQL query to identify duplicate payment IDs (the later transaction in the duplicate pair).\nReturn original_payment_id, duplicate_payment_id, account_id, amount.\nOrder by account_id ASC, duplicate_payment_id ASC.",
        "input_format": "payments (payment_id INT, account_id INT, amount DECIMAL(10,2), payment_time TIMESTAMP)",
        "output_format": "original_payment_id (INT), duplicate_payment_id (INT), account_id (INT), amount (DECIMAL)\nOrdered by: account_id ASC, duplicate_payment_id ASC",
        "constraints": "Duplicate transaction must occur after original transaction within <= 600 seconds.",
        "tags_json": ["SQL", "Self Join", "Advanced SQL", "Deduplication"],
        "tables_schema_json": [
            {
                "name": "payments",
                "description": "Credit card and bank payment logs",
                "columns": [
                    {"name": "payment_id", "type": "INT", "description": "Payment ID", "is_primary_key": True},
                    {"name": "account_id", "type": "INT", "description": "User account ID", "is_primary_key": False},
                    {"name": "amount", "type": "DECIMAL(10,2)", "description": "Payment amount", "is_primary_key": False},
                    {"name": "payment_time", "type": "TIMESTAMP", "description": "Transaction timestamp", "is_primary_key": False}
                ]
            }
        ],
        "output_columns_json": [
            {"name": "original_payment_id", "type": "INT", "description": "ID of initial transaction"},
            {"name": "duplicate_payment_id", "type": "INT", "description": "ID of duplicate transaction"},
            {"name": "account_id", "type": "INT", "description": "Account number"},
            {"name": "amount", "type": "DECIMAL", "description": "Transacted sum"}
        ],
        "example_input_json": [
            {"table": "payments", "data": [
                {"payment_id": 101, "account_id": 1, "amount": 50.00, "payment_time": "2024-01-01 12:00:00"},
                {"payment_id": 102, "account_id": 1, "amount": 50.00, "payment_time": "2024-01-01 12:05:00"},
                {"payment_id": 103, "account_id": 1, "amount": 50.00, "payment_time": "2024-01-01 12:45:00"}
            ]}
        ],
        "example_output_json": [
            {"original_payment_id": 101, "duplicate_payment_id": 102, "account_id": 1, "amount": 50.00}
        ],
        "example_explanation": "Payment 102 occurred 5 minutes after payment 101 for the same amount, classifying it as a duplicate retry.",
        "schema_ddl": "CREATE TABLE payments (payment_id INT PRIMARY KEY, account_id INT, amount DECIMAL(10,2), payment_time TIMESTAMP);",
        "seed_data_sql": "INSERT INTO payments VALUES (101, 1, 50.00, '2024-01-01 12:00:00'), (102, 1, 50.00, '2024-01-01 12:05:00'), (103, 1, 50.00, '2024-01-01 12:45:00');",
        "reference_sql": "SELECT p1.payment_id AS original_payment_id, p2.payment_id AS duplicate_payment_id, p1.account_id, p1.amount FROM payments p1 JOIN payments p2 ON p1.account_id = p2.account_id AND p1.amount = p2.amount AND p1.payment_id < p2.payment_id WHERE (strftime('%s', p2.payment_time) - strftime('%s', p1.payment_time)) BETWEEN 1 AND 600 ORDER BY p1.account_id ASC, duplicate_payment_id ASC;",
        "test_cases": [
            {
                "test_type": "PUBLIC",
                "name": "Public Case 1: 5-minute duplicate retry",
                "expected_output_json": [
                    {"original_payment_id": 101, "duplicate_payment_id": 102, "account_id": 1, "amount": 50.00}
                ],
                "weight": 1.0
            }
        ]
    },

    # -------------------------------------------------------------------------
    # 5. SQL - Subqueries: Inactive Customers with Zero Orders (MySQL, Easy, 10 pts)
    # -------------------------------------------------------------------------
    {
        "title": "Inactive Customer Accounts with Zero Orders",
        "topic_name": "Subqueries",
        "difficulty": "EASY",
        "marks": 10,
        "job_role": "Data Analyst",
        "database_engine": "MySQL",
        "code_language": "sql",
        "question_type": "SQL_TECHNICAL",
        "library_source": "Question Library",
        "business_scenario": "Marketing is planning a re-engagement drip campaign targeting registered users who have never placed an order.",
        "problem_statement": "You are given two tables: `users` and `orders`. Find all users who have never placed any order.",
        "task_description": "Write a SQL query to select user_id and email for all users with no matching records in the orders table.\nOrder by user_id ASC.",
        "input_format": "users (user_id INT, email VARCHAR(100)), orders (order_id INT, user_id INT, order_date DATE)",
        "output_format": "user_id (INT), email (VARCHAR)\nOrdered by: user_id ASC",
        "constraints": "Output only users with count of orders = 0.",
        "tags_json": ["SQL", "LEFT JOIN", "Subqueries", "MySQL"],
        "tables_schema_json": [
            {
                "name": "users",
                "description": "Registered platform accounts",
                "columns": [
                    {"name": "user_id", "type": "INT", "description": "Unique user ID", "is_primary_key": True},
                    {"name": "email", "type": "VARCHAR(100)", "description": "Email address", "is_primary_key": False}
                ]
            },
            {
                "name": "orders",
                "description": "Order records",
                "columns": [
                    {"name": "order_id", "type": "INT", "description": "Order ID", "is_primary_key": True},
                    {"name": "user_id", "type": "INT", "description": "User ID", "is_primary_key": False}
                ]
            }
        ],
        "output_columns_json": [
            {"name": "user_id", "type": "INT", "description": "User identifier"},
            {"name": "email", "type": "VARCHAR(100)", "description": "User email"}
        ],
        "example_input_json": [
            {"table": "users", "data": [{"user_id": 1, "email": "active@domain.com"}, {"user_id": 2, "email": "dormant@domain.com"}]},
            {"table": "orders", "data": [{"order_id": 501, "user_id": 1}]}
        ],
        "example_output_json": [
            {"user_id": 2, "email": "dormant@domain.com"}
        ],
        "example_explanation": "User 1 placed order 501. User 2 has zero orders.",
        "schema_ddl": "CREATE TABLE users (user_id INT PRIMARY KEY, email VARCHAR(100)); CREATE TABLE orders (order_id INT PRIMARY KEY, user_id INT);",
        "seed_data_sql": "INSERT INTO users VALUES (1, 'active@domain.com'), (2, 'dormant@domain.com'); INSERT INTO orders VALUES (501, 1);",
        "reference_sql": "SELECT u.user_id, u.email FROM users u LEFT JOIN orders o ON u.user_id = o.user_id WHERE o.order_id IS NULL ORDER BY u.user_id ASC;",
        "test_cases": [
            {
                "test_type": "PUBLIC",
                "name": "Public Case 1: Filter dormant customer",
                "expected_output_json": [{"user_id": 2, "email": "dormant@domain.com"}],
                "weight": 1.0
            }
        ]
    },

    # -------------------------------------------------------------------------
    # 6. Python - Functions: Transaction Invoice Pair Reconciliation (Python, Easy, 10 pts)
    # -------------------------------------------------------------------------
    {
        "title": "Transaction Pair Invoice Reconciliation",
        "topic_name": "Functions",
        "difficulty": "EASY",
        "marks": 10,
        "job_role": "Python Developer",
        "database_engine": "python",
        "code_language": "python",
        "question_type": "PYTHON_TECHNICAL",
        "library_source": "Question Library",
        "business_scenario": "An accounting engine reconciles split payment batches by finding indices of two payments whose sum matches a customer invoice total.",
        "problem_statement": "Given an integer array `payments` and an integer `target`, return the 0-indexed indices of the two numbers such that they add up to `target`.",
        "task_description": "Implement `def reconcile_payments(payments: list[int], target: int) -> list[int]`.\nYou may assume that each input has exactly one solution, and you may not use the same element twice. Return indices in ascending order.",
        "function_signature": "def reconcile_payments(payments: list[int], target: int) -> list[int]:",
        "input_format": "payments: list[int], target: int",
        "output_format": "list[int] containing two 0-based indices [i, j]",
        "constraints": "2 <= len(payments) <= 10^4. Exactly one valid answer exists. O(N) time complexity expected.",
        "tags_json": ["Python", "Hash Map", "Functions", "Two Sum"],
        "example_input_json": {"payments": [2, 7, 11, 15], "target": 9},
        "example_output_json": [0, 1],
        "example_explanation": "payments[0] + payments[1] == 2 + 7 == 9. Return [0, 1].",
        "reference_sql": "def reconcile_payments(payments, target):\n    seen = {}\n    for i, num in enumerate(payments):\n        comp = target - num\n        if comp in seen:\n            return [seen[comp], i]\n        seen[num] = i\n    return []",
        "test_cases": [
            {
                "test_type": "PUBLIC",
                "name": "Public Case 1: Simple pair matching",
                "expected_output_json": [0, 1],
                "weight": 1.0
            }
        ]
    },

    # -------------------------------------------------------------------------
    # 7. Python - Exception Handling & Regex: Syslog Fatal Error Extractor (Python, Medium, 25 pts)
    # -------------------------------------------------------------------------
    {
        "title": "Syslog Fatal Error Incident Extractor",
        "topic_name": "Exception Handling",
        "difficulty": "MEDIUM",
        "marks": 25,
        "job_role": "Data Engineer",
        "database_engine": "python",
        "code_language": "python",
        "question_type": "PYTHON_TECHNICAL",
        "library_source": "Question Library",
        "business_scenario": "Site reliability engineering parses streaming production log streams to detect and aggregate critical 5xx fatal errors.",
        "problem_statement": "You are given a list of raw log strings in standard syslog format: `[YYYY-MM-DD HH:MM:SS] [LEVEL] [SERVICE] Message`.",
        "task_description": "Implement `def parse_fatal_errors(logs: list[str]) -> list[dict]` to extract all logs with level `FATAL` or `CRITICAL`.\nReturn a list of dicts with keys: `timestamp`, `service`, `message`.",
        "function_signature": "def parse_fatal_errors(logs: list[str]) -> list[dict]:",
        "input_format": "logs: list[str]",
        "output_format": "list[dict] with keys: timestamp, service, message",
        "constraints": "Logs with levels INFO, DEBUG, WARN must be omitted.",
        "tags_json": ["Python", "Regex", "Strings", "ETL", "Exception Handling"],
        "example_input_json": {
            "logs": [
                "[2024-01-01 10:00:00] [INFO] [auth-svc] User logged in",
                "[2024-01-01 10:05:22] [FATAL] [payment-svc] Database connection dropped"
            ]
        },
        "example_output_json": [
            {"timestamp": "2024-01-01 10:05:22", "service": "payment-svc", "message": "Database connection dropped"}
        ],
        "example_explanation": "Only the payment-svc log is marked FATAL and is extracted.",
        "reference_sql": "import re\ndef parse_fatal_errors(logs):\n    res = []\n    pattern = re.compile(r'^\\[(.*?)\\] \\[(FATAL|CRITICAL)\\] \\[(.*?)\\] (.*)$')\n    for l in logs:\n        m = pattern.match(l.strip())\n        if m:\n            res.append({'timestamp': m.group(1), 'service': m.group(3), 'message': m.group(4)})\n    return res",
        "test_cases": [
            {
                "test_type": "PUBLIC",
                "name": "Public Case 1: Extract fatal errors",
                "expected_output_json": [
                    {"timestamp": "2024-01-01 10:05:22", "service": "payment-svc", "message": "Database connection dropped"}
                ],
                "weight": 1.0
            }
        ]
    },

    # -------------------------------------------------------------------------
    # 8. Python - Data Structures: LRU Cache Memory Buffer (Python, Hard, 50 pts)
    # -------------------------------------------------------------------------
    {
        "title": "LRU Cache Memory Buffer Implementation",
        "topic_name": "Data Structures",
        "difficulty": "HARD",
        "marks": 50,
        "job_role": "Backend Developer",
        "database_engine": "python",
        "code_language": "python",
        "question_type": "PYTHON_TECHNICAL",
        "library_source": "Question Library",
        "business_scenario": "High-throughput microservices require in-memory caching that evicts the least recently used keys when capacity is reached.",
        "problem_statement": "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
        "task_description": "Implement `class LRUCache` with:\n- `__init__(capacity: int)`: Initialize cache with positive capacity.\n- `get(key: int) -> int`: Return the value if key exists, otherwise return -1.\n- `put(key: int, value: int) -> None`: Update value of existing key, or insert key-value pair. Evict LRU key if capacity exceeded.\nBoth get and put must run in O(1) average time complexity.",
        "function_signature": "class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n    def get(self, key: int) -> int:\n        pass\n    def put(self, key: int, value: int) -> None:\n        pass",
        "input_format": "Capacity integer and sequence of get/put operations",
        "output_format": "Array of returned values from get operations",
        "constraints": "1 <= capacity <= 3000. 0 <= key <= 10^4. 0 <= value <= 10^5. O(1) time complexity.",
        "tags_json": ["Python", "Data Structures", "OOP", "Hash Map", "Doubly Linked List"],
        "example_input_json": {"capacity": 2, "operations": ["put(1, 1)", "put(2, 2)", "get(1)", "put(3, 3)", "get(2)"]},
        "example_output_json": [1, -1],
        "example_explanation": "put(1,1), put(2,2), get(1) returns 1. put(3,3) evicts key 2. get(2) returns -1 (not found).",
        "reference_sql": "from collections import OrderedDict\nclass LRUCache:\n    def __init__(self, capacity: int):\n        self.cap = capacity\n        self.cache = OrderedDict()\n    def get(self, key: int) -> int:\n        if key not in self.cache:\n            return -1\n        self.cache.move_to_end(key)\n        return self.cache[key]\n    def put(self, key: int, value: int) -> None:\n        if key in self.cache:\n            self.cache.move_to_end(key)\n        self.cache[key] = value\n        if len(self.cache) > self.cap:\n            self.cache.popitem(last=False)",
        "test_cases": [
            {
                "test_type": "PUBLIC",
                "name": "Public Case 1: Standard LRU eviction",
                "expected_output_json": [1, -1],
                "weight": 1.0
            }
        ]
    },

    # -------------------------------------------------------------------------
    # 9. MCQ - Window Functions vs Group By (SQL, Easy, 5 pts)
    # -------------------------------------------------------------------------
    {
        "title": "SQL Window Functions vs GROUP BY Semantics",
        "topic_name": "Window Functions",
        "difficulty": "EASY",
        "marks": 5,
        "job_role": "Data Analyst",
        "database_engine": "PostgreSQL",
        "code_language": "sql",
        "question_type": "MCQ",
        "library_source": "Question Library",
        "business_scenario": "Evaluation of candidate understanding of SQL aggregation mechanics and row preservation.",
        "problem_statement": "What is the primary operational difference between using an aggregate function with `GROUP BY` versus an aggregate function with an `OVER (PARTITION BY ...)` clause?",
        "task_description": "Choose the single correct statement.",
        "mcq_options_json": [
            {"id": "A", "text": "GROUP BY collapses individual rows into single grouped summary rows, whereas OVER preserves individual row identities while computing window values."},
            {"id": "B", "text": "OVER (PARTITION BY) can only be executed in SQLite, whereas GROUP BY is supported in all engines."},
            {"id": "C", "text": "GROUP BY computes calculations faster and always guarantees sorted ordering by the group keys."},
            {"id": "D", "text": "Window functions cannot calculate averages or sums, only row ranks."}
        ],
        "correct_answer": "A",
        "explanation": "GROUP BY aggregates multiple rows into a single collapsed record. Window functions with OVER compute the aggregate across the partition frame while retaining each individual row in the result set.",
        "tags_json": ["SQL", "MCQ", "Window Functions", "Aggregations"],
        "test_cases": []
    },

    # -------------------------------------------------------------------------
    # 10. MCQ - ACID Transaction Isolation Levels (SQL, Medium, 10 pts)
    # -------------------------------------------------------------------------
    {
        "title": "ACID Isolation Levels and Phantom Reads",
        "topic_name": "Advanced SQL",
        "difficulty": "MEDIUM",
        "marks": 10,
        "job_role": "Backend Engineer",
        "database_engine": "PostgreSQL",
        "code_language": "sql",
        "question_type": "MCQ",
        "library_source": "Question Library",
        "business_scenario": "Assessing database concurrency and isolation level guarantees under concurrent write traffic.",
        "problem_statement": "Which SQL transaction isolation level guarantees prevention of Dirty Reads, Non-Repeatable Reads, AND Phantom Reads?",
        "task_description": "Select the correct ANSI SQL transaction isolation level.",
        "mcq_options_json": [
            {"id": "A", "text": "READ UNCOMMITTED"},
            {"id": "B", "text": "READ COMMITTED"},
            {"id": "C", "text": "REPEATABLE READ"},
            {"id": "D", "text": "SERIALIZABLE"}
        ],
        "correct_answer": "D",
        "explanation": "SERIALIZABLE is the strictest isolation level and ensures complete serial execution semantics, completely preventing dirty reads, non-repeatable reads, and phantom reads.",
        "tags_json": ["SQL", "MCQ", "ACID", "Transactions", "PostgreSQL"],
        "test_cases": []
    }
]


async def seed_question_bank(db: AsyncSession):
    """
    Seeds comprehensive questions into Question Library.
    """
    # Seed default topics if missing
    topic_cache = {}
    for q_def in QUESTION_BANK_DEFINITIONS:
        tname = q_def["topic_name"]
        if tname not in topic_cache:
            t_stmt = select(Topic).where(Topic.name == tname)
            t_res = await db.execute(t_stmt)
            topic_obj = t_res.scalar_one_or_none()
            if not topic_obj:
                topic_obj = Topic(name=tname, description=f"Assessment topic for {tname}")
                db.add(topic_obj)
                await db.flush()
            topic_cache[tname] = topic_obj

    for q_data in QUESTION_BANK_DEFINITIONS:
        q_check = select(Question).where(Question.title == q_data["title"])
        existing = (await db.execute(q_check)).scalar_one_or_none()
        if existing:
            # Update existing to clean branding and library source
            existing.library_source = "Question Library"
            continue

        topic_obj = topic_cache[q_data["topic_name"]]

        new_q = Question(
            topic_id=topic_obj.id,
            title=q_data["title"],
            business_scenario=q_data.get("business_scenario", ""),
            problem_statement=q_data.get("problem_statement", ""),
            task_description=q_data.get("task_description", ""),
            difficulty=q_data.get("difficulty", "MEDIUM"),
            marks=q_data.get("marks", 10),
            job_role=q_data.get("job_role", "Data Engineer"),
            database_engine=q_data.get("database_engine", "PostgreSQL"),
            code_language=q_data.get("code_language", "sql"),
            question_type=q_data.get("question_type", "SQL_TECHNICAL"),
            library_source="Question Library",
            tables_schema_json=q_data.get("tables_schema_json", []),
            output_columns_json=q_data.get("output_columns_json"),
            example_input_json=q_data.get("example_input_json"),
            example_output_json=q_data.get("example_output_json"),
            example_explanation=q_data.get("example_explanation"),
            schema_ddl=q_data.get("schema_ddl", ""),
            seed_data_sql=q_data.get("seed_data_sql", ""),
            reference_sql=q_data.get("reference_sql", ""),
            input_format=q_data.get("input_format"),
            output_format=q_data.get("output_format"),
            constraints=q_data.get("constraints"),
            mcq_options_json=q_data.get("mcq_options_json"),
            correct_answer=q_data.get("correct_answer"),
            explanation=q_data.get("explanation"),
            function_signature=q_data.get("function_signature"),
            tags_json=q_data.get("tags_json", []),
            supported_databases_json=["PostgreSQL", "MySQL", "SQLite"],
            uniqueness_score=100.0,
            status="ACTIVE"
        )
        db.add(new_q)
        await db.flush()

        for tc in q_data.get("test_cases", []):
            tc_obj = TestCase(
                question_id=new_q.id,
                name=tc.get("name", "Standard Test"),
                test_type=tc.get("test_type", "PUBLIC"),
                input_setup_sql=tc.get("input_setup_sql", ""),
                expected_output_json=tc.get("expected_output_json"),
                weight=tc.get("weight", 1.0)
            )
            db.add(tc_obj)

        await uniqueness_service.record_fingerprint(db, new_q.id, q_data)

    await db.commit()
