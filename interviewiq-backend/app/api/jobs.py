"""
api/jobs.py - Job Posting Endpoints (Recruiter)
==================================================
Recruiters create and manage job postings.
Public endpoints allow candidates to browse jobs.

Recruiter endpoints:
  POST   /api/recruiter/jobs                         — post a new job
  GET    /api/recruiter/jobs                         — list my jobs
  GET    /api/recruiter/jobs/{id}                    — get single job
  PATCH  /api/recruiter/jobs/{id}                   — update job
  DELETE /api/recruiter/jobs/{id}                   — deactivate job
  POST   /api/recruiter/jobs/{id}/questions          — add custom question
  GET    /api/recruiter/jobs/{id}/questions          — list custom questions
  DELETE /api/recruiter/jobs/{id}/questions/{qid}    — remove custom question

Public candidate endpoints:
  GET  /api/jobs                                     — browse active jobs
  GET  /api/jobs/{id}                               — job detail
  GET  /api/jobs/{id}/cv-preview                    — preview CV match % before applying
"""

import json
from typing import List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.custom_question import CustomQuestion
from app.models.application import Application
from app.models.interview import Interview
from app.schemas.job import (
    JobCreate, JobUpdate, JobOut, JobDetailOut,
    CustomQuestionCreate, CustomQuestionOut, CandidateJobOut
)
from app.utils.helpers import get_current_user, require_role, get_optional_user

# ── Recruiter router (auth required, recruiter/admin only) ──────────────────
recruiter_router = APIRouter(
    prefix="/api/recruiter/jobs",
    tags=["Jobs — Recruiter"],
    dependencies=[Depends(require_role([UserRole.recruiter, UserRole.admin]))]
)

# ── Public router (no auth needed to browse) ────────────────────────────────
public_router = APIRouter(prefix="/api/jobs", tags=["Jobs — Public"])


# ═══════════════════════════════════════════════════════════════════════════════
# RECRUITER ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@recruiter_router.post("", response_model=JobOut, status_code=201)
def create_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new job posting. Goes live immediately (is_active=True)."""
    job = Job(
        recruiter_id=current_user.id,
        title=job_data.title,
        description=job_data.description,
        required_skills=job_data.required_skills,
        required_experience=job_data.required_experience,
        required_education=job_data.required_education,
        cv_match_threshold=job_data.cv_match_threshold,
        total_questions=job_data.total_questions,
        ai_question_ratio=job_data.ai_question_ratio,
        time_limit_minutes=job_data.time_limit_minutes,
        passing_score=job_data.passing_score,
        deadline=job_data.deadline,
        is_active=True,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@recruiter_router.get("", response_model=List[JobOut])
def list_my_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List jobs. Admins see everything; recruiters see only their own."""
    query = db.query(Job)
    if current_user.role != UserRole.admin:
        query = query.filter(Job.recruiter_id == current_user.id)
    
    return query.order_by(Job.created_at.desc()).all()


@recruiter_router.get("/{job_id}", response_model=JobDetailOut)
def get_my_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific job (must be owned by logged-in recruiter or admin)."""
    job = _get_job_or_404(job_id, db)
    _check_ownership(job, current_user)
    app_count = db.query(Application).filter(Application.job_id == job_id).count()
    cqs = db.query(CustomQuestion).filter(CustomQuestion.job_id == job_id).all()
    return JobDetailOut(
        **JobOut.model_validate(job).model_dump(),
        recruiter_name=current_user.full_name,
        application_count=app_count,
        custom_questions=cqs,
    )


@recruiter_router.patch("/{job_id}", response_model=JobOut)
def update_job(
    job_id: int,
    job_data: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a job posting."""
    job = _get_job_or_404(job_id, db)
    _check_ownership(job, current_user)
    for field, value in job_data.model_dump(exclude_unset=True).items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    return job


@recruiter_router.delete("/{job_id}")
def deactivate_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deactivate a job (candidates can no longer apply)."""
    job = _get_job_or_404(job_id, db)
    _check_ownership(job, current_user)
    job.is_active = False
    db.commit()
    return {"message": f"Job '{job.title}' has been deactivated."}


# ── Custom Questions ─────────────────────────────────────────────────────────

@recruiter_router.post("/{job_id}/questions", response_model=CustomQuestionOut, status_code=201)
def add_custom_question(
    job_id: int,
    q_data: CustomQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a custom question to a job posting."""
    job = _get_job_or_404(job_id, db)
    _check_ownership(job, current_user)
    cq = CustomQuestion(
        job_id=job_id,
        question_text=q_data.question_text,
        difficulty=q_data.difficulty,
        expected_keywords=q_data.expected_keywords,
    )
    db.add(cq)
    db.commit()
    db.refresh(cq)
    return cq


@recruiter_router.get("/{job_id}/questions", response_model=List[CustomQuestionOut])
def list_custom_questions(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List custom questions for a job."""
    job = _get_job_or_404(job_id, db)
    _check_ownership(job, current_user)
    return db.query(CustomQuestion).filter(CustomQuestion.job_id == job_id).all()


@recruiter_router.delete("/{job_id}/questions/{question_id}")
def delete_custom_question(
    job_id: int,
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a custom question from a job."""
    job = _get_job_or_404(job_id, db)
    _check_ownership(job, current_user)
    cq = db.query(CustomQuestion).filter(
        CustomQuestion.id == question_id,
        CustomQuestion.job_id == job_id
    ).first()
    if not cq:
        raise HTTPException(status_code=404, detail="Custom question not found.")
    db.delete(cq)
    db.commit()
    return {"message": "Question removed."}


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIC ENDPOINTS (candidates browsing jobs)
# ═══════════════════════════════════════════════════════════════════════════════

@public_router.get("", response_model=List[CandidateJobOut])
def browse_jobs(
    search: Optional[str] = Query(None, description="Search title or description"),
    skill: Optional[str] = Query(None, description="Filter by required skill"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Browse all active job postings. Optionally filter by search term or skill."""
    query = db.query(Job).filter(Job.is_active == True)

    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            Job.title.ilike(term) | Job.description.ilike(term)
        )
    if skill:
        query = query.filter(Job.required_skills.ilike(f"%{skill}%"))

    # Exclude expired jobs
    now = datetime.now(timezone.utc)
    query = query.filter((Job.deadline == None) | (Job.deadline > now))

    jobs = query.order_by(Job.created_at.desc()).all()
    
    # If logged in, attach application status
    result = []
    for job in jobs:
        status = None
        score = None
        int_id = None
        int_status = None
        if current_user:
            app = db.query(Application).filter(
                Application.job_id == job.id,
                Application.candidate_id == current_user.id
            ).first()
            if app:
                status = app.status
                score = app.cv_match_score
                int_id = app.interview_id
                
                if int_id:
                    interview = db.query(Interview).filter(Interview.id == int_id).first()
                    if interview:
                        int_status = interview.status.value if hasattr(interview.status, 'value') else interview.status
        
        result.append(CandidateJobOut(
            **JobOut.model_validate(job).model_dump(),
            application_status=status,
            interview_status=int_status,
            match_score=score,
            interview_id=int_id
        ))

    return result


@public_router.get("/{job_id}", response_model=JobDetailOut)
def get_job_detail(job_id: int, db: Session = Depends(get_db)):
    """Get full detail of a single active job."""
    job = db.query(Job).filter(Job.id == job_id, Job.is_active == True).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    recruiter = db.query(User).filter(User.id == job.recruiter_id).first()
    cqs = db.query(CustomQuestion).filter(CustomQuestion.job_id == job_id).all()
    app_count = db.query(Application).filter(Application.job_id == job_id).count()
    return JobDetailOut(
        **JobOut.model_validate(job).model_dump(),
        recruiter_name=recruiter.full_name if recruiter else None,
        application_count=app_count,
        custom_questions=cqs,
    )


@public_router.get("/{job_id}/cv-preview")
def preview_cv_match(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Preview how well the logged-in candidate's CV matches this job.
    Returns the score BEFORE they formally apply.
    """
    from app.services.cv_matching_service import match_cv_to_job

    job = db.query(Job).filter(Job.id == job_id, Job.is_active == True).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if not current_user.cv_text:
        return {
            "score": None,
            "message": "Upload your CV first to see your match score.",
            "threshold": job.cv_match_threshold,
        }

    result = match_cv_to_job(
        cv_text=current_user.cv_text,
        job_description=job.description,
        required_skills=job.required_skills,
        required_experience=job.required_experience,
        required_education=job.required_education,
    )

    return {
        "score": result["total_score"],
        "threshold": job.cv_match_threshold,
        "will_pass": (
            result["total_score"] >= job.cv_match_threshold and
            result.get("experience_passed", True) and
            result.get("education_passed", True)
        ),
        "experience_passed": result.get("experience_passed", True),
        "education_passed": result.get("education_passed", True),
        "breakdown": result["breakdown"],
    }


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _get_job_or_404(job_id: int, db: Session) -> Job:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job


def _check_ownership(job: Job, user: User):
    if user.role != UserRole.admin and job.recruiter_id != user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this job.")
