"""
models/application.py - Job Applications Table
================================================
Tracks a candidate's application to a specific job.

STATUS FLOW:
  applied
    → cv_failed        (CV score below threshold — auto rejected)
    → cv_passed        (CV score above threshold)
        → interview_pending   (eligible but not started yet)
        → interview_completed (finished interview, awaiting recruiter)
            → pending_review  (recruiter notified, reviewing)
            → shortlisted     (recruiter approves — candidate notified)
            → rejected        (recruiter rejects — candidate notified with feedback)
"""

import enum
from typing import Optional
from sqlalchemy import (
    Column, Integer, Float, Boolean, DateTime, ForeignKey,
    Enum, Text, String
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class ApplicationStatus(str, enum.Enum):
    applied = "applied"
    cv_failed = "cv_failed"
    cv_passed = "cv_passed"
    interview_pending = "interview_pending"
    interview_completed = "interview_completed"
    pending_review = "pending_review"
    shortlisted = "shortlisted"
    rejected = "rejected"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)

    # Who applied?
    candidate_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # For which job?
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)

    # CV match score (0-100) calculated by the matching service
    cv_match_score = Column(Float, nullable=True)

    # Breakdown of CV match (JSON string: skills/exp/education scores)
    cv_match_breakdown = Column(Text, nullable=True)

    # Current status in the hiring pipeline
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.applied, nullable=False)

    # Reason shown to candidate on rejection (cv_failed or final rejection)
    rejection_reason = Column(Text, nullable=True)

    # Private notes added by the recruiter (NOT visible to candidate)
    recruiter_notes = Column(Text, nullable=True)

    # AI recommended result: True = Pass, False = Fail, None = not yet evaluated
    ai_recommended = Column(Boolean, nullable=True)

    # Recruiter's override of the AI score (if they choose to adjust)
    recruiter_override_score = Column(Float, nullable=True)

    # Who made the final decision and when?
    final_decision_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)


    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    candidate = relationship("User", back_populates="applications", foreign_keys=[candidate_id])
    job = relationship("Job", back_populates="applications")
    interview = relationship("Interview", back_populates="application", uselist=False)
    decider = relationship("User", foreign_keys=[final_decision_by])

    @property
    def interview_id(self) -> Optional[int]:
        """Expose linked interview ID for schemas/frontend."""
        return self.interview.id if self.interview else None

    def __repr__(self):
        return f"<Application id={self.id} candidate_id={self.candidate_id} job_id={self.job_id} status={self.status}>"
