"""
api/admin.py - Admin Endpoints
================================
Admin (you!) can manage everything:
  GET    /api/admin/users              → List all users
  DELETE /api/admin/users/{id}         → Deactivate a user
  POST   /api/admin/questions          → Add a question to the bank
  GET    /api/admin/questions          → List all questions
  DELETE /api/admin/questions/{id}     → Delete a question
  GET    /api/admin/stats              → System overview stats
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User, UserRole
from app.models.interview import Interview
from app.models.question import Question, QuestionCategory, DifficultyLevel
from app.schemas.user import UserOut
from app.utils.helpers import get_current_user, require_role

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
    # ONLY admins can access these endpoints
    dependencies=[Depends(require_role([UserRole.admin]))]
)


# ─── Question Schema (defined here for simplicity) ──────────────────────────

class QuestionCreate(BaseModel):
    category: QuestionCategory
    difficulty: DifficultyLevel
    question_text: str
    ideal_answer: Optional[str] = None
    keywords: Optional[str] = None  # comma-separated: "leadership,conflict"


class QuestionOut(BaseModel):
    id: int
    category: QuestionCategory
    difficulty: DifficultyLevel
    question_text: str
    ideal_answer: Optional[str]
    keywords: Optional[str]

    class Config:
        from_attributes = True


# ─── User Management ─────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserOut])
def list_all_users(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Get all users (candidates + recruiters + admins)."""
    return db.query(User).all()


@router.delete("/users/{user_id}")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deactivate a user account (soft delete — doesn't actually delete from DB).
    The user won't be able to log in once deactivated.
    """
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_active = False
    db.commit()
    return {"message": f"User {user.email} has been deactivated."}


# ─── Question Bank Management ────────────────────────────────────────────────

@router.post("/questions", response_model=QuestionOut, status_code=201)
def add_question(question_data: QuestionCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Add a new question to the question bank."""
    question = Question(
        category=question_data.category,
        difficulty=question_data.difficulty,
        question_text=question_data.question_text,
        ideal_answer=question_data.ideal_answer,
        keywords=question_data.keywords
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.get("/questions", response_model=List[QuestionOut])
def list_questions(
    category: Optional[QuestionCategory] = None,
    difficulty: Optional[DifficultyLevel] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """
    List all questions. Can filter by category and/or difficulty.
    Example: GET /api/admin/questions?category=behavioral&difficulty=easy
    """
    query = db.query(Question)
    if category:
        query = query.filter(Question.category == category)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    return query.all()


@router.delete("/questions/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Permanently delete a question from the bank."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")
    db.delete(question)
    db.commit()
    return {"message": "Question deleted successfully."}


# ─── System Stats ─────────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Quick overview of the system for the admin dashboard."""
    return {
        "total_users": db.query(User).count(),
        "total_candidates": db.query(User).filter(User.role == UserRole.candidate).count(),
        "total_recruiters": db.query(User).filter(User.role == UserRole.recruiter).count(),
        "total_interviews": db.query(Interview).count(),
        "total_questions": db.query(Question).count(),
    }
