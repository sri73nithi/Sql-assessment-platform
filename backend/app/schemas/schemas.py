from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional, Any, Dict


# --- USER & STUDENT SCHEMAS ---
class UserBase(BaseModel):
    email: EmailStr
    role: str = "student"
    full_name: str
    student_id_code: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: Optional[str] = None  # Admin generates password if student
    student_id_code: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    student_id_code: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None



class TokenPayload(BaseModel):
    sub: str
    role: str
    exp: int


# --- TOPIC SCHEMAS ---
class TopicBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True


class TopicCreate(TopicBase):
    pass


class TopicUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TopicResponse(TopicBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- TEST CASE SCHEMAS ---
class TestCaseBase(BaseModel):
    test_type: str = "PUBLIC"  # PUBLIC, HIDDEN
    name: str
    input_setup_sql: Optional[str] = None
    expected_output_json: Any
    weight: float = 1.00


class TestCaseCreate(TestCaseBase):
    pass


class TestCaseResponse(TestCaseBase):
    id: str
    question_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- QUESTION SCHEMAS ---
class ColumnDefinition(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    is_primary_key: bool = False
    is_foreign_key: bool = False


class TableDefinition(BaseModel):
    name: str
    description: Optional[str] = None
    columns: List[ColumnDefinition]


class QuestionBase(BaseModel):
    topic_id: str
    title: str
    business_scenario: Optional[str] = ""
    problem_statement: str
    task_description: str
    notes: Optional[str] = None
    requirements: Optional[str] = None
    difficulty: str  # EASY, MEDIUM, HARD
    job_role: str = "Data Engineer"
    database_engine: str = "PostgreSQL"
    tables_schema_json: Any = []
    schema_ddl: Optional[str] = ""
    seed_data_sql: Optional[str] = ""
    reference_sql: Optional[str] = ""
    marks: int = 10
    question_type: str = "SQL_TECHNICAL"  # MCQ, SQL_TECHNICAL, PYTHON_TECHNICAL
    mcq_options_json: Optional[Any] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    code_language: Optional[str] = "sql"
    function_signature: Optional[str] = None
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    output_columns_json: Optional[Any] = None
    constraints: Optional[str] = None
    tags_json: Optional[Any] = []
    usage_count: Optional[int] = 0
    example_input_json: Optional[Any] = None
    example_output_json: Optional[Any] = None
    example_explanation: Optional[str] = None
    supported_databases_json: Optional[List[str]] = ["PostgreSQL", "MySQL", "SQLite"]
    library_source: Optional[str] = "Question Library"
    uniqueness_score: Optional[float] = 100.0
    created_by_id: Optional[str] = None


class QuestionCreate(QuestionBase):
    test_cases: List[TestCaseCreate] = []


class QuestionUpdate(BaseModel):
    topic_id: Optional[str] = None
    title: Optional[str] = None
    business_scenario: Optional[str] = None
    problem_statement: Optional[str] = None
    task_description: Optional[str] = None
    notes: Optional[str] = None
    requirements: Optional[str] = None
    difficulty: Optional[str] = None
    job_role: Optional[str] = None
    database_engine: Optional[str] = None
    tables_schema_json: Optional[List[TableDefinition]] = None
    schema_ddl: Optional[str] = None
    seed_data_sql: Optional[str] = None
    reference_sql: Optional[str] = None
    marks: Optional[int] = None
    question_type: Optional[str] = None
    mcq_options_json: Optional[Any] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    code_language: Optional[str] = None
    function_signature: Optional[str] = None
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    tags_json: Optional[Any] = None
    status: Optional[str] = None  # ACTIVE, ARCHIVED


class QuestionResponse(QuestionBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime
    test_cases: List[TestCaseResponse] = []

    class Config:
        from_attributes = True


# Student View (STRICTLY EXCLUDES reference_sql, correct_answer, explanation, hidden test cases)
class StudentQuestionView(BaseModel):
    id: str
    title: str
    business_scenario: Optional[str] = ""
    problem_statement: str
    task_description: str
    notes: Optional[str] = None
    requirements: Optional[str] = None
    difficulty: str
    job_role: str
    database_engine: str
    tables_schema_json: Any = []
    schema_ddl: Optional[str] = ""
    seed_data_sql: Optional[str] = ""
    marks: int
    question_type: str = "SQL_TECHNICAL"
    mcq_options_json: Optional[Any] = None
    code_language: Optional[str] = "sql"
    function_signature: Optional[str] = None
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    output_columns_json: Optional[Any] = None
    constraints: Optional[str] = None
    example_input_json: Optional[Any] = None
    example_output_json: Optional[Any] = None
    example_explanation: Optional[str] = None
    supported_databases_json: Optional[List[str]] = ["PostgreSQL", "MySQL", "SQLite"]
    tags_json: Optional[Any] = []
    public_test_cases: List[TestCaseResponse] = []


# --- AI GENERATION & VALIDATION PIPELINE SCHEMAS ---
class QuestionGenerationRequest(BaseModel):
    question_type: str = "TECHNICAL"  # MCQ, TECHNICAL, BOTH
    language: str = "SQL"  # SQL, PYTHON
    question_count: int = 3
    difficulty: str = "MEDIUM"  # EASY, MEDIUM, HARD
    topic_name: Optional[str] = None
    job_role: Optional[str] = None
    database_engine: Optional[str] = "PostgreSQL"
    marks: Optional[int] = None
    target_library: Optional[str] = "Question Library"


class ValidationStageResult(BaseModel):
    stage_number: int
    stage_name: str
    passed: bool
    details: str


class GeneratedQuestionValidationReport(BaseModel):
    is_accepted: bool
    rejection_reason: Optional[str] = None
    validation_stages: List[ValidationStageResult]
    question_data: Optional[Dict[str, Any]] = None


class BatchGenerationResponse(BaseModel):
    requested_count: int
    generated_count: int
    validated_count: int
    duplicate_count: int
    invalid_count: int
    accepted_count: int
    accepted_questions: List[QuestionResponse]
    reports: List[GeneratedQuestionValidationReport]


# --- ASSESSMENT SCHEMAS ---
class AssessmentQuestionLink(BaseModel):
    question_id: str
    marks: int = 10
    sort_order: int = 1


class ProctoringConfig(BaseModel):
    fullscreen_required: bool = True
    tab_switch_detection: bool = True
    max_tab_violations: int = 3
    copy_paste_restricted: bool = True
    webcam_proctoring: bool = True
    audio_proctoring: bool = False
    plagiarism_detection: bool = True
    similarity_threshold: float = 80.0
    external_similarity_check: bool = False
    ip_restriction_enabled: bool = False
    allowed_ips: List[str] = []
    geo_fencing_enabled: bool = False
    allowed_countries: List[str] = []


class CandidateSettingsConfig(BaseModel):
    start_end_window_enforced: bool = True
    allow_resume_unfinished: bool = True
    max_attempts: int = 1
    allow_free_navigation: bool = True
    allow_revisit_previous: bool = True
    allow_unanswered_submission: bool = True
    time_expired_action: str = "AUTO_SUBMIT"  # AUTO_SUBMIT, LOCK_DISCARD
    show_score_immediately: bool = True
    show_incorrect_questions: bool = True


class EmailReportsConfig(BaseModel):
    send_invitation: bool = True
    send_reminder: bool = True
    send_started: bool = False
    send_submitted: bool = True
    send_completed: bool = True
    send_expired: bool = False
    include_scores: bool = True
    include_percentage: bool = True
    include_time_taken: bool = True
    include_question_breakdown: bool = True
    include_testcase_results: bool = True
    include_proctoring_violations: bool = True
    include_plagiarism_flags: bool = True


class AdvancedSettingsConfig(BaseModel):
    assessment_enabled: bool = True
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    duration_minutes: int = 60
    timezone: str = "UTC"
    auto_close_after_end_time: bool = True
    randomize_question_order: bool = False
    randomize_mcq_options: bool = False
    allow_revisit_questions: bool = True
    prevent_duplicate_questions: bool = True
    allowed_languages: List[str] = ["sql", "python"]
    run_code_enabled: bool = True
    submit_code_enabled: bool = True
    custom_input_enabled: bool = True
    max_submission_attempts: int = 10
    execution_time_limit_sec: int = 5
    memory_limit_mb: int = 256


class EmailTemplateItem(BaseModel):
    subject: str
    body: str
    sender_name: str = "Agilisium Assessment Team"
    sender_email: str = "evaluations@agilisium.com"


class ProctoringEventCreate(BaseModel):
    event_type: str
    details: Optional[Dict[str, Any]] = None


class AssessmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    job_role: str = "Data Analyst"
    duration_minutes: int = 60
    start_date: datetime
    end_date: datetime
    timezone: str = "UTC"
    proctoring_config_json: Optional[Dict[str, Any]] = None
    candidate_settings_json: Optional[Dict[str, Any]] = None
    email_reports_settings_json: Optional[Dict[str, Any]] = None
    advanced_settings_json: Optional[Dict[str, Any]] = None
    email_templates_json: Optional[Dict[str, Any]] = None


class AssessmentCreate(AssessmentBase):
    questions: List[AssessmentQuestionLink]


class AssessmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    job_role: Optional[str] = None
    duration_minutes: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    timezone: Optional[str] = None
    status: Optional[str] = None
    proctoring_config_json: Optional[Dict[str, Any]] = None
    candidate_settings_json: Optional[Dict[str, Any]] = None
    email_reports_settings_json: Optional[Dict[str, Any]] = None
    advanced_settings_json: Optional[Dict[str, Any]] = None
    email_templates_json: Optional[Dict[str, Any]] = None
    questions: Optional[List[AssessmentQuestionLink]] = None


# --- ASSESSMENT ADMIN SCHEMAS ---
class AssessmentAdminResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    role: str = "All access"
    is_poc: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AddAssessmentAdminRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: str = "All access"
    user_id: Optional[str] = None


class SetPointOfContactRequest(BaseModel):
    user_id: Optional[str] = None
    email: Optional[EmailStr] = None


class AdminDirectoryUser(BaseModel):
    id: str
    email: str
    full_name: str
    role: str = "admin"

    class Config:
        from_attributes = True


class AssessmentResponse(AssessmentBase):
    id: str
    status: str
    created_by: Optional[str] = None
    point_of_contact_id: Optional[str] = None
    point_of_contact_name: Optional[str] = None
    point_of_contact_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    proctoring_config_json: Optional[Dict[str, Any]] = None
    candidate_settings_json: Optional[Dict[str, Any]] = None
    email_reports_settings_json: Optional[Dict[str, Any]] = None
    advanced_settings_json: Optional[Dict[str, Any]] = None
    email_templates_json: Optional[Dict[str, Any]] = None
    questions: List[QuestionResponse] = []
    admins: List[AssessmentAdminResponse] = []

    class Config:
        from_attributes = True


class AssignAssessmentRequest(BaseModel):
    assessment_id: str
    student_ids: List[str]


# --- STUDENT EXECUTION & SUBMISSION SCHEMAS ---
class RunCodeRequest(BaseModel):
    sql_query: Optional[str] = None
    code: Optional[str] = None
    submitted_answer: Optional[str] = None
    database_engine: Optional[str] = None
    dialect: Optional[str] = None


class TestCaseRunResult(BaseModel):
    test_case_id: str
    test_name: str
    passed: bool
    execution_time_ms: Optional[float] = None
    actual_output: Optional[Any] = None
    expected_output: Optional[Any] = None  # Returned ONLY for public tests
    error: Optional[str] = None
    error_type: Optional[str] = None
    error_line: Optional[int] = None
    error_column: Optional[int] = None


class RunCodeResponse(BaseModel):
    success: bool
    message: str
    results: List[TestCaseRunResult]


class SubmitCodeRequest(BaseModel):
    sql_query: Optional[str] = None
    code: Optional[str] = None
    submitted_answer: Optional[str] = None
    database_engine: Optional[str] = None
    dialect: Optional[str] = None


class SubmitCodeResponse(BaseModel):
    submission_id: str
    passed_count: int
    total_count: int
    score: float
    max_score: float
    results: List[TestCaseRunResult]  # Hidden test outputs masked!


class StudentAssessmentContextResponse(BaseModel):
    assessment: AssessmentResponse
    student: UserResponse
    invitation_status: str
    current_question_index: int = 0
    questions: List[StudentQuestionView]


# --- REPORT & AUDIT SCHEMAS ---
class CandidateResultRow(BaseModel):
    candidate_name: str
    candidate_email: str
    assessment_title: str
    question_title: str
    best_score: float
    max_score: float
    percentage: float
    submission_count: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    status: str


class ReportSummaryResponse(BaseModel):
    total_candidates: int
    total_assessments: int
    active_assessments: int
    completed_assessments: int
    invited_count: Optional[int] = 0
    opened_count: Optional[int] = 0
    attempted_count: Optional[int] = 0
    shortlisted_count: Optional[int] = 0
    average_score: float
    highest_score: float
    lowest_score: float
    pass_rate: float
    topic_performance: Dict[str, float]
    difficulty_performance: Dict[str, float]
    candidate_rankings: List[CandidateResultRow]


# --- SKILL MAP SCHEMAS ---
class SkillMapEntry(BaseModel):
    topic: str
    avg_percentage: float
    submission_count: int
    question_count: int


class SkillMapResponse(BaseModel):
    skills: List[SkillMapEntry]
    date_range_start: Optional[str] = None
    date_range_end: Optional[str] = None


# --- TESTS REPORT SCHEMAS ---
class TestReportRow(BaseModel):
    assessment_id: str
    assessment_title: str
    job_role: str
    status: str
    invited_count: int
    attempted_count: int
    completed_count: int
    shortlisted_count: int
    avg_score: float
    highest_score: float
    pass_rate: float
    created_at: Optional[datetime] = None


class TestsReportResponse(BaseModel):
    assessments: List[TestReportRow]
    total: int


# --- CANDIDATES REPORT SCHEMAS ---
class CandidateReportRow(BaseModel):
    assignment_id: str
    candidate_name: str
    candidate_email: str
    student_id_code: Optional[str] = None
    assessment_id: str
    assessment_title: str
    status: str
    status_label: str
    total_score: float
    max_score: float
    percentage: float
    integrity_status: Optional[str] = None
    integrity_score: Optional[float] = None
    assigned_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class CandidatesReportResponse(BaseModel):
    candidates: List[CandidateReportRow]
    total: int


# --- ADMINS REPORT SCHEMAS ---
class AssessmentAdminReportEntry(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    is_poc: bool


class AdminReportRow(BaseModel):
    assessment_id: str
    assessment_title: str
    assessment_status: str
    admins: List[AssessmentAdminReportEntry]


class AdminsReportResponse(BaseModel):
    assessments: List[AdminReportRow]
    total: int


class AuditLogResponse(BaseModel):
    id: str
    actor_email: Optional[str]
    action: str
    entity_type: str
    entity_id: Optional[str]
    details_json: Any
    created_at: datetime

    class Config:
        from_attributes = True


class UserResetPassword(BaseModel):
    new_password: str


class AnalyticsSummaryResponse(BaseModel):
    avg_score: float
    highest_score: float
    lowest_score: float
    completion_rate: float
    total_assessments: int
    total_students: int
    topic_performance: Dict[str, float]
    weak_topics: List[str]
    student_rankings: List[Dict[str, Any]]


class CandidateFeedbackCreate(BaseModel):
    overall_rating: int = Field(5, ge=1, le=5)
    difficulty_rating: int = Field(3, ge=1, le=5)
    question_quality_rating: int = Field(5, ge=1, le=5)
    platform_rating: int = Field(5, ge=1, le=5)
    technical_issues_encountered: bool = False
    technical_issues_desc: Optional[str] = None
    written_comments: Optional[str] = None


class CandidateFeedbackResponse(BaseModel):
    id: str
    assessment_id: str
    student_id: str
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    overall_rating: int
    difficulty_rating: int
    question_quality_rating: int
    platform_rating: int
    technical_issues_encountered: bool
    technical_issues_desc: Optional[str] = None
    written_comments: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TestCaseAnalyticsItem(BaseModel):
    test_case_id: str
    name: str
    test_type: str
    weight: float
    total_evaluated: int
    passed_count: int
    failed_count: int
    pass_percentage: float


class QuestionAnalyticsItem(BaseModel):
    question_id: str
    question_number: int
    title: str
    question_type: str
    difficulty: str
    job_role: Optional[str] = None
    database_engine: Optional[str] = None
    marks: float
    total_attempts: int
    passed_count: int
    failed_count: int
    pass_percentage: float
    average_score: float
    average_time_seconds: float
    total_submissions: int
    diagnostic_insight: str  # TOO_EASY, BALANCED, CHALLENGING, TOO_DIFFICULT, HIGH_LATENCY, FREQUENTLY_SKIPPED
    test_cases: List[TestCaseAnalyticsItem] = []


class AssessmentDetailedAnalytics(BaseModel):
    assessment_id: str
    assessment_title: str
    total_invited: int
    total_started: int
    total_completed: int
    total_not_started: int
    average_score: float
    highest_score: float
    lowest_score: float
    average_percentage: float
    average_completion_minutes: float
    pass_rate_percentage: float
    failure_rate_percentage: float
    total_submissions: int
    total_proctoring_violations: int
    total_plagiarism_flags: int
    score_distribution: List[Dict[str, Any]]
    performance_bands: Dict[str, int]
    completion_breakdown: Dict[str, int]
    pass_fail_breakdown: Dict[str, int]
    skill_performance: List[Dict[str, Any]]
    question_type_performance: List[Dict[str, Any]]
    question_analytics: List[QuestionAnalyticsItem]
    feedback_summary: Dict[str, Any]


# ============================================================================
# CANDIDATE MANAGEMENT & DRILLDOWN SCHEMAS
# ============================================================================

class CandidateFilterCounts(BaseModel):
    test_taken: int = 0
    review_pending: int = 0
    shortlisted: int = 0
    archived: int = 0
    test_reset: int = 0
    invited: int = 0
    interrupted: int = 0
    retake_enabled: int = 0
    all: int = 0


class InterviewDetail(BaseModel):
    scheduled_at: Optional[str] = None
    interviewer: Optional[str] = None
    interviewer_email: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None


class CandidateListItem(BaseModel):
    id: str
    student_id: str
    name: str
    email: str
    student_id_code: Optional[str] = None
    assigned_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    status: str
    integrity_index: str = "Acceptable"
    integrity_score: float = 100.0
    attempt_percentage: float = 0.0
    total_score: float = 0.0
    max_score: float = 0.0
    percentage: float = 0.0
    time_taken_minutes: Optional[float] = None
    time_extension_minutes: int = 0
    interview_details: Optional[InterviewDetail] = None
    proctoring_violations_count: int = 0
    active_attempt_number: Optional[int] = 1
    re_enable_reason: Optional[str] = None

    class Config:
        from_attributes = True


class CandidateListResponse(BaseModel):
    candidates: List[CandidateListItem]
    counts: CandidateFilterCounts
    total: int


class TestCaseEvaluationItem(BaseModel):
    test_case_id: str
    name: str
    test_type: str
    weight: float
    score_awarded: float
    passed: bool
    execution_time_ms: Optional[float] = None
    safe_error_message: Optional[str] = None


class QuestionSubmissionDetail(BaseModel):
    question_id: str
    question_number: int
    title: str
    question_type: str
    difficulty: str
    marks: float
    score_earned: float
    submitted_code: Optional[str] = None
    passed_test_cases_count: int = 0
    total_test_cases_count: int = 0
    is_plagiarized: bool = False
    similarity_score: float = 0.0
    mcq_selected_option: Optional[str] = None
    mcq_options: Optional[List[Dict[str, Any]]] = None
    test_cases: List[TestCaseEvaluationItem] = []


class CandidateProctoringEvent(BaseModel):
    id: str
    event_type: str
    violation_count: int
    details_json: Any = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateAttemptHistoryItem(BaseModel):
    id: str
    attempt_number: int
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_used_minutes: Optional[float] = None
    time_remaining_minutes: Optional[float] = None
    attempted_questions_count: int = 0
    total_questions_count: int = 0
    total_score: Optional[float] = None
    percentage: Optional[float] = None
    is_active: bool = True
    type_label: str = "Initial Attempt"  # Initial Attempt or Re-enabled by Admin
    re_enabled_by_name: Optional[str] = None
    re_enabled_at: Optional[datetime] = None
    re_enable_action: Optional[str] = None  # RESUME_PREVIOUS or START_NEW
    re_enable_reason: Optional[str] = None

    class Config:
        from_attributes = True


class CandidateDetailResponse(BaseModel):
    assignment_id: str
    assessment_id: str
    assessment_title: str
    student_id: str
    name: str
    email: str
    student_id_code: Optional[str] = None
    status: str
    assigned_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    duration_minutes: int
    time_taken_minutes: Optional[float] = None
    time_extension_minutes: int = 0
    total_score: float
    max_score: float
    percentage: float
    attempt_percentage: float
    integrity_status: str
    integrity_score: float
    proctoring_summary: Dict[str, Any]
    proctoring_events: List[CandidateProctoringEvent] = []
    interview_details: Optional[InterviewDetail] = None
    review_notes: Optional[str] = None
    questions: List[QuestionSubmissionDetail] = []
    active_attempt_id: Optional[str] = None
    active_attempt_number: Optional[int] = 1
    attempt_history: List[CandidateAttemptHistoryItem] = []
    re_enable_details: Optional[Dict[str, Any]] = None


class ResetCandidateTestRequest(BaseModel):
    assignment_ids: List[str]


class ReEnableCandidateTestRequest(BaseModel):
    assignment_id: str
    action: str = "RESUME_PREVIOUS"  # RESUME_PREVIOUS or START_NEW
    time_mode: str = "REMAINING_TIME"  # REMAINING_TIME, FULL_DURATION, ADD_ADDITIONAL_TIME
    additional_minutes: Optional[int] = 0
    reason: Optional[str] = None
    custom_reason: Optional[str] = None


class SaveProgressRequest(BaseModel):
    active_question_id: Optional[str] = None
    drafts: Optional[Dict[str, Any]] = None  # { "<qid>": {"code": "...", "database_engine": "..."} }
    time_remaining_seconds: Optional[int] = None


class InterruptTestRequest(BaseModel):
    reason: Optional[str] = "Interrupted / Browser Closed"
    drafts: Optional[Dict[str, Any]] = None
    time_remaining_seconds: Optional[int] = None


class ExtendTimeRequest(BaseModel):
    assignment_ids: List[str]
    additional_minutes: int = Field(..., ge=1, le=360)
    reason: Optional[str] = None


class ScheduleInterviewRequest(BaseModel):
    assignment_id: str
    interview_date: str
    interview_time: str
    interviewer_name: str
    interviewer_email: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None


class UpdateCandidateStatusRequest(BaseModel):
    assignment_ids: List[str]
    status: str  # SHORTLISTED, REJECTED, ARCHIVED, REVIEW_PENDING, COMPLETED
    notes: Optional[str] = None


class CandidateReportExportRequest(BaseModel):
    assignment_ids: Optional[List[str]] = None
    report_type: str = "SUMMARY_CSV"  # SUMMARY_CSV, PROCTORING_CSV, QUESTION_BREAKDOWN_CSV
    status_filter: Optional[str] = None


# --- AUTH CREDENTIAL SCHEMAS ---
class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)






