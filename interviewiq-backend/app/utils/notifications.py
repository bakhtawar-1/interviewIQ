"""
utils/notifications.py
========================
Email notification helpers for InterviewIQ.

Currently uses console logging as fallback when SMTP is not configured.
To enable real emails, set these env vars in .env:
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your@gmail.com
  SMTP_PASS=yourapppassword
  FROM_EMAIL=noreply@interviewiq.com
"""

import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@interviewiq.com")


import urllib.request
import json

def _send_email(to: str, subject: str, body_html: str) -> bool:
    api_key = os.getenv("BREVO_API_KEY", "")
    if not api_key:
        logger.info("[EMAIL STUB] To: %s | Subject: %s", to, subject)
        return True
    try:
        payload = json.dumps({
            "sender": {"name": "InterviewIQ", "email": "admin.interviewiq@gmail.com"},
            "to": [{"email": to}],
            "subject": subject,
            "htmlContent": body_html
        }).encode()
        req = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=payload,
            headers={
                "api-key": api_key,
                "Content-Type": "application/json"
            }
        )
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception as e:
        logger.error("Email send failed to %s: %s", to, e)
        return False


# ── Notification functions ────────────────────────────────────────────────────

def notify_admin_new_recruiter(admin_email: str, recruiter_name: str, recruiter_email: str, company: str):
    """Notify admin that a new recruiter registered and is pending approval."""
    subject = f"[InterviewIQ] New Recruiter Registration: {recruiter_name}"
    body = f"""
    <h2>New Recruiter Pending Approval</h2>
    <p>A new recruiter has registered and is awaiting your approval.</p>
    <ul>
      <li><strong>Name:</strong> {recruiter_name}</li>
      <li><strong>Email:</strong> {recruiter_email}</li>
      <li><strong>Company:</strong> {company or 'N/A'}</li>
    </ul>
    <p>Log in to the admin panel to approve or reject this account.</p>
    """
    _send_email(admin_email, subject, body)


def notify_recruiter_approved(recruiter_email: str, recruiter_name: str, reason: str = ""):
    """Notify recruiter that their account has been approved."""
    subject = "[InterviewIQ] Your recruiter account has been approved!"
    body = f"""
    <h2>Welcome to InterviewIQ, {recruiter_name}!</h2>
    <p>Your recruiter account has been <strong>approved</strong> by the admin.</p>
    {f"<p><strong>Admin Note:</strong> {reason}</p>" if reason else ""}
    <p>You can now log in and start posting jobs, reviewing candidates, and accessing all recruiter features.</p>
    <p><a href='http://localhost:3000/signin'>Click here to sign in</a></p>
    """
    _send_email(recruiter_email, subject, body)


def notify_otp_verification(email: str, name: str, otp: str):
    """Send OTP code for email verification."""
    subject = f"[InterviewIQ] Verify your email — {otp}"
    body = f"""
    <h2>Email Verification</h2>
    <p>Hello {name},</p>
    <p>Thank you for signing up for InterviewIQ! Please use the following One-Time Password (OTP) to verify your email address:</p>
    <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 20px; background: #f4f4f4; border-radius: 8px; text-align: center; margin: 20px 0;">
      {otp}
    </div>
    <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
    """
    _send_email(email, subject, body)


def notify_forgot_password(email: str, name: str, otp: str):
    """Send OTP code for password reset."""
    subject = f"[InterviewIQ] Password Reset Request — {otp}"
    body = f"""
    <h2>Password Reset</h2>
    <p>Hello {name},</p>
    <p>We received a request to reset your InterviewIQ password. Please use the following One-Time Password (OTP) to proceed:</p>
    <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 20px; background: #f1f5f9; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px solid #e2e8f0;">
      {otp}
    </div>
    <p>If you did not request a password reset, you can safely ignore this email. Your password will not change until you use this code.</p>
    <p>This code is valid for 10 minutes.</p>
    """
    _send_email(email, subject, body)


def notify_recruiter_rejected(recruiter_email: str, recruiter_name: str, reason: str = ""):
    """Notify recruiter that their account registration was rejected."""
    subject = "[InterviewIQ] Your recruiter account registration"
    body = f"""
    <h2>Registration Update, {recruiter_name}</h2>
    <p>Unfortunately, your recruiter account registration has been <strong>rejected</strong>.</p>
    {f"<p><strong>Reason:</strong> {reason}</p>" if reason else ""}
    <p>If you believe this is an error, please contact support.</p>
    """
    _send_email(recruiter_email, subject, body)


def notify_candidate_cv_passed(candidate_email: str, candidate_name: str, job_title: str):
    """Notify candidate their CV passed and they can now take the interview."""
    subject = f"[InterviewIQ] Great news — you're eligible to interview for {job_title}"
    body = f"""
    <h2>Congratulations, {candidate_name}!</h2>
    <p>Your CV has been screened and you have passed the CV match threshold for:</p>
    <h3>{job_title}</h3>
    <p>You are now eligible to take the interview. Log in to your dashboard to start.</p>
    <p><a href="http://localhost:3000/dashboard">Go to my dashboard</a></p>
    """
    _send_email(candidate_email, subject, body)


def notify_candidate_cv_rejected(candidate_email: str, candidate_name: str, job_title: str, reason: str):
    """Notify candidate their CV did not meet the threshold."""
    subject = f"[InterviewIQ] Application update for {job_title}"
    body = f"""
    <h2>Application Update, {candidate_name}</h2>
    <p>We've reviewed your application for <strong>{job_title}</strong>.</p>
    <p>Unfortunately, your CV did not meet the minimum match threshold for this role.</p>
    <p><strong>Feedback:</strong> {reason}</p>
    <p>Don't be discouraged — keep updating your profile and applying to other positions!</p>
    """
    _send_email(candidate_email, subject, body)


def notify_recruiter_interview_completed(recruiter_email: str, candidate_name: str, job_title: str):
    """Notify recruiter that a candidate has completed their interview."""
    subject = f"[InterviewIQ] {candidate_name} completed the interview for {job_title}"
    body = f"""
    <h2>Interview Completed</h2>
    <p><strong>{candidate_name}</strong> has completed their interview for <strong>{job_title}</strong>.</p>
    <p>Log in to review their answers, AI score, and make your final decision.</p>
    <p><a href="http://localhost:3000/recruiter">Go to recruiter dashboard</a></p>
    """
    _send_email(recruiter_email, subject, body)


def notify_candidate_shortlisted(candidate_email: str, candidate_name: str, job_title: str):
    """Notify candidate they have been shortlisted."""
    subject = f"[InterviewIQ] 🎉 You have been shortlisted for {job_title}"
    body = f"""
    <h2>Excellent news, {candidate_name}!</h2>
    <p>You have been <strong>shortlisted</strong> for the position of <strong>{job_title}</strong>.</p>
    <p>The recruiter will be in touch with next steps. Keep an eye on your dashboard.</p>
    <p><a href="http://localhost:3000/dashboard">View my applications</a></p>
    """
    _send_email(candidate_email, subject, body)


def notify_candidate_rejected(candidate_email: str, candidate_name: str, job_title: str, feedback: str = ""):
    """Notify candidate they were not selected after interview."""
    subject = f"[InterviewIQ] Application result for {job_title}"
    body = f"""
    <h2>Application Update, {candidate_name}</h2>
    <p>Thank you for interviewing for <strong>{job_title}</strong>.</p>
    <p>After careful review, we regret to inform you that you have not been selected at this time.</p>
    {"<p><strong>Recruiter feedback:</strong> " + feedback + "</p>" if feedback else ""}
    <p>Your full interview report is available in your dashboard for your reference.</p>
    <p><a href="http://localhost:3000/dashboard">View my report</a></p>
    """
    _send_email(candidate_email, subject, body)
