"""
schemas/application.py - Application Schemas (Pydantic)
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.application import ApplicationStatus


class ApplicationOut(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    cv_match_score: Optional[float]
    cv_match_breakdown: Optional[str]
    status: ApplicationStatus
    rejection_reason: Optional[str]
    ai_recommended: Optional[bool]
    recruiter_override_score: Optional[float]
    interview_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ApplicationDetailOut(ApplicationOut):
    """Full application with job title and candidate name."""
    job_title: Optional[str] = None
    interview_status: Optional[str] = None
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    interview_overall_score: Optional[float] = None
    technical_score: Optional[float] = None
    communication_score: Optional[float] = None
    confidence_score: Optional[float] = None


class RecruiterReviewInput(BaseModel):
    """Recruiter submits a review decision on an application."""
    recruiter_override_score: Optional[float] = None   # 0-100, overrides AI score
    recruiter_notes: Optional[str] = None
    decision: str   # "shortlist" or "reject"
    rejection_reason: Optional[str] = None  # shown to candidate if rejected


class CandidateApplicationOut(ApplicationOut):
    """What candidates see about their own application."""
    job_title: Optional[str] = None
    interview_status: Optional[str] = None
    company_name: Optional[str] = None
    recruiter_name: Optional[str] = None
