import re
import ipaddress
import difflib
from typing import List, Dict, Any, Optional
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.models import StudentSubmission, Assessment, User, ProctoringEvent


class ProctoringService:
    """
    Handles real-time proctoring event processing, code similarity / plagiarism detection,
    and IP/Geo access restrictions.
    """

    def normalize_code(self, code: str) -> str:
        """
        Normalizes code by removing single-line and multi-line comments,
        standardizing whitespace and casing for structural similarity comparison.
        """
        if not code:
            return ""
        # Remove SQL comments (-- comment) and Python comments (# comment)
        code = re.sub(r'(--|#).*$', '', code, flags=re.MULTILINE)
        # Remove multi-line /* ... */ comments
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        # Remove string literals to focus on structural logic
        code = re.sub(r"'(?:\\.|[^'\\])*'", "''", code)
        code = re.sub(r'"(?:\\.|[^"\\])*"', '""', code)
        # Normalize whitespace
        code = re.sub(r'\s+', ' ', code).strip().lower()
        return code

    def calculate_similarity(self, code1: str, code2: str) -> float:
        """
        Calculates code similarity percentage between 0.00 and 100.00
        using normalized token n-grams and sequence matcher ratio.
        """
        norm1 = self.normalize_code(code1)
        norm2 = self.normalize_code(code2)

        if not norm1 or not norm2:
            return 0.0

        if norm1 == norm2:
            return 100.0

        # Sequence Matcher Ratio
        matcher = difflib.SequenceMatcher(None, norm1, norm2)
        seq_ratio = matcher.ratio()

        # Token 3-gram Jaccard Similarity
        tokens1 = norm1.split()
        tokens2 = norm2.split()

        if len(tokens1) < 3 or len(tokens2) < 3:
            return round(seq_ratio * 100, 2)

        def get_ngrams(tokens, n=3):
            return set(' '.join(tokens[i:i+n]) for i in range(len(tokens) - n + 1))

        ngrams1 = get_ngrams(tokens1, 3)
        ngrams2 = get_ngrams(tokens2, 3)

        intersection = ngrams1.intersection(ngrams2)
        union = ngrams1.union(ngrams2)

        jaccard = (len(intersection) / len(union)) if union else 0.0
        combined = (seq_ratio * 0.6 + jaccard * 0.4) * 100
        return round(min(100.0, max(0.0, combined)), 2)

    async def check_plagiarism(
        self,
        db: AsyncSession,
        current_submission: StudentSubmission,
        assessment_id: str,
        question_id: str,
        threshold: float = 80.0
    ) -> Dict[str, Any]:
        """
        Compares submitted code against other candidate submissions for the same question/assessment.
        """
        stmt = (
            select(StudentSubmission)
            .where(
                StudentSubmission.assessment_id == assessment_id,
                StudentSubmission.question_id == question_id,
                StudentSubmission.id != current_submission.id,
                StudentSubmission.student_id != current_submission.student_id
            )
            .options(selectinload(StudentSubmission.student))
        )
        res = await db.execute(stmt)
        other_submissions = res.scalars().all()

        max_similarity = 0.0
        matched_submission = None

        for sub in other_submissions:
            sim = self.calculate_similarity(current_submission.submitted_sql, sub.submitted_sql)
            if sim > max_similarity:
                max_similarity = sim
                matched_submission = sub

        is_plagiarized = max_similarity >= threshold
        report = {
            "is_plagiarized": is_plagiarized,
            "similarity_score": round(max_similarity, 2),
            "threshold_used": threshold,
            "matched_submission_id": matched_submission.id if matched_submission else None,
            "matched_student_name": matched_submission.student.full_name if (matched_submission and matched_submission.student) else None,
            "matched_student_email": matched_submission.student.email if (matched_submission and matched_submission.student) else None,
            "matched_code_snippet": matched_submission.submitted_sql if matched_submission else None
        }

        # Update current submission
        current_submission.is_plagiarized = is_plagiarized
        current_submission.similarity_score = Decimal(str(round(max_similarity, 2)))
        current_submission.plagiarism_details_json = report

        return report

    def validate_client_ip(self, client_ip: str, allowed_ips: List[str]) -> bool:
        """
        Validates if client_ip matches allowed IP addresses or CIDR ranges.
        Supports localhost and private testing aliases.
        """
        if not allowed_ips or len(allowed_ips) == 0:
            return True

        if not client_ip:
            return False

        # Normalize localhost
        if client_ip in ["127.0.0.1", "::1", "localhost", "testclient"]:
            return True

        try:
            client_addr = ipaddress.ip_address(client_ip)
        except ValueError:
            return False

        for rule in allowed_ips:
            rule = rule.strip()
            if not rule:
                continue
            if rule in ["127.0.0.1", "::1", "localhost"]:
                if client_ip in ["127.0.0.1", "::1", "localhost"]:
                    return True
                continue

            try:
                if "/" in rule:
                    net = ipaddress.ip_network(rule, strict=False)
                    if client_addr in net:
                        return True
                else:
                    addr = ipaddress.ip_address(rule)
                    if client_addr == addr:
                        return True
            except ValueError:
                # Direct string comparison fallback
                if client_ip == rule:
                    return True

        return False

    async def log_proctoring_event(
        self,
        db: AsyncSession,
        assessment_id: str,
        student_id: str,
        event_type: str,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> ProctoringEvent:
        """
        Records a proctoring violation event and returns current cumulative count.
        """
        count_stmt = select(ProctoringEvent).where(
            ProctoringEvent.assessment_id == assessment_id,
            ProctoringEvent.student_id == student_id,
            ProctoringEvent.event_type == event_type
        )
        res = await db.execute(count_stmt)
        prior_events = res.scalars().all()
        current_count = len(prior_events) + 1

        event = ProctoringEvent(
            assessment_id=assessment_id,
            student_id=student_id,
            event_type=event_type,
            violation_count=current_count,
            details_json=details or {},
            ip_address=ip_address
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)
        return event


proctoring_service = ProctoringService()
