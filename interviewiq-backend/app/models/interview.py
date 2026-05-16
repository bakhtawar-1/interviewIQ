"""
models/interview.py - Interviews Table
========================================
Tracks each interview session.

STATUS FLOW:
  pending → in_progress → completed
                       ↘ abandoned

is_mock = True  → practice/mock interview (not linked to a real job)
is_mock = False → real interview tied to a job application
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class InterviewStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    abandoned = "abandoned"
    disqualified = "disqualified"


class InterviewType(str, enum.Enum):
    technical = "technical"
    behavioral = "behavioral"
    hr = "hr"
    mixed = "mixed"


class DifficultyLevel(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)

    # Which candidate is taking this interview?
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Linked job application (null if this is a mock/practice interview)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="SET NULL"), nullable=True)

    # Is this a mock/practice interview? (True = no job, just practice)
    is_mock = Column(Boolean, default=False, nullable=False)

    interview_type = Column(Enum(InterviewType), default=InterviewType.behavioral, nullable=False)
    status = Column(Enum(InterviewStatus), default=InterviewStatus.pending, nullable=False)
    difficulty = Column(Enum(DifficultyLevel), default=DifficultyLevel.medium)

    # Job title context (for AI question generation)
    job_title = Column(String(200), nullable=True)

    # Overall score 0-100 (filled when interview is completed)
    overall_score = Column(Float, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="interviews", foreign_keys=[user_id])
    responses = relationship("InterviewResponse", back_populates="interview")
    summary = relationship("InterviewSummary", back_populates="interview", uselist=False)
    application = relationship(
        "Application", back_populates="interview",
        foreign_keys=[application_id]
    )

    def __repr__(self):
        return f"<Interview id={self.id} user_id={self.user_id} status={self.status} is_mock={self.is_mock}>"
