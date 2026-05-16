"""
models/job.py - Job Postings Table
====================================
Recruiters create job postings. Candidates then apply to these jobs.
Each job has configurable interview settings and CV match threshold.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)

    # Which recruiter posted this job?
    recruiter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Job details
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    required_skills = Column(Text, nullable=True)       # comma-separated list
    required_experience = Column(String(100), nullable=True)  # e.g. "2-3 years"
    required_education = Column(String(200), nullable=True)   # e.g. "Bachelor's in CS"

    # CV matching threshold (0-100). Applications below this are auto-rejected.
    cv_match_threshold = Column(Float, default=65.0, nullable=False)

    # Interview configuration
    total_questions = Column(Integer, default=10, nullable=False)
    ai_question_ratio = Column(Float, default=0.7, nullable=False)  # 70% AI, 30% custom
    time_limit_minutes = Column(Integer, default=30, nullable=False)
    passing_score = Column(Float, default=60.0, nullable=False)     # minimum score to pass

    # Deadline for applications
    deadline = Column(DateTime(timezone=True), nullable=True)

    # Is this job currently accepting applications?
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    recruiter = relationship("User", back_populates="posted_jobs", foreign_keys=[recruiter_id])
    applications = relationship("Application", back_populates="job")
    custom_questions = relationship("CustomQuestion", back_populates="job", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Job id={self.id} title={self.title} recruiter_id={self.recruiter_id}>"
