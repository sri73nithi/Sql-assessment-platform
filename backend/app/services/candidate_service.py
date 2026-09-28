import csv
import io
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload

from app.models.models import (
    AssessmentAssignment, Assessment, User, Invitation, StudentSubmission,
    SubmissionTestCaseResult, ProctoringEvent, Question, TestCase, AuditLog, AssessmentQuestion,
    CandidateAttempt
)
from app.schemas.schemas import (
    CandidateListItem, CandidateListResponse, CandidateFilterCounts,
    CandidateDetailResponse, QuestionSubmissionDetail, TestCaseEvaluationItem,
    CandidateProctoringEvent, InterviewDetail, ScheduleInterviewRequest,
    CandidateAttemptHistoryItem, ReEnableCandidateTestRequest
)


class CandidateService:
    @staticmethod
    def _compute_integrity_index(violations_count: int, plagiarism_flags: int = 0) -> tuple[str, float]:
        """Calculates integrity score and qualitative index based on real proctoring logs."""
        penalty = (violations_count * 8.0) + (plagiarism_flags * 25.0)
        score = max(0.0, min(100.0, 100.0 - penalty))
        if score >= 85.0:
            return "Acceptable", round(score, 1)
        elif score >= 60.0:
            return "Suspicious", round(score, 1)
        else:
            return "Flagged", round(score, 1)

    async def get_assessment_candidates(
        self,
        db: AsyncSession,
        assessment_id: str,
        status_filter: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> CandidateListResponse:
        """
        Retrieves real candidates assigned to an assessment with dynamic scoring,
        attempt percentage calculation, real integrity indices, attempt history, and filter counts.
        """
        # 1. Fetch assessment with questions for total marks & count
        stmt_ass = select(Assessment).where(Assessment.id == assessment_id).options(
            selectinload(Assessment.question_links).selectinload(AssessmentQuestion.question)
        )
        res_ass = await db.execute(stmt_ass)
        assessment = res_ass.scalar_one_or_none()
        if not assessment:
            return CandidateListResponse(
                candidates=[],
                counts=CandidateFilterCounts(),
                total=0
            )

        total_questions_count = len(assessment.question_links)
        total_max_marks = sum(link.marks or link.question.marks for link in assessment.question_links) if total_questions_count > 0 else 100.0

        # 2. Fetch all assignments for this assessment with attempts
        stmt_assign = (
            select(AssessmentAssignment)
            .where(AssessmentAssignment.assessment_id == assessment_id)
            .options(
                selectinload(AssessmentAssignment.student),
                selectinload(AssessmentAssignment.invitation),
                selectinload(AssessmentAssignment.submissions).selectinload(StudentSubmission.results),
                selectinload(AssessmentAssignment.attempts)
            )
            .order_by(AssessmentAssignment.assigned_at.desc())
        )
        res_assign = await db.execute(stmt_assign)
        assignments = res_assign.scalars().all()

        # 3. Fetch all proctoring events for this assessment
        stmt_proc = select(ProctoringEvent).where(ProctoringEvent.assessment_id == assessment_id)
        res_proc = await db.execute(stmt_proc)
        proc_events = res_proc.scalars().all()

        proc_by_student: Dict[str, List[ProctoringEvent]] = {}
        for pe in proc_events:
            proc_by_student.setdefault(pe.student_id, []).append(pe)

        all_candidate_items: List[CandidateListItem] = []
        counts = {
            "test_taken": 0,
            "review_pending": 0,
            "shortlisted": 0,
            "archived": 0,
            "test_reset": 0,
            "invited": 0,
            "interrupted": 0,
            "retake_enabled": 0,
            "all": len(assignments)
        }

        for assign in assignments:
            student = assign.student
            invitation = assign.invitation
            submissions = assign.submissions or []
            student_proc = proc_by_student.get(assign.student_id, [])
            attempts = assign.attempts or []
            active_attempt = next((a for a in attempts if a.is_active), None) or (attempts[-1] if attempts else None)
            active_attempt_num = active_attempt.attempt_number if active_attempt else 1
            last_re_enable_reason = active_attempt.re_enable_reason if active_attempt else None

            # Compute score from highest calculated_score per question or stored values
            best_scores_by_q: Dict[str, float] = {}
            attempted_qids = set()
            for sub in submissions:
                attempted_qids.add(sub.question_id)
                current_best = best_scores_by_q.get(sub.question_id, 0.0)
                if float(sub.calculated_score) > current_best:
                    best_scores_by_q[sub.question_id] = float(sub.calculated_score)

            if submissions:
                total_score = sum(best_scores_by_q.values())
                percentage = (total_score / total_max_marks * 100.0) if total_max_marks > 0 else 0.0
                attempt_pct = (len(attempted_qids) / total_questions_count * 100.0) if total_questions_count > 0 else (100.0 if submissions else 0.0)
            else:
                total_score = float(assign.total_score) if assign.total_score is not None else 0.0
                percentage = float(assign.percentage) if assign.percentage is not None else 0.0
                attempt_pct = float(assign.attempt_percentage) if assign.attempt_percentage is not None else 0.0

            # Integrity calculation
            violations_count = sum(pe.violation_count for pe in student_proc)
            plag_count = sum(1 for sub in submissions if sub.is_plagiarized)
            integrity_label, integrity_score = self._compute_integrity_index(violations_count, plag_count)

            # Determine workflow status
            raw_status = (assign.status or "INVITED").upper()
            if raw_status in ["INTERRUPTED", "RETAKE_ENABLED", "ACCESS_DISABLED", "EXPIRED", "SHORTLISTED", "REJECTED", "ARCHIVED", "TEST_RESET"]:
                status = raw_status
            elif raw_status == "COMPLETED" or assign.completed_at or (invitation and invitation.status == "COMPLETED"):
                status = "REVIEW_PENDING" if percentage < 60.0 else "COMPLETED"
            elif raw_status in ["IN_PROGRESS", "STARTED"] or assign.started_at or (invitation and invitation.status == "OPENED") or len(submissions) > 0:
                status = "IN_PROGRESS"
            else:
                status = "INVITED"

            # Timing
            started_at = assign.started_at or (invitation.opened_at if invitation else None)
            finished_at = assign.completed_at or (invitation.completed_at if invitation else None)
            time_taken_mins = None
            if started_at and finished_at:
                diff_sec = (finished_at - started_at).total_seconds()
                time_taken_mins = round(max(1.0, diff_sec / 60.0), 1)

            # Interview detail parsing
            interview_info = None
            if assign.interview_details_json:
                try:
                    interview_info = InterviewDetail(**assign.interview_details_json)
                except Exception:
                    pass

            item = CandidateListItem(
                id=assign.id,
                student_id=assign.student_id,
                name=student.full_name if student else "Candidate",
                email=student.email if student else "candidate@email.com",
                student_id_code=student.student_id_code if student else None,
                assigned_at=assign.assigned_at,
                started_at=started_at,
                finished_at=finished_at,
                status=status,
                integrity_index=assign.integrity_status or integrity_label,
                integrity_score=float(assign.integrity_score) if assign.integrity_score is not None else integrity_score,
                attempt_percentage=round(attempt_pct, 1),
                total_score=round(total_score, 2),
                max_score=round(total_max_marks, 2),
                percentage=round(percentage, 1),
                time_taken_minutes=time_taken_mins,
                time_extension_minutes=assign.time_extension_minutes or 0,
                interview_details=interview_info,
                proctoring_violations_count=violations_count,
                active_attempt_number=active_attempt_num,
                re_enable_reason=last_re_enable_reason
            )

            all_candidate_items.append(item)

            # Update category counts
            if status in ["COMPLETED", "REVIEW_PENDING", "SHORTLISTED", "REJECTED", "ARCHIVED"] or finished_at is not None:
                counts["test_taken"] += 1
            if status in ["REVIEW_PENDING", "COMPLETED"]:
                counts["review_pending"] += 1
            if status == "SHORTLISTED":
                counts["shortlisted"] += 1
            if status == "ARCHIVED":
                counts["archived"] += 1
            if status == "TEST_RESET":
                counts["test_reset"] += 1
            if status == "INTERRUPTED":
                counts["interrupted"] += 1
            if status == "RETAKE_ENABLED":
                counts["retake_enabled"] += 1
            if status in ["INVITED", "NOT_STARTED"] and finished_at is None:
                counts["invited"] += 1

        # Apply filtering
        filtered_items = all_candidate_items
        if status_filter and status_filter.lower() != "all":
            sf = status_filter.lower().replace(" ", "_")
            if sf == "test_taken":
                filtered_items = [c for c in filtered_items if c.status in ["COMPLETED", "REVIEW_PENDING", "SHORTLISTED", "REJECTED", "ARCHIVED"] or c.finished_at is not None]
            elif sf == "review_pending":
                filtered_items = [c for c in filtered_items if c.status in ["REVIEW_PENDING", "COMPLETED"]]
            elif sf == "shortlisted":
                filtered_items = [c for c in filtered_items if c.status == "SHORTLISTED"]
            elif sf == "archived":
                filtered_items = [c for c in filtered_items if c.status == "ARCHIVED"]
            elif sf == "test_reset":
                filtered_items = [c for c in filtered_items if c.status == "TEST_RESET"]
            elif sf == "interrupted":
                filtered_items = [c for c in filtered_items if c.status == "INTERRUPTED"]
            elif sf == "retake_enabled":
                filtered_items = [c for c in filtered_items if c.status == "RETAKE_ENABLED"]
            elif sf == "invited":
                filtered_items = [c for c in filtered_items if c.status in ["INVITED", "STARTED", "IN_PROGRESS"] and c.finished_at is None]

        if search_query and search_query.strip():
            sq = search_query.strip().lower()
            filtered_items = [
                c for c in filtered_items
                if sq in c.name.lower() or sq in c.email.lower() or (c.student_id_code and sq in c.student_id_code.lower())
            ]

        return CandidateListResponse(
            candidates=filtered_items,
            counts=CandidateFilterCounts(**counts),
            total=len(filtered_items)
        )

    async def get_candidate_drilldown(
        self,
        db: AsyncSession,
        assessment_id: str,
        assignment_id: str
    ) -> Optional[CandidateDetailResponse]:
        """
        Builds a comprehensive drilldown for a single candidate, including
        question-wise results, test cases evaluations, proctoring events timeline, and interview details.
        """
        stmt_assign = (
            select(AssessmentAssignment)
            .where(
                and_(
                    AssessmentAssignment.id == assignment_id,
                    AssessmentAssignment.assessment_id == assessment_id
                )
            )
            .options(
                selectinload(AssessmentAssignment.student),
                selectinload(AssessmentAssignment.invitation),
                selectinload(AssessmentAssignment.submissions).selectinload(StudentSubmission.results).selectinload(SubmissionTestCaseResult.test_case),
                selectinload(AssessmentAssignment.assessment).selectinload(Assessment.question_links).selectinload(AssessmentQuestion.question).selectinload(Question.test_cases),
                selectinload(AssessmentAssignment.attempts).selectinload(CandidateAttempt.re_enabled_by)
            )
        )
        res_assign = await db.execute(stmt_assign)
        assign = res_assign.scalar_one_or_none()
        if not assign:
            return None

        student = assign.student
        assessment = assign.assessment
        invitation = assign.invitation
        submissions = assign.submissions or []

        # Fetch proctoring events
        stmt_proc = (
            select(ProctoringEvent)
            .where(
                and_(
                    ProctoringEvent.assessment_id == assessment_id,
                    ProctoringEvent.student_id == assign.student_id
                )
            )
            .order_by(ProctoringEvent.created_at.asc())
        )
        res_proc = await db.execute(stmt_proc)
        proc_events = res_proc.scalars().all()

        # Build Question Performance Breakdown
        question_details: List[QuestionSubmissionDetail] = []
        total_earned = 0.0
        total_possible = 0.0
        attempted_qids = set()

        for idx, qlink in enumerate(assessment.question_links):
            q = qlink.question
            q_max = float(qlink.marks or q.marks or 10.0)
            total_possible += q_max

            # Find best submission for this question
            q_subs = [s for s in submissions if s.question_id == q.id]
            best_sub = max(q_subs, key=lambda s: float(s.calculated_score)) if q_subs else None

            score_earned = float(best_sub.calculated_score) if best_sub else 0.0
            total_earned += score_earned
            if best_sub:
                attempted_qids.add(q.id)

            tc_items: List[TestCaseEvaluationItem] = []
            if best_sub and best_sub.results:
                for r in best_sub.results:
                    tc_name = r.test_case.name if r.test_case else "Test Case"
                    tc_type = r.test_case.test_type if r.test_case else "PUBLIC"
                    tc_items.append(TestCaseEvaluationItem(
                        test_case_id=r.test_case_id,
                        name=tc_name,
                        test_type=tc_type,
                        weight=float(r.weight),
                        score_awarded=float(r.score_awarded),
                        passed=r.passed,
                        execution_time_ms=float(r.execution_time_ms) if r.execution_time_ms else None,
                        safe_error_message=r.safe_error_message
                    ))
            elif q.test_cases:
                for tc in q.test_cases:
                    tc_items.append(TestCaseEvaluationItem(
                        test_case_id=tc.id,
                        name=tc.name,
                        test_type=tc.test_type,
                        weight=float(tc.weight),
                        score_awarded=0.0,
                        passed=False,
                        execution_time_ms=None,
                        safe_error_message="Not Attempted"
                    ))

            mcq_sel = None
            if q.question_type == "MCQ" and best_sub:
                mcq_sel = best_sub.submitted_sql

            question_details.append(QuestionSubmissionDetail(
                question_id=q.id,
                question_number=idx + 1,
                title=q.title,
                question_type=q.question_type or "SQL_TECHNICAL",
                difficulty=q.difficulty or "MEDIUM",
                marks=q_max,
                score_earned=score_earned,
                submitted_code=best_sub.submitted_sql if best_sub else None,
                passed_test_cases_count=best_sub.passed_test_cases_count if best_sub else 0,
                total_test_cases_count=len(q.test_cases) if q.test_cases else 0,
                is_plagiarized=best_sub.is_plagiarized if best_sub else False,
                similarity_score=float(best_sub.similarity_score) if best_sub else 0.0,
                mcq_selected_option=mcq_sel,
                mcq_options=q.mcq_options_json,
                test_cases=tc_items
            ))

        # Timing
        started_at = assign.started_at or (invitation.opened_at if invitation else None)
        finished_at = assign.completed_at or (invitation.completed_at if invitation else None)
        time_taken_mins = None
        if started_at and finished_at:
            diff_sec = (finished_at - started_at).total_seconds()
            time_taken_mins = round(max(1.0, diff_sec / 60.0), 1)

        # Integrity calculation
        violations_count = sum(pe.violation_count for pe in proc_events)
        plag_count = sum(1 for s in submissions if s.is_plagiarized)
        integrity_label, integrity_score = self._compute_integrity_index(violations_count, plag_count)

        proc_summary = {
            "total_violations": violations_count,
            "tab_switches": sum(pe.violation_count for pe in proc_events if pe.event_type == "TAB_SWITCH"),
            "fullscreen_exits": sum(pe.violation_count for pe in proc_events if pe.event_type == "FULLSCREEN_EXIT"),
            "copy_paste_attempts": sum(pe.violation_count for pe in proc_events if pe.event_type == "COPY_PASTE"),
            "face_anomalies": sum(pe.violation_count for pe in proc_events if pe.event_type in ["NO_FACE", "MULTIPLE_FACES"]),
            "audio_spikes": sum(pe.violation_count for pe in proc_events if pe.event_type == "AUDIO_SPIKE"),
            "ip_violations": sum(pe.violation_count for pe in proc_events if pe.event_type == "IP_VIOLATION"),
            "plagiarism_flags": plag_count
        }

        # Interview
        interview_info = None
        if assign.interview_details_json:
            try:
                interview_info = InterviewDetail(**assign.interview_details_json)
            except Exception:
                pass

        total_q_count = len(assessment.question_links)
        if submissions:
            percentage = (total_earned / total_possible * 100.0) if total_possible > 0 else 0.0
            attempt_pct = (len(attempted_qids) / total_q_count * 100.0) if total_q_count > 0 else (100.0 if submissions else 0.0)
        else:
            total_earned = float(assign.total_score) if assign.total_score is not None else 0.0
            percentage = float(assign.percentage) if assign.percentage is not None else 0.0
            attempt_pct = float(assign.attempt_percentage) if assign.attempt_percentage is not None else 0.0

        # Build Attempt History records
        stmt_att = (
            select(CandidateAttempt)
            .where(CandidateAttempt.assignment_id == assignment_id)
            .options(selectinload(CandidateAttempt.re_enabled_by))
            .order_by(CandidateAttempt.attempt_number.asc())
        )
        res_att = await db.execute(stmt_att)
        attempts = list(res_att.scalars().all())
        attempt_history_items: List[CandidateAttemptHistoryItem] = []
        active_att = None
        for att in attempts:
            if att.is_active:
                active_att = att
            dur_used = None
            if att.time_spent_seconds:
                dur_used = round(att.time_spent_seconds / 60.0, 1)
            elif att.started_at and att.completed_at:
                dur_used = round((att.completed_at - att.started_at).total_seconds() / 60.0, 1)

            rem_mins = round(att.time_remaining_seconds / 60.0, 1) if att.time_remaining_seconds is not None else None
            admin_name = att.re_enabled_by.full_name if att.re_enabled_by else ("Admin" if att.re_enabled_at else None)
            type_str = f"Re-enabled by {admin_name}" if att.re_enabled_at else (f"Attempt {att.attempt_number}" if att.attempt_number > 1 else "Initial Attempt")

            attempt_history_items.append(CandidateAttemptHistoryItem(
                id=att.id,
                attempt_number=att.attempt_number,
                status=att.status,
                started_at=att.started_at,
                completed_at=att.completed_at,
                duration_used_minutes=dur_used,
                time_remaining_minutes=rem_mins,
                attempted_questions_count=att.attempted_questions_count or len(attempted_qids),
                total_questions_count=att.total_questions_count or total_q_count,
                total_score=float(att.total_score) if att.total_score is not None else total_earned,
                percentage=float(att.percentage) if att.percentage is not None else percentage,
                is_active=att.is_active,
                type_label=type_str,
                re_enabled_by_name=admin_name,
                re_enabled_at=att.re_enabled_at,
                re_enable_action=att.re_enable_action,
                re_enable_reason=att.re_enable_reason
            ))

        if not attempt_history_items:
            # Synthesize Attempt 1 for backwards compatibility with legacy database rows
            attempt_history_items.append(CandidateAttemptHistoryItem(
                id=f"att-{assign.id[:8]}",
                attempt_number=1,
                status=assign.status or "INVITED",
                started_at=started_at,
                completed_at=finished_at,
                duration_used_minutes=time_taken_mins,
                time_remaining_minutes=max(0.0, assessment.duration_minutes - (time_taken_mins or 0.0)) if time_taken_mins else assessment.duration_minutes,
                attempted_questions_count=len(attempted_qids),
                total_questions_count=total_q_count,
                total_score=round(total_earned, 2),
                percentage=round(percentage, 1),
                is_active=True,
                type_label="Initial Attempt"
            ))

        active_attempt_id = active_att.id if active_att else (attempts[-1].id if attempts else None)
        active_attempt_num = active_att.attempt_number if active_att else (len(attempt_history_items) or 1)

        re_enable_meta = None
        if active_att and active_att.re_enabled_at:
            re_enable_meta = {
                "action": active_att.re_enable_action,
                "time_mode": active_att.re_enable_time_mode,
                "additional_minutes": active_att.re_enable_additional_minutes,
                "reason": active_att.re_enable_reason,
                "re_enabled_at": active_att.re_enabled_at.isoformat() if active_att.re_enabled_at else None,
                "re_enabled_by": active_att.re_enabled_by.full_name if active_att.re_enabled_by else "Admin"
            }

        return CandidateDetailResponse(
            assignment_id=assign.id,
            assessment_id=assessment.id,
            assessment_title=assessment.title,
            student_id=student.id if student else "",
            name=student.full_name if student else "Candidate",
            email=student.email if student else "candidate@email.com",
            student_id_code=student.student_id_code if student else None,
            status=assign.status or "INVITED",
            assigned_at=assign.assigned_at,
            started_at=started_at,
            finished_at=finished_at,
            duration_minutes=assessment.duration_minutes,
            time_taken_minutes=time_taken_mins,
            time_extension_minutes=assign.time_extension_minutes or 0,
            total_score=round(total_earned, 2),
            max_score=round(total_possible, 2),
            percentage=round(percentage, 1),
            attempt_percentage=round(attempt_pct, 1),
            integrity_status=assign.integrity_status or integrity_label,
            integrity_score=float(assign.integrity_score) if assign.integrity_score is not None else integrity_score,
            proctoring_summary=proc_summary,
            proctoring_events=[CandidateProctoringEvent.model_validate(pe) for pe in proc_events],
            interview_details=interview_info,
            review_notes=assign.review_notes,
            questions=question_details,
            active_attempt_id=active_attempt_id,
            active_attempt_number=active_attempt_num,
            attempt_history=attempt_history_items,
            re_enable_details=re_enable_meta
        )

    async def re_enable_candidate_test(
        self,
        db: AsyncSession,
        assessment_id: str,
        payload: ReEnableCandidateTestRequest,
        admin_id: str
    ) -> Dict[str, Any]:
        """
        Re-enables assessment for a specific candidate with option to Resume Previous Attempt
        or Start a New Attempt, custom time configuration, and audit logging.
        """
        # 1. Validate assessment
        stmt_ass = select(Assessment).where(Assessment.id == assessment_id).options(
            selectinload(Assessment.question_links)
        )
        res_ass = await db.execute(stmt_ass)
        assessment = res_ass.scalar_one_or_none()
        if not assessment:
            raise ValueError("Assessment not found")
        if assessment.status == "ARCHIVED":
            raise ValueError("Cannot re-enable test: assessment is archived or closed.")

        # 2. Fetch assignment
        stmt = (
            select(AssessmentAssignment)
            .where(
                and_(
                    AssessmentAssignment.assessment_id == assessment_id,
                    AssessmentAssignment.id == payload.assignment_id
                )
            )
            .options(
                selectinload(AssessmentAssignment.student),
                selectinload(AssessmentAssignment.invitation),
                selectinload(AssessmentAssignment.attempts)
            )
        )
        res = await db.execute(stmt)
        assign = res.scalar_one_or_none()
        if not assign:
            raise ValueError("Candidate assignment not found.")

        # 3. Fetch admin user
        stmt_admin = select(User).where(User.id == admin_id)
        res_admin = await db.execute(stmt_admin)
        admin = res_admin.scalar_one_or_none()
        admin_name = admin.full_name if admin else "Admin"

        eff_reason = payload.custom_reason if payload.reason == "Other" and payload.custom_reason else (payload.reason or "Admin approved re-enable")
        attempts = assign.attempts or []

        if payload.action == "RESUME_PREVIOUS":
            # Resume existing attempt
            active_attempt = next((a for a in attempts if a.is_active), None) or (attempts[-1] if attempts else None)
            if not active_attempt:
                active_attempt = CandidateAttempt(
                    assignment_id=assign.id,
                    student_id=assign.student_id,
                    assessment_id=assessment_id,
                    attempt_number=1,
                    status="RETAKE_ENABLED",
                    time_spent_seconds=0,
                    time_remaining_seconds=assessment.duration_minutes * 60,
                    time_limit_minutes=assessment.duration_minutes,
                    is_active=True
                )
                db.add(active_attempt)
                await db.flush()

            # Time adjustments
            if payload.time_mode == "FULL_DURATION":
                active_attempt.time_remaining_seconds = assessment.duration_minutes * 60
                active_attempt.time_limit_minutes = assessment.duration_minutes
            elif payload.time_mode == "ADD_ADDITIONAL_TIME":
                add_mins = payload.additional_minutes or 30
                assign.time_extension_minutes = (assign.time_extension_minutes or 0) + add_mins
                cur_rem = active_attempt.time_remaining_seconds or 0
                active_attempt.time_remaining_seconds = cur_rem + (add_mins * 60)
            elif payload.time_mode == "REMAINING_TIME":
                if active_attempt.time_remaining_seconds is None or active_attempt.time_remaining_seconds <= 0:
                    active_attempt.time_remaining_seconds = assessment.duration_minutes * 60

            active_attempt.status = "RETAKE_ENABLED"
            active_attempt.is_active = True
            active_attempt.re_enabled_by_id = admin_id
            active_attempt.re_enabled_at = datetime.utcnow()
            active_attempt.re_enable_action = "RESUME_PREVIOUS"
            active_attempt.re_enable_time_mode = payload.time_mode
            active_attempt.re_enable_additional_minutes = payload.additional_minutes or 0
            active_attempt.re_enable_reason = eff_reason

            assign.status = "RETAKE_ENABLED"
            assign.completed_at = None

            if assign.invitation:
                assign.invitation.status = "OPENED"
                assign.invitation.completed_at = None
                if not assign.invitation.expires_at or assign.invitation.expires_at < datetime.utcnow():
                    assign.invitation.expires_at = datetime.utcnow() + timedelta(days=7)

            action_desc = "Resumed previous attempt"
            attempt_num = active_attempt.attempt_number

        else:  # START_NEW
            # Archive previous attempts
            for att in attempts:
                att.is_active = False
                if att.status in ["IN_PROGRESS", "RETAKE_ENABLED", "NOT_STARTED"]:
                    att.status = "INTERRUPTED"

            new_attempt_num = (max([a.attempt_number for a in attempts] or [0])) + 1
            add_mins = payload.additional_minutes if payload.time_mode == "ADD_ADDITIONAL_TIME" else 0
            new_duration = assessment.duration_minutes + add_mins

            new_attempt = CandidateAttempt(
                assignment=assign,
                assignment_id=assign.id,
                student_id=assign.student_id,
                assessment_id=assessment_id,
                attempt_number=new_attempt_num,
                status="RETAKE_ENABLED",
                started_at=None,
                completed_at=None,
                time_spent_seconds=0,
                time_remaining_seconds=new_duration * 60,
                time_limit_minutes=new_duration,
                questions_progress_json=None,
                total_score=0.0,
                percentage=0.0,
                attempted_questions_count=0,
                total_questions_count=len(assessment.question_links),
                is_active=True,
                re_enabled_by_id=admin_id,
                re_enabled_at=datetime.utcnow(),
                re_enable_action="START_NEW",
                re_enable_time_mode=payload.time_mode,
                re_enable_additional_minutes=add_mins,
                re_enable_reason=eff_reason
            )
            db.add(new_attempt)
            await db.flush()

            assign.status = "RETAKE_ENABLED"
            assign.started_at = None
            assign.completed_at = None
            assign.total_score = None
            assign.percentage = None
            assign.attempt_percentage = 0.0
            assign.time_extension_minutes = add_mins

            if assign.invitation:
                assign.invitation.status = "OPENED"
                assign.invitation.completed_at = None
                assign.invitation.expires_at = datetime.utcnow() + timedelta(days=7)

            action_desc = f"Started new attempt #{new_attempt_num}"
            attempt_num = new_attempt_num

        db.add(AuditLog(
            actor_id=admin_id,
            action="CANDIDATE_TEST_RE_ENABLED",
            entity_type="AssessmentAssignment",
            entity_id=assign.id,
            details_json={
                "action": payload.action,
                "time_mode": payload.time_mode,
                "additional_minutes": payload.additional_minutes,
                "reason": eff_reason,
                "attempt_number": attempt_num,
                "student_id": assign.student_id,
                "student_email": assign.student.email if assign.student else "",
                "candidate_name": assign.student.full_name if assign.student else "",
                "re_enabled_by": admin_name
            }
        ))

        await db.commit()

        return {
            "success": True,
            "assignment_id": assign.id,
            "status": "RETAKE_ENABLED",
            "action": payload.action,
            "attempt_number": attempt_num,
            "reason": eff_reason,
            "message": f"Successfully re-enabled test for {assign.student.full_name if assign.student else 'candidate'}. ({action_desc})"
        }

    async def get_candidate_attempts(
        self,
        db: AsyncSession,
        assessment_id: str,
        assignment_id: str
    ) -> List[CandidateAttemptHistoryItem]:
        """Fetches all attempt records for a specific candidate assignment."""
        drilldown = await self.get_candidate_drilldown(db, assessment_id, assignment_id)
        if not drilldown:
            raise ValueError("Candidate assignment not found.")
        return drilldown.attempt_history

    async def reset_candidate_tests(
        self,
        db: AsyncSession,
        assessment_id: str,
        assignment_ids: List[str],
        admin_id: str
    ) -> Dict[str, Any]:
        """Resets candidate attempt, updates status to TEST_RESET, and logs action."""
        stmt = (
            select(AssessmentAssignment)
            .where(
                and_(
                    AssessmentAssignment.assessment_id == assessment_id,
                    AssessmentAssignment.id.in_(assignment_ids)
                )
            )
            .options(selectinload(AssessmentAssignment.invitation))
        )
        res = await db.execute(stmt)
        assignments = res.scalars().all()

        reset_count = 0
        for assign in assignments:
            assign.status = "TEST_RESET"
            assign.completed_at = None
            assign.started_at = None
            if assign.invitation:
                assign.invitation.status = "OPENED"
                assign.invitation.completed_at = None
                assign.invitation.expires_at = datetime.utcnow() + timedelta(days=7)

            db.add(AuditLog(
                actor_id=admin_id,
                action="CANDIDATE_TEST_RESET",
                entity_type="AssessmentAssignment",
                entity_id=assign.id,
                details_json={"student_id": assign.student_id, "assessment_id": assessment_id}
            ))
            reset_count += 1

        await db.commit()
        return {"success": True, "reset_count": reset_count, "message": f"Successfully reset test for {reset_count} candidate(s)."}

    async def extend_candidate_time(
        self,
        db: AsyncSession,
        assessment_id: str,
        assignment_ids: List[str],
        additional_minutes: int,
        reason: Optional[str],
        admin_id: str
    ) -> Dict[str, Any]:
        """Grants time extension to candidate(s) and logs action."""
        stmt = (
            select(AssessmentAssignment)
            .where(
                and_(
                    AssessmentAssignment.assessment_id == assessment_id,
                    AssessmentAssignment.id.in_(assignment_ids)
                )
            )
            .options(selectinload(AssessmentAssignment.invitation))
        )
        res = await db.execute(stmt)
        assignments = res.scalars().all()

        extended_count = 0
        for assign in assignments:
            assign.time_extension_minutes = (assign.time_extension_minutes or 0) + additional_minutes
            if assign.invitation and assign.invitation.expires_at:
                assign.invitation.expires_at = assign.invitation.expires_at + timedelta(minutes=additional_minutes)

            db.add(AuditLog(
                actor_id=admin_id,
                action="CANDIDATE_TIME_EXTENDED",
                entity_type="AssessmentAssignment",
                entity_id=assign.id,
                details_json={
                    "additional_minutes": additional_minutes,
                    "total_extension": assign.time_extension_minutes,
                    "reason": reason
                }
            ))
            extended_count += 1

        await db.commit()
        return {
            "success": True,
            "extended_count": extended_count,
            "additional_minutes": additional_minutes,
            "message": f"Successfully extended time by {additional_minutes} minutes for {extended_count} candidate(s)."
        }

    async def schedule_interview(
        self,
        db: AsyncSession,
        assessment_id: str,
        payload: ScheduleInterviewRequest,
        admin_id: str
    ) -> Dict[str, Any]:
        """Schedules candidate interview and updates candidate review status."""
        stmt = select(AssessmentAssignment).where(
            and_(
                AssessmentAssignment.id == payload.assignment_id,
                AssessmentAssignment.assessment_id == assessment_id
            )
        )
        res = await db.execute(stmt)
        assign = res.scalar_one_or_none()
        if not assign:
            raise ValueError("Candidate assignment not found")

        interview_data = {
            "scheduled_at": f"{payload.interview_date} {payload.interview_time}",
            "interviewer": payload.interviewer_name,
            "interviewer_email": payload.interviewer_email,
            "meeting_link": payload.meeting_link,
            "notes": payload.notes
        }

        assign.interview_details_json = interview_data
        assign.status = "SHORTLISTED"

        db.add(AuditLog(
            actor_id=admin_id,
            action="INTERVIEW_SCHEDULED",
            entity_type="AssessmentAssignment",
            entity_id=assign.id,
            details_json=interview_data
        ))

        await db.commit()
        return {"success": True, "interview": interview_data, "message": "Interview successfully scheduled."}

    async def update_candidate_statuses(
        self,
        db: AsyncSession,
        assessment_id: str,
        assignment_ids: List[str],
        status: str,
        notes: Optional[str],
        admin_id: str
    ) -> Dict[str, Any]:
        """Bulk updates candidate review status (e.g. SHORTLISTED, REJECTED, ARCHIVED)."""
        stmt = select(AssessmentAssignment).where(
            and_(
                AssessmentAssignment.assessment_id == assessment_id,
                AssessmentAssignment.id.in_(assignment_ids)
            )
        )
        res = await db.execute(stmt)
        assignments = res.scalars().all()

        updated_count = 0
        for assign in assignments:
            assign.status = status.upper()
            if notes:
                assign.review_notes = notes

            db.add(AuditLog(
                actor_id=admin_id,
                action="CANDIDATE_STATUS_UPDATED",
                entity_type="AssessmentAssignment",
                entity_id=assign.id,
                details_json={"new_status": status.upper(), "notes": notes}
            ))
            updated_count += 1

        await db.commit()
        return {"success": True, "updated_count": updated_count, "new_status": status.upper()}

    async def generate_candidate_reports_csv(
        self,
        db: AsyncSession,
        assessment_id: str,
        assignment_ids: Optional[List[str]] = None,
        report_type: str = "SUMMARY_CSV",
        status_filter: Optional[str] = None
    ) -> str:
        """Generates real downloadable CSV reports based on real candidate data."""
        data_resp = await self.get_assessment_candidates(db, assessment_id, status_filter=status_filter)
        candidates = data_resp.candidates

        if assignment_ids and len(assignment_ids) > 0:
            candidates = [c for c in candidates if c.id in assignment_ids]

        output = io.StringIO()

        if report_type == "PROCTORING_CSV":
            writer = csv.writer(output)
            writer.writerow([
                "Assignment ID", "Candidate Name", "Email", "Student Code",
                "Integrity Index", "Integrity Score", "Violations Count", "Status"
            ])
            for c in candidates:
                writer.writerow([
                    c.id, c.name, c.email, c.student_id_code or "",
                    c.integrity_index, f"{c.integrity_score}%", c.proctoring_violations_count, c.status
                ])

        elif report_type == "QUESTION_BREAKDOWN_CSV":
            writer = csv.writer(output)
            writer.writerow([
                "Assignment ID", "Candidate Name", "Email", "Total Score",
                "Max Score", "Percentage", "Attempt Percentage", "Status"
            ])
            for c in candidates:
                writer.writerow([
                    c.id, c.name, c.email, c.total_score,
                    c.max_score, f"{c.percentage}%", f"{c.attempt_percentage}%", c.status
                ])

        else:  # SUMMARY_CSV
            writer = csv.writer(output)
            writer.writerow([
                "Assignment ID", "Candidate Name", "Email", "Student ID",
                "Status", "Score", "Max Score", "Percentage", "Attempt %",
                "Assigned At", "Started At", "Finished At", "Time Taken (mins)",
                "Integrity Status", "Integrity Score", "Interview Scheduled", "Interviewer"
            ])
            for c in candidates:
                interview_str = c.interview_details.scheduled_at if c.interview_details else "No"
                interviewer_str = c.interview_details.interviewer if c.interview_details else ""
                writer.writerow([
                    c.id, c.name, c.email, c.student_id_code or "",
                    c.status, c.total_score, c.max_score, f"{c.percentage}%", f"{c.attempt_percentage}%",
                    c.assigned_at.strftime("%Y-%m-%d %H:%M:%S UTC") if c.assigned_at else "",
                    c.started_at.strftime("%Y-%m-%d %H:%M:%S UTC") if c.started_at else "",
                    c.finished_at.strftime("%Y-%m-%d %H:%M:%S UTC") if c.finished_at else "",
                    c.time_taken_minutes or "",
                    c.integrity_index, f"{c.integrity_score}%",
                    interview_str, interviewer_str
                ])

        return output.getvalue()


candidate_service = CandidateService()
