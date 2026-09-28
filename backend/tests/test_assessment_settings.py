import pytest
from app.services.email_service import email_service
from app.services.report_service import report_service


def test_email_template_rendering():
    template = "Hello {{candidate_name}}, your test {{assessment_name}} is on {{start_date}} with duration {{duration}} min. Link: {{assessment_link}}"
    context = {
        "candidate_name": "Alice Smith",
        "assessment_name": "Senior Data Engineer Exam",
        "start_date": "2026-06-01 10:00 UTC",
        "duration": "90",
        "assessment_link": "http://localhost:3000/student/assessment?token=tok_test_123"
    }

    rendered = email_service.render_template(template, context)
    assert "Alice Smith" in rendered
    assert "Senior Data Engineer Exam" in rendered
    assert "2026-06-01 10:00 UTC" in rendered
    assert "90 min" in rendered
    assert "http://localhost:3000/student/assessment?token=tok_test_123" in rendered
    assert "{{" not in rendered


@pytest.mark.asyncio
async def test_send_test_email():
    result = await email_service.send_test_email(
        recipient_email="evaluator@test.com",
        template_type="invitation",
        assessment_title="PostgreSQL Optimization Test",
        custom_template={
            "subject": "Custom Invitation: {{assessment_name}}",
            "body": "Welcome {{candidate_name}}, start your test here: {{assessment_link}}",
            "sender_name": "Evaluation Team",
            "sender_email": "eval@test.com"
        }
    )

    assert result["success"] is True
    assert result["template_type"] == "invitation"
    assert "Custom Invitation: PostgreSQL Optimization Test" in result["rendered_subject"]
    assert "evaluator@test.com" in result["recipient_email"]


def test_default_templates_structure():
    defaults = email_service.get_default_templates()
    expected_keys = ["invitation", "reminder", "started", "submitted", "completed", "expired"]
    for k in expected_keys:
        assert k in defaults
        assert "subject" in defaults[k]
        assert "body" in defaults[k]
        assert "sender_name" in defaults[k]
        assert "sender_email" in defaults[k]
