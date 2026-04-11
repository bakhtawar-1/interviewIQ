"""
models/__init__.py
===================
Import all models here so SQLAlchemy can find them when creating tables.
If you don't import a model here, its table won't be created!
"""

from app.models.user import User, UserRole
from app.models.interview import Interview, InterviewStatus, InterviewType, DifficultyLevel
from app.models.question import Question, QuestionCategory
from app.models.response import InterviewResponse, InterviewSummary
