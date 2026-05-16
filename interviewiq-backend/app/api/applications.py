"""
api/applications.py - Candidate Application Endpoints
=======================================================
Candidates apply to jobs, get screened by CV match, and track their status.

POST /api/candidate/apply/{job_id}       — apply (triggers CV match)
GET  /api/candidate/applications         — list own applications
GET  /api/candidate/applications/{id}    — single application detail
"""

import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.application import Application, ApplicationStatus
from app.models.interview import Interview
from app.schemas.application import CandidateApplicationOut, ApplicationDetailOut, ApplicationOut
from app.utils.helpers import get_current_user, require_role

router = APIRouter(
    prefix="/api/candidate",
    tags=["Applications — Candidate"],
    dependencies=[Depends(require_role([UserRole.candidate, UserRole.admin]))]
)


@router.post("/apply/{job_id}", response_model=CandidateApplicationOut, status_code=201)
def apply_to_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Apply to a job posting.

    Steps:
    1. Check job exists and is active
    2. Check candidate has not already applied
    3. Run CV matching against the job
    4. If score >= threshold → status = cv_passed / interview_pending
    5. If score < threshold → status = cv_failed (auto-rejected)
    6. Notify candidate of result via email
    """
    from app.services.cv_matching_service import match_cv_to_job
    from app.utils.notifications import notify_candidate_cv_passed, notify_candidate_cv_rejected

    # 1. Job must exist and be active
    job = db.query(Job).filter(Job.id == job_id, Job.is_active == True).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or no longer accepting applications.")

    # 2. No duplicate applications
    existing = db.query(Application).filter(
        Application.candidate_id == current_user.id,
        Application.job_id == job_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You have already applied to this job."
        )

    # 3. Run CV matching
    cv_text = current_user.cv_text or ""
    if cv_text:
        match_result = match_cv_to_job(
            cv_text=cv_text,
            job_description=job.description,
            required_skills=job.required_skills,
            required_experience=job.required_experience,
            required_education=job.required_education,
        )
        score = match_result["total_score"]
        breakdown_str = json.dumps(match_result["breakdown"])
    else:
        score = 0.0
        breakdown_str = json.dumps({"reason": "No CV uploaded. Please upload your CV before applying."})
        match_result = {"experience_passed": False, "education_passed": False}

    # 4. Determine pass/fail
    passed = (
        score >= job.cv_match_threshold and 
        match_result.get("experience_passed", True) and 
        match_result.get("education_passed", True)
    )

    if passed:
        app_status = ApplicationStatus.interview_pending
        rejection_reason = None
    else:
        app_status = ApplicationStatus.cv_failed
        skills_missing = []
        if cv_text:
            try:
                bd = json.loads(breakdown_str)
                skills_missing = bd.get("missing_skills", [])
            except Exception:
                pass
        parts = [f"Your CV matched {score:.1f}% against the {job.cv_match_threshold:.0f}% threshold required."]
        if not match_result.get("experience_passed", True):
            parts.append("Your experience level does not meet the minimum requirements for this role.")
        if not match_result.get("education_passed", True):
            parts.append("Your educational background does not meet the minimum requirements for this role.")
        if skills_missing:
            parts.append(f"Skills not detected in your CV: {', '.join(skills_missing[:5])}.")
        if not cv_text:
            parts.append("You have not uploaded a CV yet.")
        rejection_reason = " ".join(parts)

    # 5. Save application
    application = Application(
        candidate_id=current_user.id,
        job_id=job_id,
        cv_match_score=score,
        cv_match_breakdown=breakdown_str,
        status=app_status,
        rejection_reason=rejection_reason,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    # 6. Notify candidate
    try:
        if passed:
            notify_candidate_cv_passed(
                candidate_email=current_user.email,
                candidate_name=current_user.full_name,
                job_title=job.title,
            )
        else:
            notify_candidate_cv_rejected(
                candidate_email=current_user.email,
                candidate_name=current_user.full_name,
                job_title=job.title,
                reason=rejection_reason or "",
            )
    except Exception:
        pass  # Never fail the request because of notification error

    # Build output with enriched fields
    recruiter = db.query(User).filter(User.id == job.recruiter_id).first()
    
    # Return as a plain dict to ensure FastAPI's JSONResponse handles it without ORM issues
    return {
        "id": application.id,
        "candidate_id": application.candidate_id,
        "job_id": application.job_id,
        "cv_match_score": application.cv_match_score,
        "cv_match_breakdown": application.cv_match_breakdown,
        "status": application.status.value if hasattr(application.status, 'value') else application.status,
        "rejection_reason": application.rejection_reason,
        "ai_recommended": application.ai_recommended,
        "recruiter_override_score": application.recruiter_override_score,
        "interview_id": application.interview_id,
        "created_at": application.created_at.isoformat() if application.created_at else None,
        "updated_at": application.updated_at.isoformat() if application.updated_at else None,
        "job_title": job.title,
        "company_name": recruiter.company_name if recruiter else None,
        "recruiter_name": recruiter.full_name if recruiter else None,
    }


@router.get("/applications", response_model=List[CandidateApplicationOut])
def list_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all applications the logged-in candidate has made."""
    apps = (
        db.query(Application)
        .filter(Application.candidate_id == current_user.id)
        .order_by(Application.created_at.desc())
        .all()
    )
    result = []
    for app in apps:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        recruiter = db.query(User).filter(User.id == job.recruiter_id).first() if job else None
        
        int_status = None
        if app.interview_id:
            interview = db.query(Interview).filter(Interview.id == app.interview_id).first()
            if interview:
                int_status = interview.status.value if hasattr(interview.status, 'value') else interview.status

        result.append(CandidateApplicationOut(
            **ApplicationOut.model_validate(app).model_dump(),
            job_title=job.title if job else None,
            interview_status=int_status,
            company_name=recruiter.company_name if recruiter else None,
            recruiter_name=recruiter.full_name if recruiter else None,
        ))
    return result


@router.get("/applications/{application_id}", response_model=CandidateApplicationOut)
def get_my_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detail of a specific application (must belong to logged-in candidate)."""
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.candidate_id == current_user.id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    job = db.query(Job).filter(Job.id == app.job_id).first()
    recruiter = db.query(User).filter(User.id == job.recruiter_id).first() if job else None

    int_status = None
    if app.interview_id:
        interview = db.query(Interview).filter(Interview.id == app.interview_id).first()
        if interview:
            int_status = interview.status.value if hasattr(interview.status, 'value') else interview.status

    return CandidateApplicationOut(
        **ApplicationOut.model_validate(app).model_dump(),
        job_title=job.title if job else None,
        interview_status=int_status,
        company_name=recruiter.company_name if recruiter else None,
        recruiter_name=recruiter.full_name if recruiter else None,
    )
