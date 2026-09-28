from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import Dict, List, Any
from app.core.database import get_db
from app.models.models import StudentSubmission, User, Assessment, Question, Topic, AssessmentQuestion
from app.schemas.schemas import AnalyticsSummaryResponse
from app.api.deps import get_current_admin

router = APIRouter()

@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin only: Generates aggregate metrics and student statistics for the analytics portal.
    """
    # 1. Total student count and assessments count
    stmt_students = select(func.count(User.id)).where(User.role == "student")
    res_students = await db.execute(stmt_students)
    total_students = res_students.scalar_one() or 0

    stmt_assessments = select(func.count(Assessment.id))
    res_assessments = await db.execute(stmt_assessments)
    total_assessments = res_assessments.scalar_one() or 0

    # 2. Score performance (avg, min, max)
    stmt_scores = select(
        func.avg(StudentSubmission.score),
        func.max(StudentSubmission.score),
        func.min(StudentSubmission.score)
    ).where(StudentSubmission.score != None)
    res_scores = await db.execute(stmt_scores)
    avg_score_raw, max_score_raw, min_score_raw = res_scores.fetchone()

    # Apply scaling (assume marks are out of 10 for basic average ratio or convert to absolute float percentages)
    avg_score = float(round(avg_score_raw, 2)) if avg_score_raw is not None else 0.0
    highest_score = float(max_score_raw) if max_score_raw is not None else 0.0
    lowest_score = float(min_score_raw) if min_score_raw is not None else 0.0

    # 3. Assessment Completion Rate
    # Total assigned questions (linked questions * active students)
    stmt_questions_total = select(func.count(AssessmentQuestion.question_id))
    res_questions_total = await db.execute(stmt_questions_total)
    total_active_questions = res_questions_total.scalar_one() or 0
    
    total_possible_submissions = total_active_questions * total_students

    stmt_submitted = select(func.count(StudentSubmission.id))
    res_submitted = await db.execute(stmt_submitted)
    total_submitted = res_submitted.scalar_one() or 0

    completion_rate = (
        float(round((total_submitted / total_possible_submissions) * 100, 2))
        if total_possible_submissions > 0
        else 0.0
    )

    # 4. Topic Wise Performance
    # Load all topics and questions
    stmt_topics = select(Topic).options(selectinload(Topic.questions).selectinload(Question.submissions))
    res_topics = await db.execute(stmt_topics)
    topics = res_topics.scalars().all()

    topic_performance = {}
    weak_topics = []

    for topic in topics:
        sub_scores = []
        for q in topic.questions:
            for sub in q.submissions:
                if sub.score is not None:
                    # Convert to score percentage
                    percentage = (float(sub.score) / q.marks) * 100.0 if q.marks > 0 else 0.0
                    sub_scores.append(percentage)
        
        if sub_scores:
            avg_topic = float(round(sum(sub_scores) / len(sub_scores), 2))
            topic_performance[topic.name] = avg_topic
            if avg_topic < 65.0:
                weak_topics.append(topic.name)
        else:
            # Topic exists but has no submissions yet, default to 0.0 or exclude
            topic_performance[topic.name] = 0.0

    # 5. Student Rankings
    stmt_ranking = select(User).where(User.role == "student").options(selectinload(User.submissions))
    res_ranking = await db.execute(stmt_ranking)
    students = res_ranking.scalars().all()

    rankings = []
    for s in students:
        total_score = sum(float(sub.score) for sub in s.submissions if sub.score is not None)
        rankings.append({
            "student_name": s.email.split("@")[0].capitalize(),
            "student_email": s.email,
            "total_score": total_score
        })

    rankings.sort(key=lambda x: x["total_score"], reverse=True)

    # Attach rank numbers
    for idx, rank in enumerate(rankings):
        rank["rank"] = idx + 1

    return {
        "avg_score": avg_score,
        "highest_score": highest_score,
        "lowest_score": lowest_score,
        "completion_rate": completion_rate,
        "total_assessments": total_assessments,
        "total_students": total_students,
        "topic_performance": topic_performance,
        "weak_topics": weak_topics,
        "student_rankings": rankings[:10] # Return top 10 students
    }
