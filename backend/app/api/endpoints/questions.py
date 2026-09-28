from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_db
from app.models.models import Question, TestCase, User, Topic, Assessment, AssessmentQuestion
from app.schemas.schemas import QuestionResponse, QuestionCreate, QuestionUpdate
from app.api.deps import get_current_admin

router = APIRouter()


@router.get("/topics/list")
async def list_question_topics(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    stmt = select(Topic).order_by(Topic.name.asc())
    res = await db.execute(stmt)
    topics = res.scalars().all()
    return [{"id": t.id, "name": t.name, "description": t.description} for t in topics]


@router.get("", response_model=List[QuestionResponse])
async def list_questions(
    topic_id: Optional[str] = None,
    topic_name: Optional[str] = None,
    difficulty: Optional[str] = None,
    job_role: Optional[str] = None,
    question_type: Optional[str] = None,
    language: Optional[str] = None,
    database_engine: Optional[str] = None,
    library_source: Optional[str] = None,
    marks: Optional[int] = None,
    search: Optional[str] = None,
    status_filter: Optional[str] = "ACTIVE",
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    stmt = select(Question).options(selectinload(Question.test_cases), selectinload(Question.topic))
    
    if library_source and library_source.upper() != "ALL":
        if library_source == "My Library":
            stmt = stmt.where(Question.library_source == "My Library")
        else:
            stmt = stmt.where((Question.library_source != "My Library") | (Question.library_source.is_(None)))
    if topic_id:
        stmt = stmt.where(Question.topic_id == topic_id)
    if topic_name and topic_name.upper() != "ALL":
        stmt = stmt.join(Topic).where(Topic.name == topic_name)
    if difficulty and difficulty.upper() != "ALL":
        stmt = stmt.where(Question.difficulty == difficulty.upper())
    if job_role:
        stmt = stmt.where(Question.job_role == job_role)
    if question_type and question_type.upper() != "ALL":
        stmt = stmt.where(Question.question_type == question_type.upper())
    if language and language.upper() != "ALL":
        stmt = stmt.where(Question.code_language == language.lower())
    if database_engine and database_engine.upper() != "ALL":
        stmt = stmt.where(Question.database_engine.ilike(f"%{database_engine}%"))
    if marks:
        stmt = stmt.where(Question.marks == marks)
    if status_filter and status_filter.upper() != "ALL":
        stmt = stmt.where(Question.status == status_filter.upper())
    if search:
        s = f"%{search}%"
        stmt = stmt.where(
            (Question.title.ilike(s)) |
            (Question.problem_statement.ilike(s)) |
            (Question.task_description.ilike(s)) |
            (Question.business_scenario.ilike(s))
        )

    stmt = stmt.order_by(Question.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    stmt = select(Question).where(Question.id == question_id).options(selectinload(Question.test_cases))
    res = await db.execute(stmt)
    q = res.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q


@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    payload: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    q = Question(
        topic_id=payload.topic_id,
        title=payload.title,
        business_scenario=payload.business_scenario,
        problem_statement=payload.problem_statement,
        task_description=payload.task_description,
        notes=payload.notes,
        requirements=payload.requirements,
        difficulty=payload.difficulty.upper(),
        job_role=payload.job_role,
        database_engine=payload.database_engine,
        tables_schema_json=[t.dict() if hasattr(t, "dict") else t for t in (payload.tables_schema_json or [])],
        schema_ddl=payload.schema_ddl or "",
        seed_data_sql=payload.seed_data_sql or "",
        reference_sql=payload.reference_sql or "",
        marks=payload.marks,
        question_type=payload.question_type or "SQL_TECHNICAL",
        mcq_options_json=payload.mcq_options_json,
        correct_answer=payload.correct_answer,
        explanation=payload.explanation,
        code_language=payload.code_language or "sql",
        function_signature=payload.function_signature,
        input_format=payload.input_format,
        output_format=payload.output_format,
        constraints=payload.constraints,
        tags_json=payload.tags_json or [],
        status="ACTIVE"
    )
    db.add(q)
    await db.flush()

    for tc in payload.test_cases:
        tc_obj = TestCase(
            question_id=q.id,
            test_type=tc.test_type.upper(),
            name=tc.name,
            input_setup_sql=tc.input_setup_sql,
            expected_output_json=tc.expected_output_json,
            weight=tc.weight
        )
        db.add(tc_obj)

    await db.commit()
    await db.refresh(q)
    return q


@router.put("/{question_id}/archive")
async def archive_question(
    question_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    stmt = select(Question).where(Question.id == question_id)
    res = await db.execute(stmt)
    q = res.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    q.status = "ARCHIVED"
    await db.commit()
    return {"detail": "Question archived. Note: Permanent uniqueness fingerprint remains active."}


@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: str,
    payload: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    stmt = select(Question).where(Question.id == question_id).options(selectinload(Question.test_cases))
    res = await db.execute(stmt)
    q = res.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    for field, val in payload.dict(exclude_unset=True).items():
        if val is not None and hasattr(q, field):
            setattr(q, field, val)

    await db.commit()
    await db.refresh(q)
    return q


@router.delete("/{question_id}")
async def delete_question(
    question_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    stmt = select(Question).where(Question.id == question_id)
    res = await db.execute(stmt)
    q = res.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    q.status = "ARCHIVED"
    await db.commit()
    return {"detail": "Question deleted/archived. Note: Permanent fingerprint remains active."}


@router.post("/{question_id}/duplicate", response_model=QuestionResponse)
async def duplicate_question(
    question_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Duplicates an existing question into 'My Library' for admin customization."""
    stmt = select(Question).where(Question.id == question_id).options(selectinload(Question.test_cases))
    res = await db.execute(stmt)
    original = res.scalar_one_or_none()
    if not original:
        raise HTTPException(status_code=404, detail="Question not found")

    cloned = Question(
        topic_id=original.topic_id,
        title=f"{original.title} (Copy)",
        business_scenario=original.business_scenario,
        problem_statement=original.problem_statement,
        task_description=original.task_description,
        notes=original.notes,
        requirements=original.requirements,
        difficulty=original.difficulty,
        job_role=original.job_role,
        database_engine=original.database_engine,
        tables_schema_json=original.tables_schema_json,
        schema_ddl=original.schema_ddl,
        seed_data_sql=original.seed_data_sql,
        reference_sql=original.reference_sql,
        marks=original.marks,
        question_type=original.question_type,
        mcq_options_json=original.mcq_options_json,
        correct_answer=original.correct_answer,
        explanation=original.explanation,
        code_language=original.code_language,
        function_signature=original.function_signature,
        input_format=original.input_format,
        output_format=original.output_format,
        output_columns_json=original.output_columns_json,
        constraints=original.constraints,
        example_input_json=original.example_input_json,
        example_output_json=original.example_output_json,
        example_explanation=original.example_explanation,
        supported_databases_json=original.supported_databases_json,
        tags_json=original.tags_json,
        library_source="My Library",
        created_by_id=admin.id,
        uniqueness_score=100.0,
        status="ACTIVE"
    )
    db.add(cloned)
    await db.flush()

    for tc in original.test_cases:
        cloned_tc = TestCase(
            question_id=cloned.id,
            name=tc.name,
            test_type=tc.test_type,
            input_setup_sql=tc.input_setup_sql,
            expected_output_json=tc.expected_output_json,
            weight=tc.weight
        )
        db.add(cloned_tc)

    await db.commit()
    stmt_reload = select(Question).where(Question.id == cloned.id).options(selectinload(Question.test_cases))
    res_reload = await db.execute(stmt_reload)
    return res_reload.scalar_one()


@router.post("/{question_id}/add-to-assessment/{assessment_id}")
async def add_question_to_assessment(
    question_id: str,
    assessment_id: str,
    marks: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Links a question from the Library into an assessment."""
    q_stmt = select(Question).where(Question.id == question_id)
    q_res = await db.execute(q_stmt)
    q = q_res.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    a_stmt = select(Assessment).where(Assessment.id == assessment_id)
    a_res = await db.execute(a_stmt)
    assessment = a_res.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Check if already added
    link_stmt = select(AssessmentQuestion).where(
        AssessmentQuestion.assessment_id == assessment_id,
        AssessmentQuestion.question_id == question_id
    )
    link_res = await db.execute(link_stmt)
    existing_link = link_res.scalar_one_or_none()
    if existing_link:
        return {"detail": "Question is already part of this assessment"}

    # Count existing to set sort_order
    count_stmt = select(AssessmentQuestion).where(AssessmentQuestion.assessment_id == assessment_id)
    count_res = await db.execute(count_stmt)
    existing_count = len(count_res.scalars().all())

    new_link = AssessmentQuestion(
        assessment_id=assessment_id,
        question_id=question_id,
        marks=marks if marks is not None else q.marks,
        sort_order=existing_count + 1
    )
    db.add(new_link)
    q.usage_count = (q.usage_count or 0) + 1
    await db.commit()
    return {"detail": f"Question '{q.title}' successfully added to assessment.", "assessment_title": assessment.title}


