"""
models/__init__.py
===================
Import all models here so SQLAlchemy can find them when creating tables.
ORDER MATTERS — import base tables before tables that reference them!
"""

from app.models.user import User, UserRole, ApprovalStatus
from app.models.job import Job
from app.models.custom_question import CustomQuestion, QuestionDifficulty
from app.models.interview import Interview, InterviewStatus, InterviewType, DifficultyLevel
from app.models.question import Question, QuestionCategory
from app.models.response import InterviewResponse, InterviewSummary
from app.models.application import Application, ApplicationStatus
