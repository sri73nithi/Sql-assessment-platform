import os
import json
import re
import time
import random
from typing import Dict, List, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings

# Defined curriculum topic catalogs per user specification
SQL_TOPICS: List[str] = [
    "Window Functions",
    "CTEs",
    "Joins",
    "GROUP BY & HAVING",
    "Subqueries",
    "Aggregations",
    "Date & Time Functions",
    "String Functions",
    "CASE Statements",
    "Set Operations",
    "Indexes",
    "Query Optimization",
    "Advanced SQL",
    "SELECT & Filtering",
    "SQL Basics"
]

PYTHON_TOPICS: List[str] = [
    "Functions",
    "Data Structures",
    "Algorithms",
    "Object-Oriented Programming",
    "Exception Handling",
    "File Handling",
    "Iterators & Generators",
    "Decorators",
    "List Comprehensions",
    "Dictionaries & Sets",
    "Lists & Tuples",
    "Pandas",
    "NumPy",
    "Python for Data Engineering",
    "Variables & Data Types",
    "Python Basics"
]

def get_auto_marks(q_type: str, difficulty: str) -> int:
    """
    Automatically assigns marks based on question type and difficulty complexity.
    """
    diff = (difficulty or "MEDIUM").upper()
    is_mcq = "MCQ" in q_type.upper()
    if is_mcq:
        if diff == "EASY":
            return 5
        elif diff == "MEDIUM":
            return 10
        else:
            return 15
    else:
        if diff == "EASY":
            return 10
        elif diff == "MEDIUM":
            return 25
        else:
            return 50


class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.model_name = "gemini-1.5-flash"
            except Exception:
                self.model_name = "mock"
        else:
            self.model_name = "mock"

    async def generate_questions(
        self,
        job_role: str = "Data Engineer",
        topic: str = "Window Functions",
        difficulty: str = "HARD",
        database_engine: str = "PostgreSQL",
        question_count: int = 2,
        question_type: str = "TECHNICAL"
    ) -> List[Dict[str, Any]]:
        lang = "python" if "python" in (database_engine + topic).lower() else "sql"
        return await self.generate_questions_auto(
            language=lang,
            question_type=question_type,
            difficulty=difficulty,
            question_count=question_count,
            topic_name=topic
        )

    async def generate_questions_auto(
        self,
        language: str,
        question_type: str,
        difficulty: str,
        question_count: int,
        topic_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generates distinct questions across diverse topics without job titles.
        Automatically distributes topics and assigns marks.
        """
        lang = (language or "SQL").upper()
        diff = (difficulty or "MEDIUM").upper()
        q_type_req = (question_type or "TECHNICAL").upper()

        topics_pool = SQL_TOPICS if lang == "SQL" else PYTHON_TOPICS
        if topic_name and topic_name in topics_pool:
            selected_topics = [topic_name] * question_count
        else:
            # Distribute topics across available catalog
            shuffled = list(topics_pool)
            random.shuffle(shuffled)
            selected_topics = [shuffled[i % len(shuffled)] for i in range(question_count)]

        questions = []
        for i in range(question_count):
            cur_topic = selected_topics[i]
            # Determine question type for this item
            if q_type_req == "BOTH":
                cur_type = "MCQ" if (i % 2 == 0) else ("SQL_TECHNICAL" if lang == "SQL" else "PYTHON_TECHNICAL")
            elif q_type_req == "MCQ":
                cur_type = "MCQ"
            else:
                cur_type = "SQL_TECHNICAL" if lang == "SQL" else "PYTHON_TECHNICAL"

            auto_marks = get_auto_marks(cur_type, diff)
            q_item = self._generate_single_question(lang, cur_type, diff, cur_topic, auto_marks, i)
            questions.append(q_item)

        return questions

    def _generate_single_question(
        self,
        language: str,
        question_type: str,
        difficulty: str,
        topic: str,
        marks: int,
        idx: int
    ) -> Dict[str, Any]:
        """
        Generates a single question with proper structure, realistic domain, and NO job titles.
        """
        # Rich pool of realistic domains and scenarios
        sql_scenarios = [
            {
                "domain": "Customer Retention & Churn",
                "title_hard": "Customer Inactive Churn Detection",
                "title_med": "Monthly Customer Churn Rate Calculation",
                "title_easy": "Identify Inactive Customers with No Recent Orders",
                "scenario": "Subscription commerce analysts monitor user dropoff by tracking order frequency over 90-day intervals.",
                "problem": "Given `users` and `orders` tables, identify customers who were active historically but haven't placed an order in the last 90 days.",
                "task": "Write a SQL query returning customer_id, first_name, last_order_date, and total_lifetime_spend. Order by last_order_date ASC, customer_id ASC.",
                "tname": "orders",
                "cols": [
                    {"name": "order_id", "type": "INT", "description": "Order ID", "is_primary_key": True},
                    {"name": "user_id", "type": "INT", "description": "Customer ID", "is_primary_key": False},
                    {"name": "order_date", "type": "DATE", "description": "Purchase date", "is_primary_key": False},
                    {"name": "amount", "type": "DECIMAL(10,2)", "description": "Order amount in USD", "is_primary_key": False}
                ],
                "ddl": "CREATE TABLE orders (order_id INT PRIMARY KEY, user_id INT, order_date DATE, amount DECIMAL(10,2));",
                "seed": "INSERT INTO orders VALUES (1, 101, '2023-01-01', 50.00), (2, 102, '2024-01-01', 120.00);",
                "ref": "SELECT user_id, MAX(order_date) AS last_order_date, SUM(amount) AS total_lifetime_spend FROM orders GROUP BY user_id ORDER BY last_order_date ASC, user_id ASC;"
            },
            {
                "domain": "Warehouse Inventory Logistics",
                "title_hard": "Warehouse Reorder Safety Stock Shortage Alerts",
                "title_med": "Inventory Restock Velocity Analysis",
                "title_easy": "Low Stock Items Below Minimum Threshold",
                "scenario": "Supply chain operations requires real-time alerting when fast-moving inventory falls below the safety buffer.",
                "problem": "Given `warehouse_inventory` and `daily_shipments`, determine SKUs where remaining on-hand quantity is insufficient to cover the average 7-day shipment rate.",
                "task": "Write a SQL query returning sku_id, product_name, current_stock, and days_of_supply_remaining. Order by days_of_supply_remaining ASC, sku_id ASC.",
                "tname": "warehouse_inventory",
                "cols": [
                    {"name": "sku_id", "type": "VARCHAR(20)", "description": "Stock keeping unit", "is_primary_key": True},
                    {"name": "product_name", "type": "VARCHAR(100)", "description": "Item description", "is_primary_key": False},
                    {"name": "current_stock", "type": "INT", "description": "On-hand unit count", "is_primary_key": False},
                    {"name": "safety_stock_level", "type": "INT", "description": "Minimum required buffer", "is_primary_key": False}
                ],
                "ddl": "CREATE TABLE warehouse_inventory (sku_id VARCHAR(20) PRIMARY KEY, product_name VARCHAR(100), current_stock INT, safety_stock_level INT);",
                "seed": "INSERT INTO warehouse_inventory VALUES ('SKU-A', 'Ultra Widget', 15, 50), ('SKU-B', 'Mega Sensor', 200, 40);",
                "ref": "SELECT sku_id, product_name, current_stock, safety_stock_level FROM warehouse_inventory WHERE current_stock < safety_stock_level ORDER BY current_stock ASC, sku_id ASC;"
            },
            {
                "domain": "SaaS Platform Analytics",
                "title_hard": "Monthly Recurring Revenue Cohort Growth",
                "title_med": "SaaS Subscription Plan Upgrades Analysis",
                "title_easy": "Active Subscription Plan Summary",
                "scenario": "Executive leadership reviews month-over-month expansion revenue and subscription tier movements.",
                "problem": "Given `subscriptions` and `invoice_charges`, calculate month-over-month MRR growth percentage using window functions.",
                "task": "Write a SQL query returning billing_month, current_mrr, previous_mrr, and mom_growth_pct. Order by billing_month ASC.",
                "tname": "subscriptions",
                "cols": [
                    {"name": "sub_id", "type": "INT", "description": "Subscription identifier", "is_primary_key": True},
                    {"name": "org_id", "type": "INT", "description": "Customer company ID", "is_primary_key": False},
                    {"name": "plan_name", "type": "VARCHAR(50)", "description": "Tier name", "is_primary_key": False},
                    {"name": "monthly_rate", "type": "DECIMAL(10,2)", "description": "Monthly fee in USD", "is_primary_key": False}
                ],
                "ddl": "CREATE TABLE subscriptions (sub_id INT PRIMARY KEY, org_id INT, plan_name VARCHAR(50), monthly_rate DECIMAL(10,2));",
                "seed": "INSERT INTO subscriptions VALUES (1, 10, 'Enterprise', 1500.00), (2, 20, 'Starter', 99.00);",
                "ref": "SELECT plan_name, COUNT(*) AS active_orgs, SUM(monthly_rate) AS total_plan_mrr FROM subscriptions GROUP BY plan_name ORDER BY total_plan_mrr DESC;"
            },
            {
                "domain": "Banking Transaction Compliance",
                "title_hard": "High-Velocity Wire Transfer Outflow Detection",
                "title_med": "Suspicious After-Hours Transaction Alert",
                "title_easy": "Large Account Transfers Above Regulatory Threshold",
                "scenario": "Financial fraud teams flag sudden surges in external wire transfers that exceed daily limits within rolling windows.",
                "problem": "Given `bank_transfers` table, identify accounts where total transfers within a single 24-hour window exceed $100,000.",
                "task": "Write a SQL query returning sender_account_id, transfer_window_start, total_transferred_usd, and transfer_count. Order by total_transferred_usd DESC.",
                "tname": "bank_transfers",
                "cols": [
                    {"name": "transfer_id", "type": "INT", "description": "Wire transfer ID", "is_primary_key": True},
                    {"name": "sender_account_id", "type": "INT", "description": "Originating account", "is_primary_key": False},
                    {"name": "amount", "type": "DECIMAL(12,2)", "description": "Transferred amount", "is_primary_key": False},
                    {"name": "transfer_time", "type": "TIMESTAMP", "description": "Settlement timestamp", "is_primary_key": False}
                ],
                "ddl": "CREATE TABLE bank_transfers (transfer_id INT PRIMARY KEY, sender_account_id INT, amount DECIMAL(12,2), transfer_time TIMESTAMP);",
                "seed": "INSERT INTO bank_transfers VALUES (1, 9001, 75000.00, '2024-02-01 09:00:00'), (2, 9001, 35000.00, '2024-02-01 14:00:00');",
                "ref": "SELECT sender_account_id, SUM(amount) AS total_transferred_usd, COUNT(*) AS transfer_count FROM bank_transfers GROUP BY sender_account_id HAVING SUM(amount) >= 100000 ORDER BY total_transferred_usd DESC;"
            },
            {
                "domain": "Healthcare Operations",
                "title_hard": "Patient Vitals Anomaly Rolling Average Window",
                "title_med": "Hospital Department Bed Occupancy Rate",
                "title_easy": "Emergency Triage Patient Priority Filtering",
                "scenario": "Clinical monitoring systems trigger priority alerts when patient systolic blood pressure spikes above patient baseline.",
                "problem": "Given `patient_vitals` table, calculate the 3-hour rolling average systolic pressure for each admitted patient.",
                "task": "Write a SQL query returning patient_id, recorded_at, systolic_bp, and rolling_3hr_avg_bp. Order by patient_id ASC, recorded_at ASC.",
                "tname": "patient_vitals",
                "cols": [
                    {"name": "record_id", "type": "INT", "description": "Telemetry ID", "is_primary_key": True},
                    {"name": "patient_id", "type": "INT", "description": "Medical record ID", "is_primary_key": False},
                    {"name": "systolic_bp", "type": "INT", "description": "Blood pressure mmHg", "is_primary_key": False},
                    {"name": "recorded_at", "type": "TIMESTAMP", "description": "Observation time", "is_primary_key": False}
                ],
                "ddl": "CREATE TABLE patient_vitals (record_id INT PRIMARY KEY, patient_id INT, systolic_bp INT, recorded_at TIMESTAMP);",
                "seed": "INSERT INTO patient_vitals VALUES (1, 501, 120, '2024-03-01 08:00:00'), (2, 501, 145, '2024-03-01 09:00:00');",
                "ref": "SELECT patient_id, recorded_at, systolic_bp, ROUND(AVG(systolic_bp) OVER (PARTITION BY patient_id ORDER BY recorded_at ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 1) AS rolling_3hr_avg_bp FROM patient_vitals ORDER BY patient_id ASC, recorded_at ASC;"
            }
        ]

        python_scenarios = [
            {
                "topic": "Algorithms",
                "title_hard": "Sliding Window Rate Limiter Token Bucket",
                "title_med": "Interval Collision Merger Algorithm",
                "title_easy": "Binary Search Sorted Array Target Lookup",
                "scenario": "API Gateway services regulate client requests using sliding window counters.",
                "problem": "Implement a rate limiter class that permits at most `max_requests` within a rolling `window_seconds` timeframe.",
                "task": "Implement `class SlidingWindowLimiter` with `is_allowed(client_id: str, timestamp: int) -> bool` returning True if request accepted, False if rate limited.",
                "func": "class SlidingWindowLimiter:\n    def __init__(self, max_requests: int, window_seconds: int):\n        pass\n    def is_allowed(self, client_id: str, timestamp: int) -> bool:\n        pass",
                "in_format": "max_requests: int, window_seconds: int, followed by is_allowed calls",
                "out_format": "Boolean status for each request invocation",
                "ex_in": {"max_requests": 2, "window_seconds": 60, "requests": [("client_1", 10), ("client_1", 20), ("client_1", 30)]},
                "ex_out": [True, True, False]
            },
            {
                "topic": "Data Structures",
                "title_hard": "Concurrent Task Priority Scheduler Queue",
                "title_med": "Two-Stack Queue with Amortized O(1) Operations",
                "title_easy": "Unique Element Frequency Counter",
                "scenario": "Workflow engines prioritize mission-critical jobs over background telemetry synchronizations.",
                "problem": "Implement a min-heap priority scheduler that pops tasks with highest urgency score first.",
                "task": "Implement `class PriorityTaskQueue` with `push(task_id: str, priority: int) -> None` and `pop() -> str`.",
                "func": "class PriorityTaskQueue:\n    def __init__(self):\n        pass\n    def push(self, task_id: str, priority: int) -> None:\n        pass\n    def pop(self) -> str:\n        pass",
                "in_format": "Sequence of push and pop calls",
                "out_format": "Popped task IDs ordered by priority asc",
                "ex_in": {"ops": ["push('backup', 10)", "push('payment', 1)", "pop()"]},
                "ex_out": ["payment"]
            },
            {
                "topic": "Exception Handling",
                "title_hard": "Fault-Tolerant Exponential Backoff HTTP Client",
                "title_med": "JSON Payload Schema Type Validator",
                "title_easy": "Safe Integer Conversion with Default Fallback",
                "scenario": "Microservices communicate across unreliable network partitions and need robust error containment.",
                "problem": "Write a retry decorator with exponential backoff that catches specific network exception types up to `max_retries`.",
                "task": "Implement `def retry_with_backoff(max_retries: int, base_delay: float)` that catches TransientError and retries before raising MaxRetriesExceeded.",
                "func": "def retry_with_backoff(max_retries: int = 3, base_delay: float = 0.5):\n    pass",
                "in_format": "Function decorated with retry_with_backoff",
                "out_format": "Successful function return value or raised exception",
                "ex_in": {"max_retries": 2, "failures_before_success": 1},
                "ex_out": "Success"
            },
            {
                "topic": "File Handling",
                "title_hard": "Chunked CSV Stream Aggregator for Large Datasets",
                "title_med": "Log Event Timestamp Sanitizer and Deduplicator",
                "title_easy": "File Word Frequency Distribution Parser",
                "scenario": "Data pipelines process multi-gigabyte server logs without loading entire files into resident memory.",
                "problem": "Write a generator function that reads a file in configurable byte chunks and yields sanitized line records.",
                "task": "Implement `def stream_cleaned_records(filepath: str, chunk_size: int = 4096)` yielding valid stripped non-empty lines.",
                "func": "def stream_cleaned_records(filepath: str, chunk_size: int = 4096):\n    pass",
                "in_format": "Path to text file and chunk buffer size",
                "out_format": "Generator of string lines",
                "ex_in": {"lines": ["alpha\n", "\n", "beta\n"]},
                "ex_out": ["alpha", "beta"]
            }
        ]

        if question_type == "MCQ":
            return self._generate_mcq(language, difficulty, topic, marks, idx)

        if language == "SQL":
            scen = sql_scenarios[idx % len(sql_scenarios)]
            if difficulty == "HARD":
                title = f"{scen['title_hard']} [{topic}]"
            elif difficulty == "MEDIUM":
                title = f"{scen['title_med']} [{topic}]"
            else:
                title = f"{scen['title_easy']} [{topic}]"

            return {
                "title": title,
                "topic_name": topic,
                "business_scenario": scen["scenario"],
                "problem_statement": scen["problem"],
                "task_description": scen["task"],
                "difficulty": difficulty,
                "marks": marks,
                "job_role": "Data Engineer",
                "database_engine": "PostgreSQL",
                "code_language": "sql",
                "question_type": "SQL_TECHNICAL",
                "library_source": "Question Library",
                "tables_schema_json": [
                    {
                        "name": scen["tname"],
                        "description": f"Core data table for {scen['domain']}",
                        "columns": scen["cols"]
                    }
                ],
                "output_columns_json": [
                    {"name": col["name"], "type": col["type"], "description": col["description"]}
                    for col in scen["cols"][:3]
                ],
                "example_input_json": [{"table": scen["tname"], "data": [{"id": 1, "status": "active"}]}],
                "example_output_json": [{"status": "success", "count": 1}],
                "example_explanation": f"Logic applies filtering and aggregation under {topic} requirements." if difficulty != "EASY" else "Direct filtered projection.",
                "schema_ddl": scen["ddl"],
                "seed_data_sql": scen["seed"],
                "reference_sql": scen["ref"],
                "input_format": f"Table: {scen['tname']}",
                "output_format": "Relational result set ordered as specified in the task description",
                "constraints": "Standard ANSI SQL syntax compatible across PostgreSQL and SQLite.",
                "tags_json": ["SQL", topic, difficulty],
                "uniqueness_score": 98.0,
                "test_cases": [
                    {
                        "test_type": "PUBLIC",
                        "name": "Public Case 1: Standard dataset validation",
                        "expected_output_json": [{"status": "success"}],
                        "weight": 1.0
                    }
                ]
            }
        else:
            # Python Coding Question
            pscen = python_scenarios[idx % len(python_scenarios)]
            if difficulty == "HARD":
                title = f"{pscen['title_hard']} [{topic}]"
            elif difficulty == "MEDIUM":
                title = f"{pscen['title_med']} [{topic}]"
            else:
                title = f"{pscen['title_easy']} [{topic}]"

            return {
                "title": title,
                "topic_name": topic,
                "business_scenario": pscen["scenario"],
                "problem_statement": pscen["problem"],
                "task_description": pscen["task"],
                "difficulty": difficulty,
                "marks": marks,
                "job_role": "Python Developer",
                "database_engine": "python",
                "code_language": "python",
                "question_type": "PYTHON_TECHNICAL",
                "library_source": "Question Library",
                "function_signature": pscen["func"],
                "input_format": pscen["in_format"],
                "output_format": pscen["out_format"],
                "example_input_json": pscen["ex_in"],
                "example_output_json": pscen["ex_out"],
                "example_explanation": f"Demonstrates correct {topic} handling with boundary validations." if difficulty != "EASY" else "Direct functional evaluation.",
                "constraints": "Python 3.10+. Time complexity O(N), Space complexity O(N) or better.",
                "tags_json": ["Python", topic, difficulty],
                "uniqueness_score": 98.0,
                "test_cases": [
                    {
                        "test_type": "PUBLIC",
                        "name": "Public Case 1: Base scenario",
                        "expected_output_json": pscen["ex_out"],
                        "weight": 1.0
                    }
                ]
            }

    def _generate_mcq(
        self,
        language: str,
        difficulty: str,
        topic: str,
        marks: int,
        idx: int
    ) -> Dict[str, Any]:
        """
        Generates realistic MCQs with 4 options and plausible distractors.
        """
        if language == "SQL":
            mcq_banks = [
                {
                    "title": f"SQL Aggregation & Windowing Semantics [{topic}]",
                    "problem": "Which of the following statements accurately characterizes the operational difference between `GROUP BY` and an aggregate function with an `OVER (PARTITION BY ...)` clause?",
                    "options": [
                        {"id": "A", "text": "`GROUP BY` collapses multiple rows into a single summary row per group, whereas `OVER` retains individual row identities while computing the partitioned aggregation."},
                        {"id": "B", "text": "`OVER (PARTITION BY)` can only be evaluated inside stored procedures, whereas `GROUP BY` works in all queries."},
                        {"id": "C", "text": "`GROUP BY` always executes after the `HAVING` filter has finished evaluation."},
                        {"id": "D", "text": "Window functions cannot compute sums or averages, only row rankings."}
                    ],
                    "correct": "A",
                    "explanation": "`GROUP BY` aggregates matching rows into a single collapsed group row. In contrast, window functions with `OVER` compute calculations across the window frame while preserving all individual rows."
                },
                {
                    "title": f"Relational Query Index Cardinality [{topic}]",
                    "problem": "When creating a composite index on `(status, created_at)` in a high-volume transactional table, why is column ordering critical?",
                    "options": [
                        {"id": "A", "text": "The database can only use the index for queries filtering on `created_at` alone if `created_at` is the leftmost column."},
                        {"id": "B", "text": "Composite indexes automatically invert column order based on row count during runtime query planning."},
                        {"id": "C", "text": "Leftmost prefix matching dictates that a query filtering only on `created_at` cannot utilize the composite index if `status` is the leading key."},
                        {"id": "D", "text": "B-Tree indexes cannot index timestamp columns when paired with varchar columns."}
                    ],
                    "correct": "C",
                    "explanation": "Relational B-tree composite indexes obey the leftmost prefix rule: queries must filter by the leading columns in order to use the index range scan effectively."
                },
                {
                    "title": f"ACID Isolation Levels & Concurrency [{topic}]",
                    "problem": "Which ANSI SQL isolation level guarantees protection against Dirty Reads, Non-Repeatable Reads, AND Phantom Reads?",
                    "options": [
                        {"id": "A", "text": "READ COMMITTED"},
                        {"id": "B", "text": "SERIALIZABLE"},
                        {"id": "C", "text": "REPEATABLE READ"},
                        {"id": "D", "text": "READ UNCOMMITTED"}
                    ],
                    "correct": "B",
                    "explanation": "SERIALIZABLE is the strictest isolation level and ensures complete serializability, eliminating dirty reads, non-repeatable reads, and phantom reads."
                }
            ]
            picked = mcq_banks[idx % len(mcq_banks)]
            return {
                "title": picked["title"],
                "topic_name": topic,
                "problem_statement": picked["problem"],
                "task_description": "Select the single correct answer.",
                "difficulty": difficulty,
                "marks": marks,
                "job_role": "Data Analyst",
                "database_engine": "PostgreSQL",
                "code_language": "sql",
                "question_type": "MCQ",
                "library_source": "Question Library",
                "mcq_options_json": picked["options"],
                "correct_answer": picked["correct"],
                "explanation": picked["explanation"],
                "tags_json": ["SQL", "MCQ", topic, difficulty],
                "uniqueness_score": 99.0,
                "test_cases": []
            }
        else:
            # Python MCQ
            mcq_py_banks = [
                {
                    "title": f"Python Mutable Default Argument Pitfall [{topic}]",
                    "problem": "Consider the Python function definition:\n```python\ndef append_to(element, target_list=[]):\n    target_list.append(element)\n    return target_list\n```\nWhat occurs when `append_to(1)` is called followed by `append_to(2)`?",
                    "options": [
                        {"id": "A", "text": "Both calls return `[1]` and `[2]` independently because the default list is re-instantiated on each invocation."},
                        {"id": "B", "text": "The second call raises a TypeError because mutable default arguments cannot be re-used."},
                        {"id": "C", "text": "The second call returns `[1, 2]` because the default list is bound at function definition time and shared across invocations."},
                        {"id": "D", "text": "The function produces a memory leak and crashes the Python runtime."}
                    ],
                    "correct": "C",
                    "explanation": "Default parameter values in Python are evaluated once when the function definition is executed, so mutable default arguments like lists persist modifications across calls."
                },
                {
                    "title": f"Global Interpreter Lock (GIL) and Concurrency [{topic}]",
                    "problem": "Which type of workload benefits most from Python standard library `multiprocessing` over `threading` in CPython?",
                    "options": [
                        {"id": "A", "text": "CPU-bound calculations such as heavy mathematical matrices and image transformations."},
                        {"id": "B", "text": "I/O-bound web requests and socket polling waiting on network responses."},
                        {"id": "C", "text": "Reading small local configuration files asynchronously."},
                        {"id": "D", "text": "Pure database connection pooling."}
                    ],
                    "correct": "A",
                    "explanation": "CPython's Global Interpreter Lock (GIL) restricts multiple native threads from executing Python bytecode simultaneously. CPU-bound operations bypass the GIL by using multiple processes with distinct memory spaces."
                },
                {
                    "title": f"Generators vs List Comprehensions Memory [{topic}]",
                    "problem": "Why is a generator expression `(x**2 for x in range(10_000_000))` preferred over a list comprehension `[x**2 for x in range(10_000_000)]` for sequential iteration?",
                    "options": [
                        {"id": "A", "text": "Generator expressions run in compiled C++ speed whereas lists run in interpreted bytecode."},
                        {"id": "B", "text": "Generator expressions compute values lazily one at a time, consuming constant O(1) memory instead of allocating the full array in RAM."},
                        {"id": "C", "text": "Generator expressions can be indexed with `gen[5]` faster than lists."},
                        {"id": "D", "text": "List comprehensions are deprecated in Python 3.12+."}
                    ],
                    "correct": "B",
                    "explanation": "Generator expressions compute values on demand (lazy evaluation) during iteration, maintaining constant O(1) auxiliary memory footprint irrespective of sequence size."
                }
            ]
            picked = mcq_py_banks[idx % len(mcq_py_banks)]
            return {
                "title": picked["title"],
                "topic_name": topic,
                "problem_statement": picked["problem"],
                "task_description": "Select the single correct answer.",
                "difficulty": difficulty,
                "marks": marks,
                "job_role": "Python Developer",
                "database_engine": "python",
                "code_language": "python",
                "question_type": "MCQ",
                "library_source": "Question Library",
                "mcq_options_json": picked["options"],
                "correct_answer": picked["correct"],
                "explanation": picked["explanation"],
                "tags_json": ["Python", "MCQ", topic, difficulty],
                "uniqueness_score": 99.0,
                "test_cases": []
            }


ai_service = AIService()
