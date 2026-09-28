from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Notification, User, Assessment
from typing import List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NotificationService")

class NotificationService:
    async def create_dashboard_notification(
        self, db: AsyncSession, user_id: str, title: str, message: str
    ) -> Notification:
        """Saves a notification to the database for user's dashboard view."""
        notif = Notification(user_id=user_id, title=title, message=message)
        db.add(notif)
        await db.commit()
        await db.refresh(notif)
        return notif

    def send_email_mock(self, recipient_email: str, subject: str, body: str):
        """Simulates sending a formal email by logging it clearly in stdout."""
        logger.info(
            f"\n=== [EMAIL SENT MOCK] ===\n"
            f"To: {recipient_email}\n"
            f"Subject: {subject}\n"
            f"Body:\n{body}\n"
            f"=========================\n"
        )

    async def notify_assessment_published(
        self, db: AsyncSession, assessment: Assessment, student_users: List[User]
    ):
        """Creates notifications when an administrator publishes a new assessment."""
        for student in student_users:
            title = f"New Assessment Published: {assessment.title}"
            message = (
                f"An assessment '{assessment.title}' has been published. "
                f"It is scheduled for {assessment.start_time.strftime('%Y-%m-%d %H:%M UTC')}. "
                f"Duration: {assessment.duration_minutes} minutes."
            )
            await self.create_dashboard_notification(db, student.id, title, message)
            
            # Send Email
            email_subject = f"SQL Assessment: {assessment.title} Published"
            email_body = (
                f"Hello {student.email},\n\n"
                f"A new assessment '{assessment.title}' is available.\n"
                f"Scheduled Time: {assessment.start_time.strftime('%Y-%m-%d %H:%M UTC')}\n"
                f"Duration: {assessment.duration_minutes} minutes.\n\n"
                f"Log in to the portal to view details and start when unlocked."
            )
            self.send_email_mock(student.email, email_subject, email_body)

    async def send_assessment_reminders(
        self, db: AsyncSession, assessment: Assessment, student_users: List[User], topic_names: List[str]
    ):
        """
        Sends assessment reminders exactly 1 day prior.
        Contains ONLY: date, time, and topics (NO QUESTIONS).
        """
        topics_str = ", ".join(topic_names) if topic_names else "General SQL"
        
        for student in student_users:
            title = f"Reminder: Upcoming SQL Assessment '{assessment.title}' tomorrow!"
            message = (
                f"Reminder: You have an assessment scheduled for {assessment.start_time.strftime('%Y-%m-%d %H:%M UTC')}. "
                f"Covered Topics: {topics_str}. Duration: {assessment.duration_minutes} minutes."
            )
            await self.create_dashboard_notification(db, student.id, title, message)

            # Send Email
            email_subject = f"Reminder: SQL Assessment: {assessment.title} - Tomorrow"
            email_body = (
                f"Dear Student,\n\n"
                f"This is a reminder for your upcoming SQL assessment '{assessment.title}' starting tomorrow.\n\n"
                f"Date & Time: {assessment.start_time.strftime('%Y-%m-%d %H:%M UTC')}\n"
                f"Duration: {assessment.duration_minutes} minutes\n"
                f"Topics Covered: {topics_str}\n\n"
                f"Please ensure you have a stable network and browser set up before the timer begins.\n"
                f"Note: Questions remain hidden until the official start time."
            )
            self.send_email_mock(student.email, email_subject, email_body)

    async def notify_assessment_completed(
        self, db: AsyncSession, assessment_title: str, student: User, score: float, total_marks: int
    ):
        """Creates notifications when a student finishes and score is registered."""
        title = f"Results Available: {assessment_title}"
        message = f"You scored {score}/{total_marks} on '{assessment_title}'. Click to view detailed AI feedback."
        await self.create_dashboard_notification(db, student.id, title, message)

        # Send Email
        email_subject = f"Results Released: {assessment_title}"
        email_body = (
            f"Hello {student.email},\n\n"
            f"Your assessment for '{assessment_title}' has been successfully graded.\n"
            f"Final Grade: {score} out of {total_marks} marks.\n\n"
            f"You can now view your detailed logic breakdown and AI constructive suggestions on the student dashboard."
        )
        self.send_email_mock(student.email, email_subject, email_body)

notification_service = NotificationService()
