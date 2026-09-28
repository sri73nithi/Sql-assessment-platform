import time
from typing import List, Dict, Any, Optional
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.models import StudentSubmission, SubmissionTestCaseResult, Question, TestCase, Assessment
from app.services.sandbox_service import sandbox_service


class ScoringService:
    """
    Implements standard weighted test-case scoring and best-submission resolution.
    Scoring Formula: Score = (Sum of Passed Test Case Weights / Total Test Case Weights) * Question Marks
    Best Submission Rule: Highest calculated_score; ties broken by earliest submitted_at.
    """

    async def evaluate_submission(
        self,
        db: AsyncSession,
        assignment_id: str,
        student_id: str,
        assessment_id: str,
        question_id: str,
        submitted_sql: str,
        engine: str = "PostgreSQL"
    ) -> StudentSubmission:
        # Fetch question and all test cases (both PUBLIC and HIDDEN)
        q_stmt = select(Question).where(Question.id == question_id).options(selectinload(Question.test_cases))
        q_res = await db.execute(q_stmt)
        question = q_res.scalar_one_or_none()
        if not question:
            raise ValueError(f"Question {question_id} not found")

        test_cases = question.test_cases or []
        is_mcq = question.question_type == "MCQ"
        from app.models.models import CandidateAttempt
        att_stmt = select(CandidateAttempt).where(
            CandidateAttempt.assignment_id == assignment_id,
            CandidateAttempt.is_active == True
        )
        att_res = await db.execute(att_stmt)
        active_att = att_res.scalar_one_or_none()

        # Create submission record
        submission = StudentSubmission(
            assignment_id=assignment_id,
            student_id=student_id,
            assessment_id=assessment_id,
            attempt_id=active_att.id if active_att else None,
            question_id=question_id,
            submitted_sql=submitted_sql,
            passed_test_cases_count=0,
            total_test_cases_count=1 if is_mcq else len(test_cases),
            total_weight_passed=Decimal("0.00"),
            total_weight_possible=Decimal(str(question.marks or 10)),
            calculated_score=Decimal("0.00")
        )
        db.add(submission)
        await db.flush()

        if is_mcq:
            # Handle Multiple Choice Question Evaluation
            clean_ans = (submitted_sql or "").strip().upper()
            correct_ans = (question.correct_answer or question.reference_sql or "").strip().upper()
            is_correct = (clean_ans == correct_ans) and bool(clean_ans)
            q_marks = Decimal(str(question.marks or 5))

            submission.passed_test_cases_count = 1 if is_correct else 0
            submission.total_test_cases_count = 1
            submission.total_weight_passed = q_marks if is_correct else Decimal("0.00")
            submission.total_weight_possible = q_marks
            submission.calculated_score = q_marks if is_correct else Decimal("0.00")
        else:
            total_weight = Decimal("0.00")
            passed_weight = Decimal("0.00")
            passed_count = 0

            for tc in test_cases:
                tc_weight = Decimal(str(tc.weight if tc.weight else 1.00))
                total_weight += tc_weight

                input_setup = tc.input_setup_sql or question.seed_data_sql
                start_t = time.time()
                if is_python:
                    exec_res = await sandbox_service.execute_python(
                        submitted_sql,
                        input_setup,
                        tc.expected_output_json
                    )
                    passed = exec_res["success"] and not exec_res.get("error")
                    safe_err = exec_res.get("error")
                else:
                    exec_res = await sandbox_service.execute_query(
                        question.schema_ddl,
                        input_setup,
                        submitted_sql,
                        engine=engine or question.database_engine or "PostgreSQL"
                    )
                    passed = False
                    safe_err = exec_res.get("error")
                    if exec_res["success"] and not safe_err:
                        passed = await sandbox_service.compare_outputs(
                            exec_res.get("rows", []),
                            tc.expected_output_json if isinstance(tc.expected_output_json, list) else []
                        )

                exec_time_ms = round((time.time() - start_t) * 1000, 2)

                tc_score = Decimal("0.00")
                if passed:
                    passed_count += 1
                    passed_weight += tc_weight
                    tc_score = tc_weight

                result_entry = SubmissionTestCaseResult(
                    submission_id=submission.id,
                    test_case_id=tc.id,
                    passed=passed,
                    weight=tc_weight,
                    score_awarded=tc_score,
                    execution_time_ms=Decimal(str(exec_time_ms)),
                    safe_error_message=safe_err
                )
                db.add(result_entry)

            if total_weight > Decimal("0.00"):
                score_ratio = passed_weight / total_weight
                final_score = score_ratio * Decimal(str(question.marks or 10))
            else:
                final_score = Decimal("0.00")

            submission.passed_test_cases_count = passed_count
            submission.total_weight_passed = passed_weight
            submission.total_weight_possible = total_weight
            submission.calculated_score = Decimal(str(round(float(final_score), 2)))

        # Run Plagiarism & Similarity Detection
        try:
            a_stmt = select(Assessment).where(Assessment.id == assessment_id)
            a_res = await db.execute(a_stmt)
            assessment = a_res.scalar_one_or_none()
            proctoring_cfg = (assessment.proctoring_config_json or {}) if assessment else {}

            if proctoring_cfg.get("plagiarism_detection", True):
                threshold = float(proctoring_cfg.get("similarity_threshold", 80.0))
                from app.services.proctoring_service import proctoring_service
                await proctoring_service.check_plagiarism(
                    db=db,
                    current_submission=submission,
                    assessment_id=assessment_id,
                    question_id=question_id,
                    threshold=threshold
                )
        except Exception as e:
            print(f"Plagiarism evaluation note: {e}")

        await db.commit()
        await db.refresh(submission)
        return submission

    async def get_best_submission(
        self,
        db: AsyncSession,
        student_id: str,
        assessment_id: str,
        question_id: Optional[str] = None
    ) -> Optional[StudentSubmission]:
        """
        Retrieves the canonical best submission for a candidate.
        Sorts by calculated_score DESC, submitted_at ASC (earliest submission on tie).
        """
        query = select(StudentSubmission).where(
            StudentSubmission.student_id == student_id,
            StudentSubmission.assessment_id == assessment_id
        )
        if question_id:
            query = query.where(StudentSubmission.question_id == question_id)

        query = query.order_by(StudentSubmission.calculated_score.desc(), StudentSubmission.submitted_at.asc())
        res = await db.execute(query)
        return res.scalars().first()


scoring_service = ScoringService()

