import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Integer,
    ForeignKey,
    Text,
    Numeric,
    JSON,
    Table,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False, default="User")
    student_id_code = Column(String(50), nullable=True, index=True)  # e.g. STU-1001
    role = Column(String(20), nullable=False, default="student")  # admin, student
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    created_assessments = relationship("Assessment", foreign_keys="[Assessment.created_by]", back_populates="creator")
    assignments = relationship("AssessmentAssignment", back_populates="student", cascade="all, delete-orphan")
    submissions = relationship("StudentSubmission", back_populates="student", cascade="all, delete-orphan")
    invitations = relationship("Invitation", back_populates="student", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="actor")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    questions = relationship("Question", back_populates="topic")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    business_scenario = Column(Text, nullable=False)
    problem_statement = Column(Text, nullable=False)
    task_description = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    difficulty = Column(String(20), nullable=False)  # EASY, MEDIUM, HARD
    job_role = Column(String(100), nullable=False, default="Data Engineer")
    database_engine = Column(String(50), nullable=False, default="PostgreSQL")
    tables_schema_json = Column(JSON, nullable=False, default=list)  # Table definitions, columns, data types
    schema_ddl = Column(Text, nullable=False, default="")
    seed_data_sql = Column(Text, nullable=False, default="")
    reference_sql = Column(Text, nullable=False, default="")
    marks = Column(Integer, nullable=False, default=10)
    status = Column(String(20), nullable=False, default="ACTIVE")  # ACTIVE, ARCHIVED

    # Extended Question Types (MCQ, SQL_TECHNICAL, PYTHON_TECHNICAL)
    question_type = Column(String(30), nullable=False, default="SQL_TECHNICAL")
    mcq_options_json = Column(JSON, nullable=True)  # [{"id": "A", "text": "..."}]
    correct_answer = Column(String(255), nullable=True)  # Hidden from student API
    explanation = Column(Text, nullable=True)  # Hidden from student API
    code_language = Column(String(50), nullable=True, default="sql")  # sql, python
    function_signature = Column(Text, nullable=True)  # e.g. def maxArea(height):
    input_format = Column(Text, nullable=True)
    output_format = Column(Text, nullable=True)
    constraints = Column(Text, nullable=True)
    example_input_json = Column(JSON, nullable=True)
    example_output_json = Column(JSON, nullable=True)
    output_columns_json = Column(JSON, nullable=True)  # [{"name": "col", "type": "VARCHAR", "description": "..."}]
    example_explanation = Column(Text, nullable=True)
    supported_databases_json = Column(JSON, nullable=True, default=lambda: ["PostgreSQL", "MySQL", "SQLite"])
    tags_json = Column(JSON, nullable=True, default=list)  # ["SQL", "Window Functions"]
    usage_count = Column(Integer, nullable=False, default=0)
    library_source = Column(String(50), nullable=False, default="Question Library")
    uniqueness_score = Column(Numeric(5, 2), nullable=True, default=100.0)
    created_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    topic = relationship("Topic", back_populates="questions")
    fingerprint = relationship("QuestionFingerprint", back_populates="question", uselist=False, cascade="all, delete-orphan")
    test_cases = relationship("TestCase", back_populates="question", cascade="all, delete-orphan")
    assessment_links = relationship("AssessmentQuestion", back_populates="question", cascade="all, delete-orphan")
    submissions = relationship("StudentSubmission", back_populates="question", cascade="all, delete-orphan")


class QuestionFingerprint(Base):
    __tablename__ = "question_fingerprints"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, unique=True)
    exact_text_hash = Column(String(64), unique=True, nullable=False, index=True)
    canonical_problem_hash = Column(String(64), nullable=False, index=True)
    sql_structure_hash = Column(String(64), nullable=False, index=True)
    schema_fingerprint_hash = Column(String(64), nullable=False)
    semantic_vector_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Fingerprints remain permanently even if Question is deleted or archived!
    question = relationship("Question", back_populates="fingerprint")


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    test_type = Column(String(20), nullable=False, default="PUBLIC")  # PUBLIC, HIDDEN
    name = Column(String(100), nullable=False)
    input_setup_sql = Column(Text, nullable=True)
    expected_output_json = Column(JSON, nullable=False)  # Serialized expected rows: [{"col1": val1}]
    weight = Column(Numeric(5, 2), nullable=False, default=1.00)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    question = relationship("Question", back_populates="test_cases")
    submission_results = relationship("SubmissionTestCaseResult", back_populates="test_case", cascade="all, delete-orphan")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    job_role = Column(String(100), nullable=False, default="Data Analyst")
    duration_minutes = Column(Integer, nullable=False, default=60)
    start_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    timezone = Column(String(50), nullable=False, default="UTC")
    status = Column(String(20), nullable=False, default="DRAFT")  # DRAFT, REVIEW, PUBLISHED, ACTIVE, COMPLETED, ARCHIVED
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    point_of_contact_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    proctoring_config_json = Column(JSON, nullable=True)
    candidate_settings_json = Column(JSON, nullable=True)
    email_reports_settings_json = Column(JSON, nullable=True)
    advanced_settings_json = Column(JSON, nullable=True)
    email_templates_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_assessments")
    point_of_contact = relationship("User", foreign_keys=[point_of_contact_id])
    assessment_admins = relationship("AssessmentAdmin", back_populates="assessment", cascade="all, delete-orphan")
    question_links = relationship(
        "AssessmentQuestion",
        back_populates="assessment",
        cascade="all, delete-orphan",
        order_by="AssessmentQuestion.sort_order"
    )
    assignments = relationship("AssessmentAssignment", back_populates="assessment", cascade="all, delete-orphan")
    invitations = relationship("Invitation", back_populates="assessment", cascade="all, delete-orphan")
    submissions = relationship("StudentSubmission", back_populates="assessment", cascade="all, delete-orphan")


class AssessmentAdmin(Base):
    __tablename__ = "assessment_admins"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False, default="All access")  # "All access", "Editor", "Viewer", etc.
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    assessment = relationship("Assessment", back_populates="assessment_admins")
    user = relationship("User", backref="assessment_admin_roles")


class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), primary_key=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), primary_key=True)
    marks = Column(Integer, nullable=False, default=10)
    sort_order = Column(Integer, nullable=False, default=1)

    # Relationships
    assessment = relationship("Assessment", back_populates="question_links")
    question = relationship("Question", back_populates="assessment_links")


class AssessmentAssignment(Base):
    __tablename__ = "assessment_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(30), nullable=False, default="INVITED")  # INVITED, STARTED, IN_PROGRESS, COMPLETED, REVIEW_PENDING, SHORTLISTED, REJECTED, ARCHIVED, TEST_RESET
    assigned_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    time_extension_minutes = Column(Integer, nullable=False, default=0)
    interview_details_json = Column(JSON, nullable=True)
    review_notes = Column(Text, nullable=True)
    total_score = Column(Numeric(5, 2), nullable=True)
    percentage = Column(Numeric(5, 2), nullable=True)
    attempt_percentage = Column(Numeric(5, 2), nullable=True)
    integrity_status = Column(String(30), nullable=True, default="Acceptable")
    integrity_score = Column(Numeric(5, 2), nullable=True, default=100.0)

    # Relationships
    assessment = relationship("Assessment", back_populates="assignments")
    student = relationship("User", back_populates="assignments")
    invitation = relationship("Invitation", back_populates="assignment", uselist=False, cascade="all, delete-orphan")
    submissions = relationship("StudentSubmission", back_populates="assignment", cascade="all, delete-orphan")
    attempts = relationship("CandidateAttempt", back_populates="assignment", cascade="all, delete-orphan", order_by="CandidateAttempt.attempt_number.asc()")


class CandidateAttempt(Base):
    __tablename__ = "candidate_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assignment_id = Column(String(36), ForeignKey("assessment_assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    attempt_number = Column(Integer, nullable=False, default=1)
    status = Column(String(30), nullable=False, default="NOT_STARTED")  # NOT_STARTED, IN_PROGRESS, INTERRUPTED, COMPLETED, EXPIRED, ACCESS_DISABLED, RETAKE_ENABLED
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    time_spent_seconds = Column(Integer, nullable=False, default=0)
    time_remaining_seconds = Column(Integer, nullable=True)
    time_limit_minutes = Column(Integer, nullable=True)
    questions_progress_json = Column(JSON, nullable=True)  # {"active_question_id": "...", "drafts": {"<qid>": {"code": "...", "database_engine": "..."}}}
    total_score = Column(Numeric(5, 2), nullable=True)
    percentage = Column(Numeric(5, 2), nullable=True)
    attempted_questions_count = Column(Integer, nullable=False, default=0)
    total_questions_count = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)

    # Admin Re-enable Tracking
    re_enabled_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    re_enabled_at = Column(DateTime, nullable=True)
    re_enable_action = Column(String(50), nullable=True)  # RESUME_PREVIOUS, START_NEW
    re_enable_time_mode = Column(String(50), nullable=True)  # REMAINING_TIME, FULL_DURATION, ADD_ADDITIONAL_TIME
    re_enable_additional_minutes = Column(Integer, nullable=False, default=0)
    re_enable_reason = Column(String(255), nullable=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assignment = relationship("AssessmentAssignment", back_populates="attempts")
    student = relationship("User", foreign_keys=[student_id])
    assessment = relationship("Assessment", foreign_keys=[assessment_id])
    re_enabled_by = relationship("User", foreign_keys=[re_enabled_by_id])
    submissions = relationship("StudentSubmission", back_populates="attempt")


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assignment_id = Column(String(36), ForeignKey("assessment_assignments.id", ondelete="CASCADE"), nullable=False, unique=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    status = Column(String(20), nullable=False, default="PENDING")  # PENDING, SENT, OPENED, COMPLETED, REVOKED
    expires_at = Column(DateTime, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    opened_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    assignment = relationship("AssessmentAssignment", back_populates="invitation")
    student = relationship("User", back_populates="invitations")
    assessment = relationship("Assessment", back_populates="invitations")


class StudentSubmission(Base):
    __tablename__ = "student_submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assignment_id = Column(String(36), ForeignKey("assessment_assignments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    attempt_id = Column(String(36), ForeignKey("candidate_attempts.id", ondelete="SET NULL"), nullable=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    submitted_sql = Column(Text, nullable=False)
    passed_test_cases_count = Column(Integer, nullable=False, default=0)
    total_test_cases_count = Column(Integer, nullable=False, default=0)
    total_weight_passed = Column(Numeric(5, 2), nullable=False, default=0.00)
    total_weight_possible = Column(Numeric(5, 2), nullable=False, default=0.00)
    calculated_score = Column(Numeric(5, 2), nullable=False, default=0.00)
    is_plagiarized = Column(Boolean, nullable=False, default=False)
    similarity_score = Column(Numeric(5, 2), nullable=False, default=0.00)
    plagiarism_details_json = Column(JSON, nullable=True)
    submitted_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    assignment = relationship("AssessmentAssignment", back_populates="submissions")
    student = relationship("User", back_populates="submissions")
    assessment = relationship("Assessment", back_populates="submissions")
    attempt = relationship("CandidateAttempt", back_populates="submissions")
    question = relationship("Question", back_populates="submissions")
    results = relationship("SubmissionTestCaseResult", back_populates="submission", cascade="all, delete-orphan")


class ProctoringEvent(Base):
    __tablename__ = "proctoring_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False)  # TAB_SWITCH, FULLSCREEN_EXIT, COPY_PASTE, NO_FACE, MULTIPLE_FACES, AUDIO_SPIKE, IP_VIOLATION
    violation_count = Column(Integer, nullable=False, default=1)
    details_json = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    assessment = relationship("Assessment", backref="proctoring_events")
    student = relationship("User", backref="proctoring_events")


class SubmissionTestCaseResult(Base):
    __tablename__ = "submission_test_case_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("student_submissions.id", ondelete="CASCADE"), nullable=False)
    test_case_id = Column(String(36), ForeignKey("test_cases.id", ondelete="CASCADE"), nullable=False)
    passed = Column(Boolean, nullable=False)
    weight = Column(Numeric(5, 2), nullable=False, default=1.00)
    score_awarded = Column(Numeric(5, 2), nullable=False, default=0.00)
    execution_time_ms = Column(Numeric(10, 2), nullable=True)
    safe_error_message = Column(Text, nullable=True)

    # Relationships
    submission = relationship("StudentSubmission", back_populates="results")
    test_case = relationship("TestCase", back_populates="submission_results")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details_json = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    actor = relationship("User", back_populates="audit_logs")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    refresh_token = Column(String(512), unique=True, nullable=False, index=True)
    is_revoked = Column(Boolean, nullable=False, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", backref="sessions")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", backref="notifications")


class CandidateFeedback(Base):
    __tablename__ = "candidate_feedbacks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    invitation_id = Column(String(36), ForeignKey("invitations.id", ondelete="CASCADE"), nullable=True)
    overall_rating = Column(Integer, nullable=False, default=5)  # 1 to 5
    difficulty_rating = Column(Integer, nullable=False, default=3)  # 1 to 5
    question_quality_rating = Column(Integer, nullable=False, default=5)  # 1 to 5
    platform_rating = Column(Integer, nullable=False, default=5)  # 1 to 5
    technical_issues_encountered = Column(Boolean, nullable=False, default=False)
    technical_issues_desc = Column(Text, nullable=True)
    written_comments = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    assessment = relationship("Assessment", backref="feedbacks")
    student = relationship("User", backref="feedbacks")
    invitation = relationship("Invitation", backref="feedback")




