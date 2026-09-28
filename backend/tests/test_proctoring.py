import pytest
from app.services.proctoring_service import proctoring_service


def test_code_similarity_identical():
    code1 = """
    -- Solution for top employees
    SELECT employee_id, first_name, salary
    FROM employees
    WHERE salary > 50000
    ORDER BY salary DESC;
    """
    code2 = """
    # Same query different formatting
    select employee_id, first_name, salary
    from employees
    where salary > 50000
    order by salary desc;
    """
    sim = proctoring_service.calculate_similarity(code1, code2)
    assert sim == 100.0, f"Expected 100% similarity, got {sim}"


def test_code_similarity_partial():
    code1 = """
    SELECT department_id, AVG(salary) AS avg_sal
    FROM employees
    GROUP BY department_id
    HAVING AVG(salary) > 60000;
    """
    code2 = """
    SELECT department_id, AVG(salary) AS avg_sal
    FROM employees
    WHERE active = 1
    GROUP BY department_id
    HAVING AVG(salary) > 60000
    ORDER BY avg_sal DESC;
    """
    sim = proctoring_service.calculate_similarity(code1, code2)
    assert sim > 60.0, f"Expected >60% similarity, got {sim}"


def test_ip_whitelist_validation():
    # Localhost allowed
    assert proctoring_service.validate_client_ip("127.0.0.1", ["192.168.1.100"]) is True
    assert proctoring_service.validate_client_ip("localhost", ["10.0.0.1"]) is True

    # Exact IP matching
    assert proctoring_service.validate_client_ip("192.168.1.50", ["192.168.1.50", "10.0.0.1"]) is True
    assert proctoring_service.validate_client_ip("192.168.1.99", ["192.168.1.50", "10.0.0.1"]) is False

    # CIDR subnet matching
    assert proctoring_service.validate_client_ip("10.0.5.23", ["10.0.0.0/16"]) is True
    assert proctoring_service.validate_client_ip("192.168.2.1", ["192.168.1.0/24"]) is False

    # Empty whitelist means any IP permitted
    assert proctoring_service.validate_client_ip("203.0.113.195", []) is True
