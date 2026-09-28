import hashlib
import re
from typing import Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import QuestionFingerprint, Question


class UniquenessService:
    """
    Computes permanent structural and semantic fingerprints for questions.
    Checks against the database table `question_fingerprints` to reject exact, disguised,
    or structural duplicates BEFORE adding them to the Question Library.
    """

    def compute_fingerprints(self, q: Dict[str, Any]) -> Tuple[str, str, str, str]:
        title = (q.get("title") or "").strip().lower()
        prob = (q.get("problem_statement") or "").strip().lower()
        sql = (q.get("reference_sql") or "").strip().lower()
        schema = str(q.get("tables_schema_json") or q.get("schema_ddl") or "").strip().lower()

        # 1. Exact Normalized Text Hash
        raw_text = f"{title}|{prob}"
        exact_text_hash = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()

        # 2. Canonical Problem Fingerprint (stripping digits, punctuation, and extra whitespace)
        canonical_text = re.sub(r"\d+", "N", prob)
        canonical_text = re.sub(r"[^\w\s]", "", canonical_text)
        canonical_text = re.sub(r"\s+", " ", canonical_text).strip()
        canonical_problem_hash = hashlib.sha256(f"{title}|{canonical_text}".encode("utf-8")).hexdigest()

        # 3. SQL / Algorithm Structure Hash (normalizing SQL keywords and identifiers)
        sql_clean = re.sub(r"\s+", " ", sql)
        sql_clean = re.sub(r"\b\d+\b", "N", sql_clean)
        sql_structure_hash = hashlib.sha256(sql_clean.encode("utf-8")).hexdigest()

        # 4. Schema Fingerprint Hash
        schema_clean = re.sub(r"\s+", " ", schema)
        schema_fingerprint_hash = hashlib.sha256(schema_clean.encode("utf-8")).hexdigest()

        return exact_text_hash, canonical_problem_hash, sql_structure_hash, schema_fingerprint_hash

    async def check_uniqueness(self, db: AsyncSession, q: Dict[str, Any]) -> Tuple[bool, str]:
        exact_hash, canonical_hash, sql_hash, schema_hash = self.compute_fingerprints(q)

        # Check exact text hash in DB
        stmt1 = select(QuestionFingerprint).where(QuestionFingerprint.exact_text_hash == exact_hash)
        res1 = await db.execute(stmt1)
        if res1.scalar_one_or_none():
            return False, "Duplicate question detected: Exact problem statement already exists in library."

        # Check canonical problem hash in DB
        stmt2 = select(QuestionFingerprint).where(QuestionFingerprint.canonical_problem_hash == canonical_hash)
        res2 = await db.execute(stmt2)
        if res2.scalar_one_or_none():
            return False, "Duplicate question detected: Disguised version of an existing problem statement."

        return True, "Question is unique."

    async def record_fingerprint(self, db: AsyncSession, question_id: str, q: Dict[str, Any]):
        exact_hash, canonical_hash, sql_hash, schema_hash = self.compute_fingerprints(q)
        
        # Avoid inserting duplicate exact_text_hash or duplicate question_id
        stmt = select(QuestionFingerprint).where(
            (QuestionFingerprint.question_id == question_id) |
            (QuestionFingerprint.exact_text_hash == exact_hash)
        )
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()
        if existing:
            return

        fp = QuestionFingerprint(
            question_id=question_id,
            exact_text_hash=exact_hash,
            canonical_problem_hash=canonical_hash,
            sql_structure_hash=sql_hash,
            schema_fingerprint_hash=schema_hash
        )
        db.add(fp)
        await db.flush()


uniqueness_service = UniquenessService()
