"""
models/custom_question.py - Recruiter Custom Questions
========================================================
Recruiters can add their own questions to a job posting.
These are mixed with AI-generated questions during the actual interview.
"""

from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class QuestionDifficulty(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class CustomQuestion(Base):
    __tablename__ = "custom_questions"

    id = Column(Integer, primary_key=True, index=True)

    # Which job does this question belong to?
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)

    question_text = Column(Text, nullable=False)
    difficulty = Column(Enum(QuestionDifficulty), default=QuestionDifficulty.medium)

    # Keywords the ideal answer should contain (for AI scoring)
    # Stored as comma-separated: "leadership,conflict,teamwork"
    expected_keywords = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    job = relationship("Job", back_populates="custom_questions")

    def __repr__(self):
        return f"<CustomQuestion id={self.id} job_id={self.job_id}>"
