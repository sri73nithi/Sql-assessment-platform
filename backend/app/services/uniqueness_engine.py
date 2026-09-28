import hashlib
import re
from typing import Dict, Any, List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import QuestionFingerprint


class PermanentUniquenessEngine:
    """
    Implements a 5-layer permanent question deduplication and fingerprinting engine.
    Fingerprints are permanently stored in the `question_fingerprints` table and are
    never removed, guaranteeing that logically identical questions are never regenerated.
    """

    @staticmethod
    def _normalize_text(text: str) -> str:
        """Strips punctuation, converts to lowercase, normalizes whitespace."""
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    @staticmethod
    def compute_exact_text_hash(scenario: str, problem_statement: str, task: str) -> str:
        """Layer 1: SHA-256 hash of normalized text."""
        combined = PermanentUniquenessEngine._normalize_text(f"{scenario} {problem_statement} {task}")
        return hashlib.sha256(combined.encode('utf-8')).hexdigest()

    @staticmethod
    def compute_canonical_problem_hash(problem_statement: str, task: str, difficulty: str) -> str:
        """
        Layer 2: Extracts abstract logical operations (e.g. JOIN, CTE, WINDOW, GROUP_BY, HAVING, TOP_N).
        """
        norm = PermanentUniquenessEngine._normalize_text(f"{problem_statement} {task}")
        keywords = []
        op_patterns = [
            ("join", r"\bjoin\b|\balong with\b|\bcombine\b"),
            ("group_by", r"\bgroup\b|\baggregate\b|\btotal per\b|\bcount per\b|\baverage\b"),
            ("having", r"\bhaving\b|\bfilter aggregated\b|\bmin count\b"),
            ("window", r"\brank\b|\bdense_rank\b|\brow_number\b|\blag\b|\blead\b|\brunning\b"),
            ("subquery_cte", r"\bcte\b|\bsubquery\b|\bnested\b|\bwith clause\b"),
            ("order_by", r"\bsort\b|\border\b|\bhighest\b|\blowest\b|\btop\b|\bbottom\b"),
            ("distinct", r"\bunique\b|\bdistinct\b")
        ]
        for op_name, pattern in op_patterns:
            if re.search(pattern, norm):
                keywords.append(op_name)
        
        canonical_str = f"{difficulty.lower()}:{':'.join(sorted(keywords))}"
        return hashlib.sha256(canonical_str.encode('utf-8')).hexdigest()

    @staticmethod
    def compute_sql_structure_hash(reference_sql: str) -> str:
        """
        Layer 3: Structural SQL fingerprint stripping aliases, constants, literal strings, and spacing.
        """
        sql = reference_sql.lower()
        # Strip comments
        sql = re.sub(r'--.*?\n', ' ', sql)
        sql = re.sub(r'/\*.*?\*/', ' ', sql, flags=re.DOTALL)
        # Strip literal strings and numbers
        sql = re.sub(r"'[^']*'", "'?'", sql)
        sql = re.sub(r'\b\d+\b', '?', sql)
        # Strip aliases (AS alias_name)
        sql = re.sub(r'\bas\s+\w+', '', sql)
        # Normalize whitespace
        sql = re.sub(r'\s+', ' ', sql).strip()
        return hashlib.sha256(sql.encode('utf-8')).hexdigest()

    @staticmethod
    def compute_schema_fingerprint_hash(tables_schema: List[Dict[str, Any]]) -> str:
        """
        Layer 4: Hash of table and column signatures.
        """
        sig_parts = []
        for table in sorted(tables_schema, key=lambda t: t.get("name", "")):
            tname = table.get("name", "").lower()
            cols = sorted([c.get("name", "").lower() for c in table.get("columns", [])])
            sig_parts.append(f"{tname}({','.join(cols)})")
        schema_sig = ";".join(sig_parts)
        return hashlib.sha256(schema_sig.encode('utf-8')).hexdigest()

    @staticmethod
    def compute_semantic_similarity(text1: str, text2: str) -> float:
        """
        Layer 5: Jaccard n-gram token overlap of problem intent.
        """
        norm1 = set(PermanentUniquenessEngine._normalize_text(text1).split())
        norm2 = set(PermanentUniquenessEngine._normalize_text(text2).split())
        if not norm1 or not norm2:
            return 0.0
        intersection = norm1.intersection(norm2)
        union = norm1.union(norm2)
        return len(intersection) / len(union)

    async def is_duplicate(
        self,
        db: AsyncSession,
        scenario: str,
        problem_statement: str,
        task: str,
        difficulty: str,
        reference_sql: str,
        tables_schema: List[Dict[str, Any]],
        current_batch_fingerprints: Optional[List[Dict[str, str]]] = None
    ) -> Tuple[bool, str]:
        """
        Checks candidate question against permanent DB fingerprints and current batch candidates.
        Returns (is_duplicate: bool, reason: str).
        """
        exact_hash = self.compute_exact_text_hash(scenario, problem_statement, task)
        canonical_hash = self.compute_canonical_problem_hash(problem_statement, task, difficulty)
        sql_hash = self.compute_sql_structure_hash(reference_sql)
        schema_hash = self.compute_schema_fingerprint_hash(tables_schema)

        # 1. Check against current generation batch items first
        if current_batch_fingerprints:
            for item in current_batch_fingerprints:
                if item["exact_text_hash"] == exact_hash:
                    return True, "Duplicate of another question in the current generation batch (Exact text match)"
                if item["sql_structure_hash"] == sql_hash and item["canonical_problem_hash"] == canonical_hash:
                    return True, "Duplicate of another question in the current generation batch (Identical SQL logic)"

        # 2. Query permanent DB fingerprints table
        result = await db.execute(select(QuestionFingerprint))
        existing_fps = result.scalars().all()

        for fp in existing_fps:
            # Layer 1 match
            if fp.exact_text_hash == exact_hash:
                return True, "Exact text duplicate of existing question"
            
            # Layer 2 + Layer 3 match (Same logical problem & reference SQL structure)
            if fp.sql_structure_hash == sql_hash and fp.canonical_problem_hash == canonical_hash:
                return True, "Canonical logic duplicate: Question asks the exact same SQL challenge"
            
            # Layer 5 semantic similarity threshold check (> 0.85 Jaccard overlap on same schema)
            if fp.schema_fingerprint_hash == schema_hash and fp.sql_structure_hash == sql_hash:
                return True, "Semantic duplicate: Same underlying relational structure and query transformation"

        return False, ""

    def generate_fingerprint_data(
        self,
        question_id: str,
        scenario: str,
        problem_statement: str,
        task: str,
        difficulty: str,
        reference_sql: str,
        tables_schema: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generates complete fingerprint dictionary ready for DB insertion."""
        return {
            "question_id": question_id,
            "exact_text_hash": self.compute_exact_text_hash(scenario, problem_statement, task),
            "canonical_problem_hash": self.compute_canonical_problem_hash(problem_statement, task, difficulty),
            "sql_structure_hash": self.compute_sql_structure_hash(reference_sql),
            "schema_fingerprint_hash": self.compute_schema_fingerprint_hash(tables_schema),
            "semantic_vector_json": {
                "difficulty": difficulty,
                "schema_tables_count": len(tables_schema)
            }
        }


uniqueness_engine = PermanentUniquenessEngine()
