import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("email_service")

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "attendance@yourdomain.com")
OWNER_NOTIFY_EMAIL = os.getenv("OWNER_NOTIFY_EMAIL", "")

try:
    import resend
    if RESEND_API_KEY:
        resend.api_key = RESEND_API_KEY
except ImportError:
    resend = None


def send_attendance_notification(name: str, roll_number: str, session: str, timing: str, date: str) -> None:
    """
    Fire-and-forget email to the owner whenever a member marks attendance.
    Failures are logged, never raised — a broken email setup should never
    block a member from successfully marking attendance.
    """
    if not RESEND_API_KEY or not OWNER_NOTIFY_EMAIL:
        logger.warning("Resend not configured — skipping email notification.")
        return

    subject = f"Gym Attendance: {name} ({session}) marked present"
    html = f"""
        <h2>New Attendance Marked</h2>
        <p><b>Name:</b> {name}</p>
        <p><b>Roll Number:</b> {roll_number}</p>
        <p><b>Session:</b> {session}</p>
        <p><b>Time:</b> {timing}</p>
        <p><b>Date:</b> {date}</p>
    """
    try:
        resend.Emails.send({
            "from": RESEND_FROM_EMAIL,
            "to": [OWNER_NOTIFY_EMAIL],
            "subject": subject,
            "html": html,
        })
    except Exception as e:
        logger.error(f"Failed to send attendance email: {e}")
