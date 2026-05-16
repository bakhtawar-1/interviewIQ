"""
schemas/job.py - Job & CustomQuestion Schemas (Pydantic)
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.custom_question import QuestionDifficulty


# ─── Custom Question Schemas ─────────────────────────────────────────────────

class CustomQuestionCreate(BaseModel):
    question_text: str
    difficulty: QuestionDifficulty = QuestionDifficulty.medium
    expected_keywords: Optional[str] = None


class CustomQuestionOut(BaseModel):
    id: int
    job_id: int
    question_text: str
    difficulty: QuestionDifficulty
    expected_keywords: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Job Schemas ─────────────────────────────────────────────────────────────

class JobCreate(BaseModel):
    title: str
    description: str
    required_skills: Optional[str] = None
    required_experience: Optional[str] = None
    required_education: Optional[str] = None
    cv_match_threshold: float = Field(default=65.0, ge=0.0, le=100.0)
    total_questions: int = Field(default=10, ge=1, le=30)
    ai_question_ratio: float = Field(default=0.7, ge=0.0, le=1.0)
    time_limit_minutes: int = Field(default=30, ge=5, le=180)
    passing_score: float = Field(default=60.0, ge=0.0, le=100.0)
    deadline: Optional[datetime] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[str] = None
    required_experience: Optional[str] = None
    required_education: Optional[str] = None
    cv_match_threshold: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    total_questions: Optional[int] = Field(default=None, ge=1, le=30)
    ai_question_ratio: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    time_limit_minutes: Optional[int] = Field(default=None, ge=5, le=180)
    passing_score: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    deadline: Optional[datetime] = None
    is_active: Optional[bool] = None


class JobOut(BaseModel):
    id: int
    recruiter_id: int
    title: str
    description: str
    required_skills: Optional[str]
    required_experience: Optional[str]
    required_education: Optional[str]
    cv_match_threshold: float
    total_questions: int
    ai_question_ratio: float
    time_limit_minutes: int
    passing_score: float
    deadline: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class JobDetailOut(JobOut):
    """Job with recruiter name and application count, for public listing."""
    recruiter_name: Optional[str] = None
    application_count: int = 0
    custom_questions: List[CustomQuestionOut] = Field(default_factory=list)


class CandidateJobOut(JobOut):
    """Job listing for candidates with their application status."""
    application_status: Optional[str] = None
    interview_status: Optional[str] = None
    match_score: Optional[float] = None
    interview_id: Optional[int] = None
