"""
models/question.py - Question Bank Table
==========================================
Stores all interview questions. Think of this as your question library.
Admin can add questions here, and the system picks from them during interviews.

keywords: comma-separated words for AI matching later
e.g., "leadership,conflict,teamwork"
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class QuestionCategory(str, enum.Enum):
    behavioral = "behavioral"
    technical = "technical"
    situational = "situational"
    hr = "hr"
    leadership = "leadership"


class DifficultyLevel(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)

    # What category is this question?
    category = Column(Enum(QuestionCategory), nullable=False)

    # How hard is this question?
    difficulty = Column(Enum(DifficultyLevel), default=DifficultyLevel.medium)

    # The actual question text
    # e.g., "Tell me about a time you handled conflict in a team."
    question_text = Column(Text, nullable=False)

    # A sample ideal answer — used by AI to score responses later
    ideal_answer = Column(Text, nullable=True)

    # Keywords the ideal answer should contain (for AI scoring in Phase 2)
    # Stored as comma-separated string: "communication,conflict,resolution"
    keywords = Column(String(500), nullable=True)

    # When was this question added?
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship — one question can appear in many responses
    responses = relationship("InterviewResponse", back_populates="question")

    def __repr__(self):
        return f"<Question id={self.id} category={self.category}>"
