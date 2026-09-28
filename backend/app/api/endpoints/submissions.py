from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.models import (
    StudentSubmission, Assessment, Question, User, TestCase, AssessmentAssignment, Invitation, AssessmentQuestion
)
from app.schemas.schemas import (
    RunCodeRequest, RunCodeResponse, SubmitCodeRequest, SubmitCodeResponse, TestCaseRunResult
)
from app.services.sandbox_service import sandbox_service
from app.services.scoring_service import scoring_service
from app.services.email_service import email_service
from app.services.audit_service import audit_service
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()


@router.post("/run-code/{token}/{question_id}", response_model=RunCodeResponse)
@router.post("/run-code", response_model=RunCodeResponse)
async def run_code_public_tests(
    payload: RunCodeRequest,
    token: Optional[str] = None,
    question_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Executes student code transiently against PUBLIC test cases only.
    Supports SQL and Python execution. Hidden tests are NEVER exposed.
    """
    eff_token = token or getattr(payload, "token", None)
    eff_qid = question_id or getattr(payload, "question_id", None)
    code_text = payload.code or payload.sql_query or payload.submitted_answer or ""
    selected_engine = payload.database_engine or getattr(payload, "dialect", None) or "PostgreSQL"

    if not eff_token or not eff_qid:
        raise HTTPException(status_code=400, detail="Missing assessment token or question_id.")

    invitation = await email_service.validate_token(db, eff_token)
    if not invitation:
        raise HTTPException(status_code=401, detail="Invalid or expired assessment token.")

    # Fetch Question and Public test cases ONLY
    q_stmt = select(Question).where(Question.id == eff_qid).options(selectinload(Question.test_cases))
    q_res = await db.execute(q_stmt)
    question = q_res.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")

    public_tcs = [tc for tc in question.test_cases if tc.test_type == "PUBLIC"]
    results = []
    all_passed = True

    is_python = question.question_type == "PYTHON_TECHNICAL" or (question.code_language or "").lower() == "python"

    for tc in public_tcs:
        setup = tc.input_setup_sql or question.seed_data_sql or ""
        if is_python:
            res = await sandbox_service.execute_python(code_text, setup)
            passed = res["success"] and not res.get("error")
            actual = res.get("result")
            err = res.get("error")
        else:
            res = await sandbox_service.execute_query(
                question.schema_ddl,
                setup,
                code_text,
                engine=selected_engine or question.database_engine or "PostgreSQL"
            )
            passed = False
            err = res.get("error")
            actual = res.get("rows")
            if res["success"] and not err:
                passed = await sandbox_service.compare_outputs(
                    res.get("rows", []),
                    tc.expected_output_json if isinstance(tc.expected_output_json, list) else []
                )

        if not passed:
            all_passed = False

        results.append(TestCaseRunResult(
            test_case_id=tc.id,
            test_name=tc.name,
            passed=passed,
            actual_output=actual,
            expected_output=tc.expected_output_json if isinstance(tc.expected_output_json, list) else [],
            error=err,
            error_type=res.get("error_type"),
            error_line=res.get("error_line"),
            error_column=res.get("error_column")
        ))

    return RunCodeResponse(
        success=all_passed,
        message="Public test execution complete.",
        results=results
    )


@router.post("/submit-code/{token}/{question_id}", response_model=SubmitCodeResponse)
@router.post("/submit", response_model=SubmitCodeResponse)
async def submit_code_official(
    payload: SubmitCodeRequest,
    token: Optional[str] = None,
    question_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Official student submission endpoint.
    Runs code against PUBLIC + HIDDEN test cases, computes weighted score, and stores submission.
    Masks hidden test internals.
    """
    eff_token = token or getattr(payload, "token", None)
    eff_qid = question_id or getattr(payload, "question_id", None)
    code_text = payload.code or payload.sql_query or payload.submitted_answer or ""
    selected_engine = payload.database_engine or getattr(payload, "dialect", None) or "PostgreSQL"

    if not eff_token or not eff_qid:
        raise HTTPException(status_code=400, detail="Missing assessment token or question_id.")

    invitation = await email_service.validate_token(db, eff_token)
    if not invitation:
        raise HTTPException(status_code=401, detail="Invalid or expired assessment token.")

    # Evaluate submission
    submission = await scoring_service.evaluate_submission(
        db=db,
        assignment_id=invitation.assignment_id,
        student_id=invitation.student_id,
        assessment_id=invitation.assessment_id,
        question_id=eff_qid,
        submitted_sql=code_text,
        engine=selected_engine
    )

    # Fetch results
    q_stmt = select(Question).where(Question.id == eff_qid).options(selectinload(Question.test_cases))
    q_res = await db.execute(q_stmt)
    question = q_res.scalar_one_or_none()

    tc_results = []
    if question.question_type == "MCQ":
        is_passed = float(submission.calculated_score) > 0
        tc_results.append(TestCaseRunResult(
            test_case_id="mcq-eval",
            test_name="Selected Option Evaluation",
            passed=is_passed,
            actual_output=code_text.strip().upper(),
            expected_output=None,
            error=None if is_passed else "Incorrect answer selected."
        ))
    else:
        for tc in question.test_cases:
            res_entry = next((r for r in submission.results if r.test_case_id == tc.id), None)
            passed = res_entry.passed if res_entry else False

            tc_results.append(TestCaseRunResult(
                test_case_id=tc.id,
                test_name=tc.name if tc.test_type == "PUBLIC" else "Hidden Test Case",
                passed=passed,
                actual_output=None if tc.test_type == "HIDDEN" else (res_entry.safe_error_message if res_entry else None),
                expected_output=None if tc.test_type == "HIDDEN" else tc.expected_output_json,
                error=res_entry.safe_error_message if res_entry else None
            ))

    await audit_service.log_action(
        db=db,
        actor_id=invitation.student_id,
        action="SUBMISSION_CREATED",
        entity_type="StudentSubmission",
        entity_id=submission.id,
        details_json={"score": float(submission.calculated_score), "question_id": eff_qid}
    )

    return SubmitCodeResponse(
        submission_id=submission.id,
        passed_count=submission.passed_test_cases_count,
        total_count=submission.total_test_cases_count,
        score=float(submission.calculated_score),
        max_score=float(question.marks),
        results=tc_results
    )


@router.post("/finish/{token}")
async def finish_assessment_candidate(
    token: str,
    payload: Optional[Dict[str, Any]] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Candidate endpoint to finish and lock the assessment.
    Aggregates scores from all attempted questions, updates assignment, and locks invitation.
    """
    invitation = await email_service.validate_token(db, token)
    if not invitation:
        raise HTTPException(status_code=401, detail="Invalid or expired assessment token.")

    # 1. Update Invitation status
    invitation.status = "COMPLETED"
    invitation.completed_at = datetime.utcnow()

    # 2. Fetch all submissions for this assignment
    stmt_subs = (
        select(StudentSubmission)
        .where(StudentSubmission.assignment_id == invitation.assignment_id)
        .options(selectinload(StudentSubmission.question))
    )
    res_subs = await db.execute(stmt_subs)
    all_subs = res_subs.scalars().all()

    # 3. Fetch assessment to get total max score and question count
    ass_stmt = (
        select(Assessment)
        .where(Assessment.id == invitation.assessment_id)
        .options(selectinload(Assessment.question_links).selectinload(AssessmentQuestion.question))
    )
    ass_res = await db.execute(ass_stmt)
    assessment = ass_res.scalar_one_or_none()

    total_questions = len(assessment.question_links) if assessment else 0
    max_score = sum(float(link.marks or 10) for link in assessment.question_links) if assessment else 0.0

    # Best score per question
    best_per_q: Dict[str, float] = {}
    for sub in all_subs:
        qid = sub.question_id
        score = float(sub.calculated_score or 0.0)
        if qid not in best_per_q or score > best_per_q[qid]:
            best_per_q[qid] = score

    total_earned = sum(best_per_q.values())
    pct = round((total_earned / max_score * 100), 1) if max_score > 0 else 0.0
    attempt_pct = round((len(best_per_q) / total_questions * 100), 1) if total_questions > 0 else 0.0

    # Update Assignment
    asgn_stmt = select(AssessmentAssignment).where(AssessmentAssignment.id == invitation.assignment_id)
    asgn_res = await db.execute(asgn_stmt)
    assignment = asgn_res.scalar_one_or_none()
    if assignment:
        assignment.status = "COMPLETED"
        assignment.completed_at = datetime.utcnow()
        assignment.total_score = total_earned
        assignment.percentage = pct
        assignment.attempt_percentage = attempt_pct

        # Also complete active attempt
        from app.models.models import CandidateAttempt
        att_stmt = select(CandidateAttempt).where(
            CandidateAttempt.assignment_id == invitation.assignment_id,
            CandidateAttempt.is_active == True
        )
        att_res = await db.execute(att_stmt)
        active_att = att_res.scalar_one_or_none()
        if active_att:
            active_att.status = "COMPLETED"
            active_att.completed_at = datetime.utcnow()
            active_att.total_score = total_earned
            active_att.percentage = pct
            active_att.attempted_questions_count = len(best_per_q)
            active_att.total_questions_count = total_questions

    await audit_service.log_action(
        db=db,
        actor_id=invitation.student_id,
        action="ASSESSMENT_COMPLETED",
        entity_type="AssessmentAssignment",
        entity_id=invitation.assignment_id,
        details_json={
            "total_score": total_earned,
            "max_score": max_score,
            "percentage": pct,
            "attempted_questions": len(best_per_q),
            "total_questions": total_questions
        }
    )

    await db.commit()

    return {
        "status": "COMPLETED",
        "message": "Assessment successfully submitted and completed.",
        "total_score": total_earned,
        "max_score": max_score,
        "percentage": pct,
        "attempted_questions": len(best_per_q),
        "total_questions": total_questions,
        "completed_at": invitation.completed_at.isoformat()
    }


@router.get("/best-submission/{student_id}/{assessment_id}")
async def get_best_submission_api(
    student_id: str,
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin endpoint to fetch the candidate's canonical best submission.
    """
    best_sub = await scoring_service.get_best_submission(db, student_id, assessment_id)
    if not best_sub:
        raise HTTPException(status_code=404, detail="No valid submissions found for this candidate.")

    return {
        "submission_id": best_sub.id,
        "student_id": best_sub.student_id,
        "assessment_id": best_sub.assessment_id,
        "question_id": best_sub.question_id,
        "submitted_sql": best_sub.submitted_sql,
        "best_score": float(best_sub.calculated_score),
        "submitted_at": best_sub.submitted_at
    }


@router.post("/feedback/{token}")
async def submit_candidate_feedback(
    token: str,
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """
    Student endpoint: Allows candidate to submit optional post-assessment feedback
    (experience rating, difficulty, platform quality, technical issues, written comments).
    """
    from app.services.analytics_service import analytics_service
    from app.schemas.schemas import CandidateFeedbackCreate

    try:
        feedback_data = CandidateFeedbackCreate(
            overall_rating=int(payload.get("overall_rating", 5)),
            difficulty_rating=int(payload.get("difficulty_rating", 3)),
            question_quality_rating=int(payload.get("question_quality_rating", 5)),
            platform_rating=int(payload.get("platform_rating", 5)),
            technical_issues_encountered=bool(payload.get("technical_issues_encountered", False)),
            technical_issues_desc=payload.get("technical_issues_desc"),
            written_comments=payload.get("written_comments")
        )
        res = await analytics_service.record_candidate_feedback(db, token, feedback_data)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")


