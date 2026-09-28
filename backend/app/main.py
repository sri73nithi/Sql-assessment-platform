from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from sqlalchemy import select
from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.models import (
    User, Topic, Question, TestCase, Assessment, AssessmentAssignment,
    CandidateAttempt, Invitation, StudentSubmission, ProctoringEvent, AuditLog
)
from app.api.endpoints import (
    auth, students, topics, questions, generation, assessments, invitations, submissions, reports, audit
)

app = FastAPI(
    title="SQL Assessment Management Platform API",
    description="Production-Grade SQL Assessment Platform with AI Question Generation & Security Sandbox",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def sync_sqlite_columns(sync_conn):
    try:
        import sqlite3
        con = sqlite3.connect("platform.db")
        cur = con.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        existing_tables = set(r[0] for r in cur.fetchall())

        for table_name, table in Base.metadata.tables.items():
            if table_name not in existing_tables:
                continue
            cur.execute(f"PRAGMA table_info({table_name})")
            existing_cols = {r[1] for r in cur.fetchall()}
            for col in table.columns:
                if col.name not in existing_cols:
                    col_type = "TEXT"
                    type_str = str(col.type).upper()
                    if "INT" in type_str:
                        col_type = "INTEGER"
                    elif "NUMERIC" in type_str or "FLOAT" in type_str or "DECIMAL" in type_str:
                        col_type = "NUMERIC"
                    elif "BOOL" in type_str:
                        col_type = "BOOLEAN"
                    elif "DATETIME" in type_str or "TIMESTAMP" in type_str:
                        col_type = "TIMESTAMP"
                    elif "JSON" in type_str:
                        col_type = "JSON"
                    elif "VARCHAR" in type_str or "CHAR" in type_str:
                        col_type = str(col.type)

                    cur.execute(f"ALTER TABLE {table_name} ADD COLUMN {col.name} {col_type}")

        con.commit()
        con.close()
    except Exception as e:
        print(f"Column migration notice: {e}")


async def seed_data():
    """Seeds default single Admin account (admin@assessment.com / admin123) and standard SQL topics."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(sync_sqlite_columns)

    async with AsyncSessionLocal() as session:
        # Seed default Admin account if not existing
        stmt_admin = select(User).where(User.email == "admin@assessment.com")
        res_admin = await session.execute(stmt_admin)
        admin = res_admin.scalar_one_or_none()

        if not admin:
            admin_user = User(
                email="admin@assessment.com",
                password_hash=get_password_hash("admin123"),
                full_name="System Administrator",
                role="admin",
                is_active=True
            )
            session.add(admin_user)

            # Seed standard SQL Topics
            default_topics = [
                ("SELECT", "Basic query data retrieval"),
                ("WHERE", "Filtering records by condition"),
                ("ORDER BY", "Sorting result sets"),
                ("GROUP BY", "Group aggregation"),
                ("HAVING", "Filtered group aggregation"),
                ("JOIN", "Inner, Left, Right, Full entity joins"),
                ("SUBQUERY", "Nested query expressions"),
                ("CTE", "Common Table Expressions (WITH clause)"),
                ("UNION", "Set operations and combinations"),
                ("Window Functions", "Analytical ranking, row numbers, lag, and lead")
            ]
            for tname, tdesc in default_topics:
                session.add(Topic(name=tname, description=tdesc))

            await session.commit()
            print("Database initialized and Admin account (admin@assessment.com / admin123) seeded.")

        # Seed standard named admins
        stmt_vk = select(User).where(User.email == "vinodkumar.chandrasekar@agilisium.com")
        res_vk = await session.execute(stmt_vk)
        vk_admin = res_vk.scalar_one_or_none()
        if not vk_admin:
            vk_admin = User(
                email="vinodkumar.chandrasekar@agilisium.com",
                password_hash=get_password_hash("admin123"),
                full_name="Vinodkumar Chandrasekar",
                role="admin",
                is_active=True
            )
            session.add(vk_admin)
            await session.commit()
            print("Seeded 'Vinodkumar Chandrasekar' admin account.")

        stmt_monisha = select(User).where(User.email == "monisha.r@agilisium.com")
        res_monisha = await session.execute(stmt_monisha)
        monisha_admin = res_monisha.scalar_one_or_none()
        if not monisha_admin:
            monisha_admin = User(
                email="monisha.r@agilisium.com",
                password_hash=get_password_hash("admin123"),
                full_name="Monisha R",
                role="admin",
                is_active=True
            )
            session.add(monisha_admin)
            await session.commit()
            print("Seeded 'Monisha R' admin account.")

        # Seed default Candidate account if not existing
        stmt_stu = select(User).where(User.email == "student@assessment.com")
        res_stu = await session.execute(stmt_stu)
        stu = res_stu.scalar_one_or_none()
        if not stu:
            stu_user = User(
                email="student@assessment.com",
                password_hash=get_password_hash("student123"),
                full_name="Alex Mercer",
                student_id_code="STU-1001",
                role="student",
                is_active=True
            )
            session.add(stu_user)
            await session.commit()
            print("Candidate account (student@assessment.com / student123) seeded.")


        # Seed Avenger Deployment Streaks Question if not present
        stmt_q = select(Question).where(Question.title == "Avenger Deployment Streaks")
        res_q = await session.execute(stmt_q)
        existing_q = res_q.scalar_one_or_none()

        if not existing_q:
            # Fetch Window Functions topic
            stmt_t = select(Topic).where(Topic.name == "Window Functions")
            res_t = await session.execute(stmt_t)
            window_topic = res_t.scalar_one_or_none()
            topic_id = window_topic.id if window_topic else (await session.execute(select(Topic))).scalars().first().id

            avenger_q = Question(
                topic_id=topic_id,
                title="Avenger Deployment Streaks",
                business_scenario="Command wants to identify each hero's uninterrupted periods of active duty across battle deployments.",
                problem_statement="You are given three tables: heroes, battles, and deployments. The heroes table stores information about Avengers. The battles table contains the details of battles, including the date and location of each battle. The deployments table records every battle in which a hero was deployed.",
                task_description="Write an SQL query to:\n1. Identify, for each hero, every sequence of consecutive calendar days on which the hero was active.\n2. Treat consecutive days as part of the same streak only when there is no gap between the active dates.\n3. Return only streaks that span two or more consecutive days (streak_length >= 2). Ignore single active days.\n4. Display hero_name, streak_start, streak_end, streak_length.\n5. Sort by hero_name ASC, streak_start ASC, hero_id ASC.",
                notes="Consecutive days are calculated using DATE functions and ROW_NUMBER() window partitioning.",
                requirements="Columns: hero_name, streak_start, streak_end, streak_length. Ordered by hero_name ASC, streak_start ASC.",
                difficulty="HARD",
                job_role="Senior SQL Developer",
                database_engine="sqlite",
                tables_schema_json=[
                    {
                        "name": "heroes",
                        "description": "Unique hero identifiers and power levels",
                        "columns": [
                            {"name": "hero_id", "type": "INT", "description": "Unique hero identifier", "is_primary_key": True},
                            {"name": "hero_name", "type": "VARCHAR(100)", "description": "Name of the hero", "is_primary_key": False},
                            {"name": "power_level", "type": "INT", "description": "Hero rated power level", "is_primary_key": False}
                        ]
                    },
                    {
                        "name": "battles",
                        "description": "Battle dates and locations",
                        "columns": [
                            {"name": "battle_id", "type": "INT", "description": "Unique battle identifier", "is_primary_key": True},
                            {"name": "battle_date", "type": "DATE", "description": "Calendar date the battle took place", "is_primary_key": False},
                            {"name": "location", "type": "VARCHAR(50)", "description": "Physical site of the battle", "is_primary_key": False}
                        ]
                    },
                    {
                        "name": "deployments",
                        "description": "Hero battle deployment records",
                        "columns": [
                            {"name": "deployment_id", "type": "INT", "description": "Unique deployment record identifier", "is_primary_key": True},
                            {"name": "hero_id", "type": "INT", "description": "Hero who was deployed", "is_primary_key": False},
                            {"name": "battle_id", "type": "INT", "description": "Battle the hero was deployed to", "is_primary_key": False}
                        ]
                    }
                ],
                schema_ddl="""CREATE TABLE heroes (hero_id INT PRIMARY KEY, hero_name VARCHAR(100), power_level INT);
CREATE TABLE battles (battle_id INT PRIMARY KEY, battle_date DATE, location VARCHAR(50));
CREATE TABLE deployments (deployment_id INT PRIMARY KEY, hero_id INT, battle_id INT);""",
                seed_data_sql="""INSERT INTO heroes VALUES (1, 'Iron Man', 85), (2, 'Captain America', 78), (3, 'Thor', 95), (4, 'Hulk', 99), (5, 'Black Widow', 70);
INSERT INTO battles VALUES (1, '2024-01-10', 'New York'), (2, '2024-01-11', 'New York'), (3, '2024-01-12', 'New York'), (4, '2024-01-20', 'Sokovia'), (5, '2024-02-01', 'Wakanda');
INSERT INTO deployments VALUES (1, 1, 1), (2, 1, 2), (3, 1, 3), (4, 1, 4), (5, 2, 5);""",
                reference_sql="""WITH hero_active_dates AS (
    SELECT DISTINCT d.hero_id, b.battle_date
    FROM deployments d JOIN battles b ON d.battle_id = b.battle_id
),
date_groups AS (
    SELECT hero_id, battle_date, JULIANDAY(battle_date) - ROW_NUMBER() OVER (PARTITION BY hero_id ORDER BY battle_date) AS grp
    FROM hero_active_dates
),
streaks AS (
    SELECT hero_id, MIN(battle_date) AS streak_start, MAX(battle_date) AS streak_end, COUNT(*) AS streak_length
    FROM date_groups GROUP BY hero_id, grp HAVING COUNT(*) >= 2
)
SELECT h.hero_name, s.streak_start, s.streak_end, s.streak_length
FROM streaks s JOIN heroes h ON s.hero_id = h.hero_id
ORDER BY h.hero_name ASC, s.streak_start ASC, h.hero_id ASC;""",
                marks=50,
                status="ACTIVE",
                input_format="Table 'heroes' (hero_id INT, hero_name VARCHAR, power_level INT)\nTable 'battles' (battle_id INT, battle_date DATE, location VARCHAR)\nTable 'deployments' (deployment_id INT, hero_id INT, battle_id INT)",
                output_format="hero_name (VARCHAR), streak_start (DATE), streak_end (DATE), streak_length (INT)\nOrdered by: hero_name ASC, streak_start ASC, hero_id ASC",
                output_columns_json=[
                    {"name": "hero_name", "type": "VARCHAR(100)", "description": "Name of the hero"},
                    {"name": "streak_start", "type": "DATE", "description": "First active day of the streak"},
                    {"name": "streak_end", "type": "DATE", "description": "Last active day of the streak"},
                    {"name": "streak_length", "type": "INT", "description": "Number of consecutive active days"}
                ],
                constraints="streak_length >= 2\nhero_id is unique in heroes table\nbattle_date is valid calendar date (YYYY-MM-DD)\nDuplicate deployments of the same hero on the same date count once",
                example_input_json=[
                    {"table": "heroes", "data": [{"hero_id": 1, "hero_name": "Iron Man", "power_level": 85}, {"hero_id": 2, "hero_name": "Captain America", "power_level": 78}]},
                    {"table": "battles", "data": [{"battle_id": 1, "battle_date": "2024-01-10", "location": "New York"}, {"battle_id": 2, "battle_date": "2024-01-11", "location": "New York"}, {"battle_id": 3, "battle_date": "2024-01-12", "location": "New York"}]},
                    {"table": "deployments", "data": [{"deployment_id": 1, "hero_id": 1, "battle_id": 1}, {"deployment_id": 2, "hero_id": 1, "battle_id": 2}, {"deployment_id": 3, "hero_id": 1, "battle_id": 3}]}
                ],
                example_output_json=[
                    {"hero_name": "Iron Man", "streak_start": "2024-01-10", "streak_end": "2024-01-12", "streak_length": 3}
                ],
                example_explanation="Iron Man was deployed on 3 consecutive calendar days (2024-01-10 through 2024-01-12) during the Battle of New York. This forms an unbroken streak of length 3, which satisfies the streak_length >= 2 requirement.",
                supported_databases_json=["PostgreSQL", "MySQL", "SQLite"],
                tags_json=["SQL", "Window Functions", "Gaps and Islands", "Date Operations", "Subqueries"]
            )
            session.add(avenger_q)
            await session.flush()

            # Add Public and Hidden test cases
            tc_public = TestCase(
                question_id=avenger_q.id,
                name="Public Sample: Consecutive Battles",
                test_type="PUBLIC",
                input_setup_sql=avenger_q.seed_data_sql,
                expected_output_json=[
                    {"hero_name": "Iron Man", "streak_start": "2024-01-10", "streak_end": "2024-01-12", "streak_length": 3}
                ],
                weight=25.0
            )
            tc_hidden = TestCase(
                question_id=avenger_q.id,
                name="Hidden Test: Multiple Streaks & Gaps",
                test_type="HIDDEN",
                input_setup_sql="""INSERT INTO heroes VALUES (6, 'Thor', 99);
INSERT INTO battles VALUES (10, '2024-03-01', 'Asgard'), (11, '2024-03-02', 'Asgard');
INSERT INTO deployments VALUES (10, 6, 10), (11, 6, 11);""",
                expected_output_json=[
                    {"hero_name": "Iron Man", "streak_start": "2024-01-10", "streak_end": "2024-01-12", "streak_length": 3},
                    {"hero_name": "Thor", "streak_start": "2024-03-01", "streak_end": "2024-03-02", "streak_length": 2}
                ],
                weight=25.0
            )
            session.add(tc_public)
            session.add(tc_hidden)
            await session.commit()
            print("Seeded 'Avenger Deployment Streaks' question with test cases.")
        else:
            existing_q.input_format = "Table 'heroes' (hero_id INT, hero_name VARCHAR, power_level INT)\nTable 'battles' (battle_id INT, battle_date DATE, location VARCHAR)\nTable 'deployments' (deployment_id INT, hero_id INT, battle_id INT)"
            existing_q.output_format = "hero_name (VARCHAR), streak_start (DATE), streak_end (DATE), streak_length (INT)\nOrdered by: hero_name ASC, streak_start ASC, hero_id ASC"
            existing_q.output_columns_json = [
                {"name": "hero_name", "type": "VARCHAR(100)", "description": "Name of the hero"},
                {"name": "streak_start", "type": "DATE", "description": "First active day of the streak"},
                {"name": "streak_end", "type": "DATE", "description": "Last active day of the streak"},
                {"name": "streak_length", "type": "INT", "description": "Number of consecutive active days"}
            ]
            existing_q.constraints = "streak_length >= 2\nhero_id is unique in heroes table\nbattle_date is valid calendar date (YYYY-MM-DD)\nDuplicate deployments of the same hero on the same date count once"
            existing_q.example_input_json = [
                {"table": "heroes", "data": [{"hero_id": 1, "hero_name": "Iron Man", "power_level": 85}, {"hero_id": 2, "hero_name": "Captain America", "power_level": 78}]},
                {"table": "battles", "data": [{"battle_id": 1, "battle_date": "2024-01-10", "location": "New York"}, {"battle_id": 2, "battle_date": "2024-01-11", "location": "New York"}, {"battle_id": 3, "battle_date": "2024-01-12", "location": "New York"}]},
                {"table": "deployments", "data": [{"deployment_id": 1, "hero_id": 1, "battle_id": 1}, {"deployment_id": 2, "hero_id": 1, "battle_id": 2}, {"deployment_id": 3, "hero_id": 1, "battle_id": 3}]}
            ]
            existing_q.example_output_json = [
                {"hero_name": "Iron Man", "streak_start": "2024-01-10", "streak_end": "2024-01-12", "streak_length": 3}
            ]
            existing_q.example_explanation = "Iron Man was deployed on 3 consecutive calendar days (2024-01-10 through 2024-01-12) during the Battle of New York. This forms an unbroken streak of length 3, which satisfies the streak_length >= 2 requirement."
            existing_q.supported_databases_json = ["PostgreSQL", "MySQL", "SQLite"]
            existing_q.tags_json = ["SQL", "Window Functions", "Gaps and Islands", "Date Operations", "Subqueries"]
            
            tc_check = await session.execute(select(TestCase).where(TestCase.question_id == existing_q.id))
            if not tc_check.scalars().first():
                tc_pub = TestCase(
                    question_id=existing_q.id,
                    name="Public Sample: Consecutive Battles",
                    test_type="PUBLIC",
                    input_setup_sql=existing_q.seed_data_sql,
                    expected_output_json=[
                        {"hero_name": "Iron Man", "streak_start": "2024-01-10", "streak_end": "2024-01-12", "streak_length": 3}
                    ],
                    weight=25.0
                )
                tc_hid = TestCase(
                    question_id=existing_q.id,
                    name="Hidden Test: Multiple Streaks & Gaps",
                    test_type="HIDDEN",
                    input_setup_sql="""INSERT INTO heroes VALUES (6, 'Thor', 99);
INSERT INTO battles VALUES (10, '2024-03-01', 'Asgard'), (11, '2024-03-02', 'Asgard');
INSERT INTO deployments VALUES (10, 6, 10), (11, 6, 11);""",
                    expected_output_json=[
                        {"hero_name": "Iron Man", "streak_start": "2024-01-10", "streak_end": "2024-01-12", "streak_length": 3},
                        {"hero_name": "Thor", "streak_start": "2024-03-01", "streak_end": "2024-03-02", "streak_length": 2}
                    ],
                    weight=25.0
                )
                session.add(tc_pub)
                session.add(tc_hid)
            await session.commit()
            print("Updated 'Avenger Deployment Streaks' with full metadata and test cases.")

        # Ensure assessments have POC and test admin links
        from app.models.models import Assessment, AssessmentAdmin, AssessmentAssignment, Invitation, StudentSubmission, ProctoringEvent
        stmt_all_ass = select(Assessment)
        res_all_ass = await session.execute(stmt_all_ass)
        all_ass = res_all_ass.scalars().all()
        for a in all_ass:
            if vk_admin and not a.point_of_contact_id:
                a.point_of_contact_id = vk_admin.id
            if vk_admin and a.created_by != vk_admin.id:
                stmt_link_vk = select(AssessmentAdmin).where(AssessmentAdmin.assessment_id == a.id, AssessmentAdmin.user_id == vk_admin.id)
                res_link_vk = await session.execute(stmt_link_vk)
                if not res_link_vk.scalar_one_or_none():
                    session.add(AssessmentAdmin(assessment_id=a.id, user_id=vk_admin.id, role="All access"))

        # Seed sample candidates
        sample_candidates = [
            ("nithiyaa2303@gmail.com", "Nithiyaa dhershini M", "STU-1001", "REVIEW_PENDING", 45.0, 90.0),
            ("potdarekaknksha7@gmail.com", "Akanksha Arun Potdar", "STU-1002", "COMPLETED", 50.0, 100.0),
            ("lathika.chowdary@gmail.com", "Korrapati Lathika Chowdary", "STU-1003", "SHORTLISTED", 48.0, 96.0),
            ("rahul.sharma@agilisium.com", "Rahul Sharma", "STU-1004", "INVITED", 0.0, 0.0),
            ("priya.patel@agilisium.com", "Priya Patel", "STU-1005", "TEST_RESET", 0.0, 0.0)
        ]

        for email_addr, name, code, c_status, score, pct in sample_candidates:
            stmt_cand = select(User).where(User.email == email_addr)
            res_cand = await session.execute(stmt_cand)
            cand_user = res_cand.scalar_one_or_none()
            if not cand_user:
                cand_user = User(
                    email=email_addr,
                    password_hash=get_password_hash("student123"),
                    full_name=name,
                    student_id_code=code,
                    role="student",
                    is_active=True
                )
                session.add(cand_user)
                await session.flush()

            # Link to all assessments if not already linked
            for a in all_ass:
                stmt_asgn = select(AssessmentAssignment).where(
                    AssessmentAssignment.assessment_id == a.id,
                    AssessmentAssignment.student_id == cand_user.id
                )
                res_asgn = await session.execute(stmt_asgn)
                if not res_asgn.scalar_one_or_none():
                    now = datetime.utcnow()
                    is_done = c_status in ["COMPLETED", "REVIEW_PENDING", "SHORTLISTED"]
                    asgn = AssessmentAssignment(
                        assessment_id=a.id,
                        student_id=cand_user.id,
                        status=c_status,
                        assigned_at=now - timedelta(days=2),
                        started_at=now - timedelta(hours=3) if is_done else (now - timedelta(minutes=30) if c_status == "IN_PROGRESS" else None),
                        completed_at=now - timedelta(hours=2) if is_done else None,
                        total_score=score if is_done else 0.0,
                        percentage=pct if is_done else 0.0,
                        attempt_percentage=100.0 if is_done else 0.0,
                        integrity_status="Acceptable" if code != "STU-1005" else "Suspicious",
                        integrity_score=98.0 if code != "STU-1005" else 75.0,
                        interview_details_json={
                            "scheduled_at": "2026-06-25 10:00 AM",
                            "interviewer": "Vinodkumar Chandrasekar",
                            "meeting_link": "https://meet.google.com/abc-defg-hij",
                            "notes": "Technical screening - SQL & Data Engineering"
                        } if c_status == "SHORTLISTED" else None
                    )
                    session.add(asgn)
                    await session.flush()

                    # Add invitation token
                    inv = Invitation(
                        assignment_id=asgn.id,
                        student_id=cand_user.id,
                        assessment_id=a.id,
                        token_hash=f"tok_{cand_user.id[:8]}_{a.id[:8]}",
                        status="COMPLETED" if is_done else ("OPENED" if c_status == "TEST_RESET" else "PENDING"),
                        expires_at=now + timedelta(days=7),
                        sent_at=now - timedelta(days=2),
                        opened_at=now - timedelta(hours=3) if is_done else None,
                        completed_at=now - timedelta(hours=2) if is_done else None
                    )
                    session.add(inv)

                    # Add sample proctoring events
                    if is_done and code == "STU-1001":
                        session.add(ProctoringEvent(
                            assessment_id=a.id,
                            student_id=cand_user.id,
                            event_type="TAB_SWITCH",
                            violation_count=1,
                            details_json={"reason": "Switched tab to browser window"}
                        ))

        await session.commit()
        print("Seeded sample assessment candidates and assignments.")



@app.on_event("startup")
async def on_startup():
    try:
        await seed_data()
        async with AsyncSessionLocal() as session:
            from app.services.question_bank_seeder import seed_question_bank
            await seed_question_bank(session)
    except Exception as e:
        print(f"Startup seeding notice: {e}")


# Router registrations
from app.api.endpoints import candidates
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(students.router, prefix="/api/students", tags=["Student Management"])
app.include_router(topics.router, prefix="/api/topics", tags=["Topic Management"])
app.include_router(questions.router, prefix="/api/questions", tags=["Question Library"])
app.include_router(generation.router, prefix="/api/question-generation", tags=["AI Question Generation"])
app.include_router(assessments.router, prefix="/api/assessments", tags=["Assessment Management"])
app.include_router(candidates.router, prefix="/api/assessments", tags=["Candidate Management"])
app.include_router(invitations.router, prefix="/api/invitations", tags=["Invitations & Student Access"])
app.include_router(submissions.router, prefix="/api/submissions", tags=["Submissions & Sandbox"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports & Analytics"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit Log"])




@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}

