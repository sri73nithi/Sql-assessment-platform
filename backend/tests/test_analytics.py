import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Assessment, User, Topic, Question, AssessmentQuestion, AssessmentAssignment, Invitation, StudentSubmission, CandidateFeedback
from app.services.analytics_service import analytics_service
from app.schemas.schemas import CandidateFeedbackCreate
from datetime import datetime, timedelta
import hashlib


@pytest.mark.asyncio
async def test_analytics_service_and_feedbacks(db_session: AsyncSession):
    # 1. Create a test assessment
    ass = Assessment(
        title="SQL Analytics Test Assessment",
        description="Comprehensive testing for analytics",
        job_role="Data Engineer",
        duration_minutes=60
    )
    db_session.add(ass)
    await db_session.commit()
    await db_session.refresh(ass)

    # Topic
    topic = Topic(name="Analytics Topics", description="SQL Analysis")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    # 2. Add question
    q = Question(
        topic_id=topic.id,
        title="Department Highest Salary",
        business_scenario="Find highest salary per department.",
        problem_statement="Write a query to group by department and find maximum salary.",
        task_description="Return department and max salary.",
        difficulty="MEDIUM",
        question_type="SQL_TECHNICAL",
        database_engine="PostgreSQL",
        marks=10
    )
    db_session.add(q)
    await db_session.commit()
    await db_session.refresh(q)

    link = AssessmentQuestion(
        assessment_id=ass.id,
        question_id=q.id,
        sort_order=1,
        marks=10
    )
    db_session.add(link)
    await db_session.commit()

    # 3. Create candidate user, assignment & invitation
    user = User(
        email="candidate.analytics@test.com",
        full_name="Analytics Candidate",
        role="student",
        password_hash="hash123"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    assignment = AssessmentAssignment(
        assessment_id=ass.id,
        student_id=user.id
    )
    db_session.add(assignment)
    await db_session.commit()
    await db_session.refresh(assignment)

    raw_token = "analytics-token-xyz-123"
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    inv = Invitation(
        assignment_id=assignment.id,
        student_id=user.id,
        assessment_id=ass.id,
        token_hash=token_hash,
        status="COMPLETED",
        expires_at=datetime.utcnow() + timedelta(days=2),
        opened_at=datetime.utcnow() - timedelta(minutes=45),
        completed_at=datetime.utcnow()
    )
    db_session.add(inv)
    await db_session.commit()
    await db_session.refresh(inv)

    # 4. Add Candidate Feedback via service
    fb_payload = CandidateFeedbackCreate(
        overall_rating=5,
        difficulty_rating=3,
        question_quality_rating=5,
        platform_rating=5,
        technical_issues_encountered=False,
        written_comments="Awesome sandbox experience!"
    )
    fb_res = await analytics_service.record_candidate_feedback(db_session, raw_token, fb_payload)
    assert fb_res["success"] is True

    # 5. Fetch Detailed Analytics via service
    analytics_data = await analytics_service.get_assessment_detailed_analytics(db_session, ass.id)
    assert analytics_data["assessment_id"] == ass.id
    assert analytics_data["total_invited"] == 1
    assert analytics_data["total_completed"] == 1
    assert len(analytics_data["score_distribution"]) == 5
    assert len(analytics_data["question_analytics"]) == 1
    assert analytics_data["question_analytics"][0]["question_id"] == q.id
    assert analytics_data["feedback_summary"]["average_overall_rating"] == 5.0

    # 6. Fetch Feedbacks via service
    feedbacks_list = await analytics_service.get_candidate_feedbacks(db_session, ass.id)
    assert len(feedbacks_list) == 1
    assert feedbacks_list[0]["overall_rating"] == 5
    assert feedbacks_list[0]["student_name"] == "Analytics Candidate"
    assert feedbacks_list[0]["written_comments"] == "Awesome sandbox experience!"
