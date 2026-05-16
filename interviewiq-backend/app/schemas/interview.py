"""
schemas/interview.py - Interview Schemas (Pydantic)
=====================================================
Defines what data goes in/out for interview-related API endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime
from app.models.interview import InterviewStatus, InterviewType, DifficultyLevel


# ─── Input Schemas ──────────────────────────────────────────────────────────

class InterviewCreate(BaseModel):
    """When a candidate starts a new interview."""
    interview_type: InterviewType = InterviewType.behavioral
    difficulty: DifficultyLevel = DifficultyLevel.medium
    job_title: Optional[str] = None
    application_id: Optional[int] = None
    is_mock: bool = False


class InterviewUpdate(BaseModel):
    """To update interview status (e.g., mark as completed)."""
    status: Optional[InterviewStatus] = None
    overall_score: Optional[float] = None


class VideoInterviewQuestionReport(BaseModel):
    """One main question + optional follow-up from the video flow."""
    question: str
    answer: str
    score: Optional[float] = None
    feedback: Optional[str] = None
    followup_question: Optional[str] = None
    followup_answer: Optional[str] = None
    followup_score: Optional[float] = None
    followup_feedback: Optional[str] = None


class VideoInterviewComplete(BaseModel):
    """Used by video interview flow to persist final state/score and full recruiter report."""
    overall_score: Optional[float] = None
    status: InterviewStatus = InterviewStatus.completed
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    recommendations: Optional[str] = None
    questions: Optional[List[VideoInterviewQuestionReport]] = None
    proctoring_violations: Optional[List[str]] = None
    # Client-derived camera/mic signals → communication & confidence (see behavioralScoring.js)
    behavior_metrics: Optional[Dict[str, Any]] = Field(default=None)


# ─── Output Schemas ──────────────────────────────────────────────────────────

class InterviewOut(BaseModel):
    """What we return when someone requests interview data."""
    id: int
    user_id: int
    application_id: Optional[int] = None
    is_mock: bool
    interview_type: InterviewType
    status: InterviewStatus
    difficulty: DifficultyLevel
    job_title: Optional[str]
    overall_score: Optional[float]
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─── Response (Answer) Schemas ──────────────────────────────────────────────

class ResponseCreate(BaseModel):
    """When a candidate submits an answer to a question."""
    question_id: int
    response_text: str


class ResponseOut(BaseModel):
    """What we return after an answer is submitted."""
    id: int
    interview_id: int
    question_id: int
    response_text: str
    score: Optional[float]
    feedback: Optional[str]
    responded_at: datetime

    class Config:
        from_attributes = True


# ─── Summary Schemas ─────────────────────────────────────────────────────────

class SummaryOut(BaseModel):
    """Final interview summary/report."""
    id: int
    interview_id: int
    communication_score: Optional[float]
    technical_score: Optional[float]
    confidence_score: Optional[float]
    strengths: Optional[str]
    weaknesses: Optional[str]
    recommendations: Optional[str]
    report_json: Optional[str] = None
    generated_at: datetime

    class Config:
        from_attributes = True


class RecruiterAnswerOut(BaseModel):
    """Single scored answer for recruiter screening (includes question text)."""
    id: int
    interview_id: int
    question_id: int
    question_text: Optional[str] = None
    response_text: str
    score: Optional[float]
    feedback: Optional[str]
    responded_at: datetime

    class Config:
        from_attributes = True
