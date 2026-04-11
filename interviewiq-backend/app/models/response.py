"""
models/response.py - Interview Responses + Summary Tables
===========================================================
Two tables here:

1. InterviewResponse — stores EACH answer a candidate gives
2. InterviewSummary  — stores the FINAL report after the interview ends
"""

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class InterviewResponse(Base):
    """
    Stores each individual answer during an interview.
    One interview → many responses (one per question answered).
    """
    __tablename__ = "interview_responses"

    id = Column(Integer, primary_key=True, index=True)

    # Which interview does this answer belong to?
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)

    # Which question was asked?
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)

    # What the candidate actually said/typed
    response_text = Column(Text, nullable=False)

    # Score for THIS response (0-100) — filled by AI in Phase 2, manual now
    score = Column(Float, nullable=True)

    # AI or manual feedback for this specific answer
    feedback = Column(Text, nullable=True)

    # When did they answer?
    responded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    interview = relationship("Interview", back_populates="responses")
    question = relationship("Question", back_populates="responses")

    def __repr__(self):
        return f"<InterviewResponse id={self.id} interview_id={self.interview_id} score={self.score}>"


class InterviewSummary(Base):
    """
    The final report generated after an interview is completed.
    One interview → one summary (uselist=False in Interview model).
    """
    __tablename__ = "interview_summaries"

    id = Column(Integer, primary_key=True, index=True)

    # One-to-one with interview
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Overall scores breakdown
    communication_score = Column(Float, nullable=True)   # How well they expressed themselves
    technical_score = Column(Float, nullable=True)        # Technical accuracy
    confidence_score = Column(Float, nullable=True)       # Confidence in answers

    # AI-generated text feedback (Phase 2 will fill these automatically)
    strengths = Column(Text, nullable=True)         # e.g., "Strong communication skills..."
    weaknesses = Column(Text, nullable=True)        # e.g., "Needs to improve..."
    recommendations = Column(Text, nullable=True)   # e.g., "Practice STAR method..."

    # JSON string: full video session (questions, answers, scores, proctoring) for recruiter export
    report_json = Column(Text, nullable=True)

    # When was this summary generated?
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    interview = relationship("Interview", back_populates="summary")

    def __repr__(self):
        return f"<InterviewSummary id={self.id} interview_id={self.interview_id}>"
