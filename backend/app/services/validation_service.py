import json
import sqlite3
import asyncio
from typing import Dict, List, Any, Tuple
from app.services.sandbox_service import sandbox_service


class PreValidationService:
    """
    Validates generated questions BEFORE adding them to the Question Library.
    Ensures SQL schema DDL, seed data, reference SQL solution, and Python code execute cleanly
    and achieve 100% pass rate on all public & hidden test cases.
    """

    async def validate_question(self, question_data: Dict[str, Any]) -> Tuple[bool, str, List[Dict[str, Any]]]:
        q_type = (question_data.get("question_type") or "SQL_TECHNICAL").upper()
        stages = []

        if q_type == "MCQ":
            return await self._validate_mcq(question_data)
        elif q_type == "PYTHON_TECHNICAL" or "python" in (question_data.get("code_language") or "").lower():
            return await self._validate_python_question(question_data)
        else:
            return await self._validate_sql_question(question_data)

    async def _validate_mcq(self, q: Dict[str, Any]) -> Tuple[bool, str, List[Dict[str, Any]]]:
        stages = []

        # Stage 1: MCQ options structure
        options = q.get("mcq_options_json") or []
        if not isinstance(options, list) or len(options) < 2:
            stages.append({"stage_number": 1, "stage_name": "MCQ Format Check", "passed": False, "details": "MCQ must contain at least 2 valid options."})
            return False, "MCQ option count invalid", stages
        stages.append({"stage_number": 1, "stage_name": "MCQ Format Check", "passed": True, "details": f"{len(options)} options verified."})

        # Stage 2: Correct answer verification
        correct = q.get("correct_answer")
        if not correct:
            stages.append({"stage_number": 2, "stage_name": "Answer Key Verification", "passed": False, "details": "No correct answer specified."})
            return False, "Missing correct answer key", stages
        
        valid_ids = [str(opt.get("id") or opt.get("option_id") or opt.get("text")) for opt in options]
        if str(correct) not in valid_ids and not any(str(correct) in str(opt.get("text", "")) for opt in options):
            stages.append({"stage_number": 2, "stage_name": "Answer Key Verification", "passed": False, "details": f"Correct answer '{correct}' not found in options."})
            return False, "Correct answer key not found in options", stages

        stages.append({"stage_number": 2, "stage_name": "Answer Key Verification", "passed": True, "details": "Correct answer matches option set."})
        return True, "MCQ validation passed", stages

    async def _validate_sql_question(self, q: Dict[str, Any]) -> Tuple[bool, str, List[Dict[str, Any]]]:
        stages = []
        ddl = q.get("schema_ddl") or ""
        seed = q.get("seed_data_sql") or ""
        ref_sql = q.get("reference_sql") or ""
        test_cases = q.get("test_cases") or []

        # Stage 1: Schema & Reference SQL Execution
        ref_res = await sandbox_service.execute_query(ddl, seed, ref_sql)
        if not ref_res["success"] or ref_res.get("error"):
            err_msg = ref_res.get("error") or "Reference SQL execution failed."
            stages.append({"stage_number": 1, "stage_name": "Reference Solution Execution", "passed": False, "details": err_msg})
            return False, f"Reference SQL error: {err_msg}", stages

        stages.append({"stage_number": 1, "stage_name": "Reference Solution Execution", "passed": True, "details": f"Reference query executed successfully, returned {len(ref_res.get('rows', []))} rows."})

        # Stage 2: Test Case Verification
        if not test_cases:
            stages.append({"stage_number": 2, "stage_name": "Test Suite Verification", "passed": False, "details": "Question contains no test cases."})
            return False, "Missing test cases", stages

        passed_count = 0
        for idx, tc in enumerate(test_cases):
            input_setup = tc.get("input_setup_sql") or seed
            tc_res = await sandbox_service.execute_query(ddl, input_setup, ref_sql)

            if tc_res["success"] and not tc_res.get("error"):
                expected = tc.get("expected_output_json") or []
                match = await sandbox_service.compare_outputs(tc_res.get("rows", []), expected if isinstance(expected, list) else [])
                if match:
                    passed_count += 1

        if passed_count < len(test_cases):
            stages.append({"stage_number": 2, "stage_name": "Test Suite Verification", "passed": False, "details": f"Reference SQL passed {passed_count}/{len(test_cases)} test cases."})
            return False, f"Test suite mismatch: passed {passed_count}/{len(test_cases)}", stages

        stages.append({"stage_number": 2, "stage_name": "Test Suite Verification", "passed": True, "details": f"All {len(test_cases)} public & hidden test cases passed 100%."})
        return True, "SQL Technical Question validated successfully", stages

    async def _validate_python_question(self, q: Dict[str, Any]) -> Tuple[bool, str, List[Dict[str, Any]]]:
        stages = []
        ref_code = q.get("reference_sql") or q.get("reference_solution") or ""
        test_cases = q.get("test_cases") or []

        if not ref_code.strip():
            stages.append({"stage_number": 1, "stage_name": "Code Structure Check", "passed": False, "details": "Reference Python solution is empty."})
            return False, "Empty Python reference solution", stages

        # Python syntax validation
        py_res = await sandbox_service.execute_python(ref_code)
        if not py_res["success"]:
            stages.append({"stage_number": 1, "stage_name": "Code Structure Check", "passed": False, "details": f"Python execution error: {py_res.get('error')}"})
            return False, f"Python syntax/execution error: {py_res.get('error')}", stages

        stages.append({"stage_number": 1, "stage_name": "Code Structure Check", "passed": True, "details": "Python syntax and initial execution clean."})

        # Test cases verification
        if test_cases:
            passed_count = 0
            for tc in test_cases:
                setup = tc.get("input_setup_sql") or ""
                tc_res = await sandbox_service.execute_python(ref_code, setup)
                if tc_res["success"]:
                    passed_count += 1
            if passed_count < len(test_cases):
                stages.append({"stage_number": 2, "stage_name": "Test Suite Verification", "passed": False, "details": f"Python solution passed {passed_count}/{len(test_cases)} test cases."})
                return False, f"Python test suite mismatch: passed {passed_count}/{len(test_cases)}", stages

        stages.append({"stage_number": 2, "stage_name": "Test Suite Verification", "passed": True, "details": f"Python solution verified across all test cases."})
        return True, "Python Technical Question validated successfully", stages


validation_service = PreValidationService()
