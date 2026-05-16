"""
api/recruiter_review.py - Recruiter Application Review Endpoints
=================================================================
Recruiters see all applications for their jobs, view full AI reports,
override scores, add notes, and make final shortlist/reject decisions.

GET   /api/recruiter/applications                 — list all applications for my jobs
GET   /api/recruiter/applications/{id}            — full application detail
PATCH /api/recruiter/applications/{id}/review     — shortlist or reject (with notes)
GET   /api/recruiter/applications/{id}/interview  — get interview data for an application
"""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.application import Application, ApplicationStatus
from app.models.interview import Interview
from app.models.response import InterviewSummary, InterviewResponse
from app.models.question import Question
from app.schemas.application import ApplicationDetailOut, RecruiterReviewInput
from app.utils.helpers import get_current_user, require_role

router = APIRouter(
    prefix="/api/recruiter/applications",
    tags=["Applications — Recruiter Review"],
    dependencies=[Depends(require_role([UserRole.recruiter, UserRole.admin]))]
)


@router.get("", response_model=List[ApplicationDetailOut])
def list_applications_for_my_jobs(
    job_id: Optional[int] = None,
    status: Optional[ApplicationStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all applications for jobs posted by this recruiter.
    Optionally filter by job_id or application status.
    """
    # Get all jobs by this recruiter (if not admin)
    query = db.query(Application)
    
    if current_user.role != UserRole.admin:
        my_job_ids = [
            j.id for j in db.query(Job).filter(Job.recruiter_id == current_user.id).all()
        ]
        if not my_job_ids:
            return []
        query = query.filter(Application.job_id.in_(my_job_ids))
    
    if job_id:
        query = query.filter(Application.job_id == job_id)
    if status:
        query = query.filter(Application.status == status)

    apps = query.order_by(Application.created_at.desc()).all()

    result = []
    for app in apps:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        candidate = db.query(User).filter(User.id == app.candidate_id).first()
        interview_score = app.interview.overall_score if app.interview else None
        int_status = app.interview.status.value if app.interview and hasattr(app.interview.status, 'value') else (app.interview.status if app.interview else None)
        
        # Fetch summary scores
        tech_score = None
        comm_score = None
        conf_score = None
        if app.interview_id:
            summary = db.query(InterviewSummary).filter(InterviewSummary.interview_id == app.interview_id).first()
            if summary:
                tech_score = summary.technical_score
                comm_score = summary.communication_score
                conf_score = summary.confidence_score

        result.append(ApplicationDetailOut(
            **_app_base(app),
            job_title=job.title if job else None,
            interview_status=int_status,
            candidate_name=candidate.full_name if candidate else None,
            candidate_email=candidate.email if candidate else None,
            interview_overall_score=interview_score,
            technical_score=tech_score,
            communication_score=comm_score,
            confidence_score=conf_score,
        ))
    return result


@router.get("/{application_id}", response_model=ApplicationDetailOut)
def get_application_detail(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full detail of a single application (must be for one of your jobs)."""
    app = _get_application_or_403(application_id, current_user, db)
    job = db.query(Job).filter(Job.id == app.job_id).first()
    candidate = db.query(User).filter(User.id == app.candidate_id).first()
    interview_score = app.interview.overall_score if app.interview else None
    # Fetch summary scores
    tech_score = None
    comm_score = None
    conf_score = None
    if app.interview_id:
        summary = db.query(InterviewSummary).filter(InterviewSummary.interview_id == app.interview_id).first()
        if summary:
            tech_score = summary.technical_score
            comm_score = summary.communication_score
            conf_score = summary.confidence_score

    return ApplicationDetailOut(
        **_app_base(app),
        job_title=job.title if job else None,
        candidate_name=candidate.full_name if candidate else None,
        candidate_email=candidate.email if candidate else None,
        interview_overall_score=interview_score,
        technical_score=tech_score,
        communication_score=comm_score,
        confidence_score=conf_score,
    )


@router.patch("/{application_id}/review")
def review_application(
    application_id: int,
    review: RecruiterReviewInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Make a final decision on a candidate: shortlist or reject.
    Optionally override the AI score and add private notes.
    """
    from app.utils.notifications import notify_candidate_shortlisted, notify_candidate_rejected

    app = _get_application_or_403(application_id, current_user, db)

    if review.decision not in ("shortlist", "reject"):
        raise HTTPException(status_code=400, detail="Decision must be 'shortlist' or 'reject'.")

    # Apply fields
    if review.recruiter_override_score is not None:
        app.recruiter_override_score = review.recruiter_override_score
    if review.recruiter_notes is not None:
        app.recruiter_notes = review.recruiter_notes
    if review.rejection_reason is not None:
        app.rejection_reason = review.rejection_reason

    app.final_decision_by = current_user.id
    app.decided_at = datetime.now(timezone.utc)

    if review.decision == "shortlist":
        app.status = ApplicationStatus.shortlisted
    else:
        app.status = ApplicationStatus.rejected

    db.commit()
    db.refresh(app)

    # Notify candidate
    try:
        candidate = db.query(User).filter(User.id == app.candidate_id).first()
        job = db.query(Job).filter(Job.id == app.job_id).first()
        if candidate and job:
            if review.decision == "shortlist":
                notify_candidate_shortlisted(
                    candidate_email=candidate.email,
                    candidate_name=candidate.full_name,
                    job_title=job.title,
                )
            else:
                notify_candidate_rejected(
                    candidate_email=candidate.email,
                    candidate_name=candidate.full_name,
                    job_title=job.title,
                    feedback=review.rejection_reason or "",
                )
    except Exception:
        pass

    return {
        "message": f"Application {review.decision}ed successfully.",
        "application_id": application_id,
        "status": app.status,
    }


@router.get("/{application_id}/interview-report")
def get_interview_report_for_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get the full interview report for an application:
    summary scores, per-question answers, AI feedback, proctoring data.
    """
    app = _get_application_or_403(application_id, current_user, db)

    if not app.interview_id:
        return {"message": "No interview has been taken for this application yet."}

    inv = db.query(Interview).filter(Interview.id == app.interview_id).first()
    summary = db.query(InterviewSummary).filter(
        InterviewSummary.interview_id == app.interview_id
    ).first()

    # Per-question answers
    rows = (
        db.query(InterviewResponse, Question.question_text)
        .join(Question, Question.id == InterviewResponse.question_id)
        .filter(InterviewResponse.interview_id == app.interview_id)
        .order_by(InterviewResponse.responded_at.asc())
        .all()
    )
    qa = []
    if rows:
        qa = [
            {
                "question": qtext,
                "answer": r.response_text,
                "score": r.score,
                "feedback": r.feedback,
            }
            for r, qtext in rows
        ]
    elif summary and summary.report_json:
        import json
        try:
            data = json.loads(summary.report_json)
            for item in data.get("questions", []):
                qa.append({
                    "question": item.get("question"),
                    "answer": item.get("answer"),
                    "score": item.get("score"),
                    "feedback": item.get("feedback"),
                })
        except Exception:
            pass

    # Dynamic override for disqualified sessions
    if inv and (inv.status.value == 'disqualified' if hasattr(inv.status, 'value') else inv.status == 'disqualified'):
        if summary:
            summary.strengths = "N/A - Candidate disqualified due to proctoring violations."
            summary.weaknesses = "High violation count detected. Candidate exceeded the maximum allowed proctoring violations."
            summary.recommendations = "Rejected due to security/proctoring violations. Not recommended for further rounds."

    return {
        "interview_id": app.interview_id,
        "overall_score": inv.overall_score if inv else None,
        "status": inv.status if inv else None,
        "started_at": inv.started_at if inv else None,
        "completed_at": inv.completed_at if inv else None,
        "summary": {
            "communication_score": summary.communication_score if summary else None,
            "technical_score": summary.technical_score if summary else None,
            "confidence_score": summary.confidence_score if summary else None,
            "strengths": summary.strengths if summary else None,
            "weaknesses": summary.weaknesses if summary else None,
            "recommendations": summary.recommendations if summary else None,
        } if summary else None,
        "questions_and_answers": qa,
    }


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _app_base(app: Application) -> dict:
    from app.schemas.application import ApplicationDetailOut
    return {
        "id": app.id,
        "candidate_id": app.candidate_id,
        "job_id": app.job_id,
        "cv_match_score": app.cv_match_score,
        "cv_match_breakdown": app.cv_match_breakdown,
        "status": app.status,
        "rejection_reason": app.rejection_reason,
        "ai_recommended": app.ai_recommended,
        "recruiter_override_score": app.recruiter_override_score,
        "interview_id": app.interview_id,
        "created_at": app.created_at,
        "updated_at": app.updated_at,
    }


def _get_application_or_403(application_id: int, current_user: User, db: Session) -> Application:
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    # Verify the application belongs to one of this recruiter's jobs
    job = db.query(Job).filter(Job.id == app.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Associated job not found.")
    if current_user.role != UserRole.admin and job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="This application is not for your job.")
    return app
