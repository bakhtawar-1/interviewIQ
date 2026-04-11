"""
models/interview.py - Interviews Table
========================================
Tracks each interview session a candidate takes.

STATUS FLOW:
  pending → in_progress → completed
                       ↘ abandoned (if they quit early)
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class InterviewStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    abandoned = "abandoned"


class InterviewType(str, enum.Enum):
    technical = "technical"        # Coding/CS questions
    behavioral = "behavioral"      # Soft skills (STAR method)
    hr = "hr"                      # General HR questions
    mixed = "mixed"                # Combination


class DifficultyLevel(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign key — links to users.id
    # If user is deleted, their interviews are also deleted (CASCADE)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # What kind of interview?
    interview_type = Column(Enum(InterviewType), default=InterviewType.behavioral, nullable=False)

    # Status of the interview session
    status = Column(Enum(InterviewStatus), default=InterviewStatus.pending, nullable=False)

    # Difficulty level
    difficulty = Column(Enum(DifficultyLevel), default=DifficultyLevel.medium)

    # What job are they interviewing for?
    job_title = Column(String(200), nullable=True)

    # Overall score 0-100 (filled in when interview is completed)
    overall_score = Column(Float, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="interviews")
    responses = relationship("InterviewResponse", back_populates="interview")
    summary = relationship("InterviewSummary", back_populates="interview", uselist=False)

    def __repr__(self):
        return f"<Interview id={self.id} user_id={self.user_id} status={self.status}>"
