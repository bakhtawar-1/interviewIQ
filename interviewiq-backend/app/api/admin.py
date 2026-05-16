"""
api/admin.py - Admin Endpoints
================================
Admin manages the entire platform.

Endpoints:
  GET    /api/admin/users                       — list all users
  PATCH  /api/admin/users/{id}/activate         — reactivate user
  DELETE /api/admin/users/{id}                  — deactivate user
  POST   /api/admin/questions                   — add question to bank
  GET    /api/admin/questions                   — list questions
  DELETE /api/admin/questions/{id}              — delete question
  GET    /api/admin/stats                       — platform analytics
  GET    /api/admin/recruiters/pending          — pending recruiter approvals
  PATCH  /api/admin/recruiters/{id}/approve     — approve a recruiter
  PATCH  /api/admin/recruiters/{id}/reject      — reject a recruiter
  GET    /api/admin/settings                    — get system settings
  PATCH  /api/admin/settings                   — update system settings
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User, UserRole, ApprovalStatus
from app.models.interview import Interview
from app.models.job import Job
from app.models.application import Application
from app.models.question import Question, QuestionCategory, DifficultyLevel
from app.schemas.user import UserOut
from app.utils.helpers import get_current_user, require_role

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role([UserRole.admin]))]
)


# ─── Question Schemas ────────────────────────────────────────────────────────

class QuestionCreate(BaseModel):
    category: QuestionCategory
    difficulty: DifficultyLevel
    question_text: str
    ideal_answer: Optional[str] = None
    keywords: Optional[str] = None


class QuestionOut(BaseModel):
    id: int
    category: QuestionCategory
    difficulty: DifficultyLevel
    question_text: str
    ideal_answer: Optional[str]
    keywords: Optional[str]

    class Config:
        from_attributes = True


# ─── System Settings Schema ──────────────────────────────────────────────────

class SystemSettings(BaseModel):
    default_cv_threshold: Optional[float] = None        # 0-100
    default_passing_score: Optional[float] = None       # 0-100
    default_total_questions: Optional[int] = None       # 1-30
    default_time_limit_minutes: Optional[int] = None    # 5-180
    max_custom_questions_per_job: Optional[int] = None


class ApprovalRequest(BaseModel):
    reason: Optional[str] = None

# In-memory settings store (for demo; in production use a DB table)
_settings = {
    "default_cv_threshold": 65.0,
    "default_passing_score": 60.0,
    "default_total_questions": 10,
    "default_time_limit_minutes": 30,
    "max_custom_questions_per_job": 10,
}


# ─── User Management ─────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserOut])
def list_all_users(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Get all users across all roles."""
    return db.query(User).order_by(User.created_at.desc()).all()


@router.delete("/users/{user_id}")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deactivate (soft-delete) a user account."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account.")
    user = _get_user_or_404(user_id, db)
    user.is_active = False
    db.commit()
    return {"message": f"User {user.email} has been deactivated."}


@router.patch("/users/{user_id}/activate")
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """Re-activate a previously deactivated user account."""
    user = _get_user_or_404(user_id, db)
    user.is_active = True
    db.commit()
    return {"message": f"User {user.email} has been re-activated."}


# ─── Recruiter Approval Queue ─────────────────────────────────────────────────

@router.get("/recruiters/pending", response_model=List[UserOut])
def list_pending_recruiters(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """List all recruiters waiting for approval."""
    return (
        db.query(User)
        .filter(User.role == UserRole.recruiter, User.approval_status == ApprovalStatus.pending)
        .order_by(User.created_at.asc())
        .all()
    )


@router.patch("/recruiters/{user_id}/approve")
def approve_recruiter(
    user_id: int,
    approval_data: Optional[ApprovalRequest] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """Approve a pending recruiter — they can now log in."""
    from app.utils.notifications import notify_recruiter_approved
    user = _get_user_or_404(user_id, db)
    if user.role != UserRole.recruiter:
        raise HTTPException(status_code=400, detail="User is not a recruiter.")
    
    user.approval_status = ApprovalStatus.approved
    if approval_data and approval_data.reason:
        user.rejection_reason = approval_data.reason  # We can use same field for notes
    
    db.commit()
    try:
        notify_recruiter_approved(user.email, user.full_name, user.rejection_reason or "")
    except Exception:
        pass
    return {"message": f"Recruiter {user.email} has been approved."}


@router.patch("/recruiters/{user_id}/reject")
def reject_recruiter(
    user_id: int,
    approval_data: Optional[ApprovalRequest] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """Reject a recruiter registration."""
    from app.utils.notifications import notify_recruiter_rejected
    user = _get_user_or_404(user_id, db)
    if user.role != UserRole.recruiter:
        raise HTTPException(status_code=400, detail="User is not a recruiter.")
    
    user.approval_status = ApprovalStatus.rejected
    if approval_data and approval_data.reason:
        user.rejection_reason = approval_data.reason
    
    db.commit()
    try:
        notify_recruiter_rejected(user.email, user.full_name, user.rejection_reason or "")
    except Exception:
        pass
    return {"message": f"Recruiter {user.email} registration has been rejected."}


# ─── Question Bank Management ─────────────────────────────────────────────────

@router.post("/questions", response_model=QuestionOut, status_code=201)
def add_question(question_data: QuestionCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Add a new question to the global question bank."""
    q = Question(
        category=question_data.category,
        difficulty=question_data.difficulty,
        question_text=question_data.question_text,
        ideal_answer=question_data.ideal_answer,
        keywords=question_data.keywords
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.get("/questions", response_model=List[QuestionOut])
def list_questions(
    category: Optional[QuestionCategory] = None,
    difficulty: Optional[DifficultyLevel] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """List all questions. Filter by category and/or difficulty."""
    query = db.query(Question)
    if category:
        query = query.filter(Question.category == category)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    return query.all()


@router.put("/questions/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: int,
    question_data: QuestionCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """Update an existing question."""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")
    q.category = question_data.category
    q.difficulty = question_data.difficulty
    q.question_text = question_data.question_text
    q.ideal_answer = question_data.ideal_answer
    q.keywords = question_data.keywords
    db.commit()
    db.refresh(q)
    return q


@router.delete("/questions/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Permanently delete a question from the bank."""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")
    db.delete(q)
    db.commit()
    return {"message": "Question deleted successfully."}


# ─── Analytics / Stats ───────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Comprehensive platform analytics for the admin dashboard."""
    from app.models.application import ApplicationStatus
    from app.models.interview import InterviewStatus

    total_users = db.query(User).count()
    total_candidates = db.query(User).filter(User.role == UserRole.candidate).count()
    total_recruiters = db.query(User).filter(User.role == UserRole.recruiter).count()
    pending_recruiters = db.query(User).filter(
        User.role == UserRole.recruiter,
        User.approval_status == ApprovalStatus.pending
    ).count()

    total_jobs = db.query(Job).count()
    active_jobs = db.query(Job).filter(Job.is_active == True).count()

    total_applications = db.query(Application).count()
    shortlisted = db.query(Application).filter(Application.status == ApplicationStatus.shortlisted).count()
    rejected_apps = db.query(Application).filter(Application.status == ApplicationStatus.rejected).count()

    total_interviews = db.query(Interview).count()
    completed_interviews = db.query(Interview).filter(
        Interview.status == InterviewStatus.completed
    ).count()
    mock_interviews = db.query(Interview).filter(Interview.is_mock == True).count()

    total_questions = db.query(Question).count()

    # Average interview score
    scores = [
        r[0] for r in db.query(Interview.overall_score)
        .filter(Interview.overall_score != None).all()
    ]
    avg_score = round(sum(scores) / len(scores), 1) if scores else None

    return {
        "users": {
            "total": total_users,
            "candidates": total_candidates,
            "recruiters": total_recruiters,
            "pending_recruiter_approvals": pending_recruiters,
        },
        "jobs": {
            "total": total_jobs,
            "active": active_jobs,
        },
        "applications": {
            "total": total_applications,
            "shortlisted": shortlisted,
            "rejected": rejected_apps,
        },
        "interviews": {
            "total": total_interviews,
            "completed": completed_interviews,
            "mock": mock_interviews,
            "average_score": avg_score,
        },
        "question_bank": {
            "total_questions": total_questions,
        }
    }


# ─── System Settings ─────────────────────────────────────────────────────────

@router.get("/settings")
def get_settings(_=Depends(get_current_user)):
    """Get global platform settings."""
    return _settings


@router.patch("/settings")
def update_settings(settings: SystemSettings, _=Depends(get_current_user)):
    """Update one or more global platform settings."""
    updated = {}
    for key, value in settings.model_dump(exclude_unset=True).items():
        if value is not None:
            _settings[key] = value
            updated[key] = value
    return {"message": "Settings updated.", "updated": updated, "current": _settings}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _get_user_or_404(user_id: int, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user
