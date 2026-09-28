import hashlib
import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.models import Invitation, AssessmentAssignment, User, Assessment

logger = logging.getLogger(__name__)


class EmailService:
    """
    Handles invitation token generation, hashing, token verification, and email sending.
    """

    @staticmethod
    def generate_token_pair() -> tuple[str, str]:
        """Generates raw token and its SHA-256 hash."""
        raw_token = f"tok_{uuid.uuid4().hex}{uuid.uuid4().hex}"
        token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
        return raw_token, token_hash

    @staticmethod
    def hash_token(raw_token: str) -> str:
        """Computes SHA-256 hash of a raw token."""
        return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

    async def create_invitation(
        self,
        db: AsyncSession,
        assignment_id: str,
        student_id: str,
        assessment_id: str,
        expiry_hours: int = 72
    ) -> Dict[str, Any]:
        raw_token, token_hash = self.generate_token_pair()
        expires_at = datetime.utcnow() + timedelta(hours=expiry_hours)

        invitation = Invitation(
            assignment_id=assignment_id,
            student_id=student_id,
            assessment_id=assessment_id,
            token_hash=token_hash,
            status="PENDING",
            expires_at=expires_at
        )
        db.add(invitation)
        await db.commit()
        await db.refresh(invitation)

        # Generate student invitation link
        invitation_link = f"{settings.FRONTEND_URL}/student/assessment?token={raw_token}"
        
        return {
            "invitation_id": invitation.id,
            "raw_token": raw_token,
            "token_hash": token_hash,
            "invitation_link": invitation_link,
            "expires_at": expires_at
        }

    DEFAULT_EMAIL_TEMPLATES = {
        "invitation": {
            "subject": "Invitation to take {{assessment_name}}",
            "body": (
                "Hello {{candidate_name}},\n\n"
                "You have been invited to attempt the assessment: {{assessment_name}}.\n\n"
                "Assessment Details:\n"
                "- Duration: {{duration}} minutes\n"
                "- Start Window: {{start_date}}\n"
                "- End Window: {{end_date}}\n"
                "- Timezone: {{timezone}}\n\n"
                "Click the secure link below to start your test:\n"
                "{{assessment_link}}\n\n"
                "Please note that this is a private link intended only for you. Do not share it with anyone.\n\n"
                "Best regards,\n"
                "Agilisium Assessment Team"
            ),
            "sender_name": "Agilisium Assessment Team",
            "sender_email": "evaluations@agilisium.com"
        },
        "reminder": {
            "subject": "Reminder: Upcoming test {{assessment_name}}",
            "body": (
                "Hello {{candidate_name}},\n\n"
                "This is a gentle reminder that your assessment {{assessment_name}} is awaiting your completion.\n\n"
                "- Assessment Ends: {{end_date}}\n"
                "- Duration: {{duration}} minutes\n\n"
                "Click here to begin your assessment before the deadline:\n"
                "{{assessment_link}}\n\n"
                "Best regards,\n"
                "Agilisium Assessment Team"
            ),
            "sender_name": "Agilisium Assessment Team",
            "sender_email": "evaluations@agilisium.com"
        },
        "started": {
            "subject": "Assessment Started: {{assessment_name}}",
            "body": (
                "Hello {{candidate_name}},\n\n"
                "You have started {{assessment_name}} at {{start_date}}.\n"
                "Your test timer of {{duration}} minutes is now active.\n\n"
                "If you experience any connectivity disruptions, you may use your unique link to resume:\n"
                "{{assessment_link}}\n\n"
                "Good luck!\n"
                "Agilisium Assessment Team"
            ),
            "sender_name": "Agilisium Assessment Team",
            "sender_email": "evaluations@agilisium.com"
        },
        "submitted": {
            "subject": "Assessment Submitted: {{assessment_name}}",
            "body": (
                "Hello {{candidate_name}},\n\n"
                "Your assessment {{assessment_name}} has been successfully submitted for review.\n\n"
                "Our evaluation team and automated scoring engine will process your results. You will be contacted regarding next steps.\n\n"
                "Thank you for your time.\n\n"
                "Best regards,\n"
                "Agilisium Assessment Team"
            ),
            "sender_name": "Agilisium Assessment Team",
            "sender_email": "evaluations@agilisium.com"
        },
        "completed": {
            "subject": "Results Available: {{assessment_name}}",
            "body": (
                "Hello {{candidate_name}},\n\n"
                "Evaluation for {{assessment_name}} is complete.\n\n"
                "Thank you for participating in our evaluation process.\n\n"
                "Best regards,\n"
                "Agilisium Assessment Team"
            ),
            "sender_name": "Agilisium Assessment Team",
            "sender_email": "evaluations@agilisium.com"
        },
        "expired": {
            "subject": "Assessment Expired: {{assessment_name}}",
            "body": (
                "Hello {{candidate_name}},\n\n"
                "The scheduled window for {{assessment_name}} expired on {{end_date}}.\n\n"
                "If you require an extension, please contact the administrator.\n\n"
                "Best regards,\n"
                "Agilisium Assessment Team"
            ),
            "sender_name": "Agilisium Assessment Team",
            "sender_email": "evaluations@agilisium.com"
        }
    }

    @classmethod
    def get_default_templates(cls) -> Dict[str, Dict[str, str]]:
        """Returns deep copy of default template dictionary."""
        import copy
        return copy.deepcopy(cls.DEFAULT_EMAIL_TEMPLATES)

    @staticmethod
    def render_template(template_str: str, context: Dict[str, Any]) -> str:
        """Interpolates placeholders e.g. {{candidate_name}} with contextual variables."""
        if not template_str:
            return ""
        rendered = template_str
        for key, val in context.items():
            placeholder = f"{{{{{key}}}}}"
            rendered = rendered.replace(placeholder, str(val))
        return rendered

    async def send_invitation_email(
        self,
        candidate_name: str,
        candidate_email: str,
        assessment_title: str,
        duration_minutes: int,
        start_date: datetime,
        end_date: datetime,
        timezone: str,
        invitation_link: str,
        custom_template: Optional[Dict[str, str]] = None
    ) -> bool:
        """Sends or logs invitation email to candidate using custom or default template."""
        tmpl = custom_template or self.DEFAULT_EMAIL_TEMPLATES["invitation"]
        context = {
            "candidate_name": candidate_name,
            "assessment_name": assessment_title,
            "duration": duration_minutes,
            "start_date": start_date.strftime('%Y-%m-%d %H:%M %Z') if start_date else "Now",
            "end_date": end_date.strftime('%Y-%m-%d %H:%M %Z') if end_date else "No Expiry",
            "timezone": timezone or "UTC",
            "assessment_link": invitation_link
        }

        subject = self.render_template(tmpl.get("subject", ""), context)
        body = self.render_template(tmpl.get("body", ""), context)
        sender_name = tmpl.get("sender_name", "Agilisium Assessment Team")

        logger.info(
            f"--- EMAIL [{subject}] FROM '{sender_name}' TO {candidate_email} ---\n{body}"
        )
        return True

    async def send_test_email(
        self,
        recipient_email: str,
        template_type: str,
        assessment_title: str,
        custom_template: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Renders and dispatches a test email to verify template configurations."""
        tmpl = custom_template or self.DEFAULT_EMAIL_TEMPLATES.get(template_type, self.DEFAULT_EMAIL_TEMPLATES["invitation"])
        now = datetime.utcnow()
        context = {
            "candidate_name": "Jane Doe (Test Candidate)",
            "assessment_name": assessment_title or "SQL Technical Assessment",
            "duration": 60,
            "start_date": now.strftime('%Y-%m-%d %H:%M UTC'),
            "end_date": (now + timedelta(days=3)).strftime('%Y-%m-%d %H:%M UTC'),
            "timezone": "UTC",
            "assessment_link": f"{settings.FRONTEND_URL}/student/assessment?token=tok_test_sample_token_12345"
        }

        subject = self.render_template(tmpl.get("subject", ""), context)
        body = self.render_template(tmpl.get("body", ""), context)
        sender_name = tmpl.get("sender_name", "Agilisium Assessment Team")
        sender_email = tmpl.get("sender_email", "evaluations@agilisium.com")

        logger.info(
            f"--- TEST EMAIL [{template_type.upper()}] TO {recipient_email} ---\n"
            f"Subject: {subject}\nSender: {sender_name} <{sender_email}>\n\n{body}"
        )

        return {
            "success": True,
            "recipient_email": recipient_email,
            "template_type": template_type,
            "rendered_subject": subject,
            "rendered_body": body,
            "sender_name": sender_name,
            "sender_email": sender_email
        }

    async def validate_token(
        self,
        db: AsyncSession,
        raw_token: str
    ) -> Optional[Invitation]:
        """Validates raw token against stored SHA-256 token hash in DB."""
        token_hash = self.hash_token(raw_token)
        stmt = (
            select(Invitation)
            .where(Invitation.token_hash == token_hash)
        )
        res = await db.execute(stmt)
        invitation = res.scalar_one_or_none()

        if not invitation:
            return None

        # Check expiration
        if invitation.expires_at < datetime.utcnow():
            invitation.status = "EXPIRED"
            await db.commit()
            return None

        return invitation


email_service = EmailService()

